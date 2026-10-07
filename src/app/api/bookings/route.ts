import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { extractToolCalls, toolResults } from '@/lib/vapi-tools';
import { normalizeFlight, pushToCargoWise } from '@/lib/milestones';
import type { Booking, Customer } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST /api/bookings
//   { customerName | customerId, commodity, pieces, weightKg, requestedDate,
//     flight?, notes?, vapiCallId? }
//
// Creates a shipment booking for a (recurring) client and pushes it to
// CargoWise through the e-adapter. Handles the Vapi tool-call envelope — so
// the voice agent can book on a client's behalf — and a plain body from the
// dashboard (which requires a signed-in user).
// ---------------------------------------------------------------------------

interface BookingArgs {
  customerId?: string;
  customerName?: string;
  commodity?: string;
  pieces?: number | string;
  weightKg?: number | string;
  requestedDate?: string;
  flight?: string;
  notes?: string;
  vapiCallId?: string;
}

type BookingOutcome =
  | { ok: true; spoken: string; bookingNumber: string; cargowiseRef: string | null; booking: Booking }
  | { ok: false; spoken: string; status: number };

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// Accepts "2026-10-09", "October 9", "next Tuesday"-style text is NOT parsed —
// only real dates. Returns YYYY-MM-DD or null.
function toDateOnly(v: unknown): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function bookingNumberFor(n: number | null | undefined): string {
  return `BK-${String(n ?? 0).padStart(4, '0')}`;
}

async function createBooking(
  args: BookingArgs,
  source: 'dashboard' | 'voice_agent',
): Promise<BookingOutcome> {
  const admin = createAdminClient();

  // Resolve the client: by id, else by (case-insensitive) name or account code.
  let customer: Customer | null = null;
  if (args.customerId) {
    const { data } = await admin.from('customers').select('*').eq('id', args.customerId).maybeSingle();
    customer = (data as Customer) ?? null;
  } else if (args.customerName) {
    const needle = args.customerName.trim();
    const { data } = await admin
      .from('customers')
      .select('*')
      .or(`name.ilike.%${needle}%,account_code.ilike.${needle}`)
      .limit(1)
      .maybeSingle();
    customer = (data as Customer) ?? null;
  }
  const customerName = customer?.name ?? args.customerName?.trim();
  if (!customerName) {
    return { ok: false, status: 400, spoken: 'I need the client name to create a booking.' };
  }

  const pieces = toNumber(args.pieces);
  const weightKg = toNumber(args.weightKg);
  const requestedDate = toDateOnly(args.requestedDate);
  const flight = args.flight ? normalizeFlight(args.flight) : null;
  const commodity = args.commodity?.trim() || customer?.default_commodity || null;

  const { data, error } = await admin
    .from('bookings')
    .insert({
      customer_id: customer?.id ?? null,
      customer_name: customerName,
      origin: customer?.default_origin ?? 'MIA',
      destination: customer?.default_destination ?? 'SJU',
      commodity,
      pieces: pieces != null ? Math.round(pieces) : null,
      weight_kg: weightKg,
      requested_date: requestedDate,
      flight,
      status: 'CONFIRMED',
      source,
      vapi_call_id: args.vapiCallId ?? null,
      notes: args.notes ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    return { ok: false, status: 500, spoken: 'I could not create the booking.' };
  }
  let booking = data as Booking;
  const bookingNumber = bookingNumberFor(booking.number);

  // Create it in CargoWise through the e-adapter and keep the reference.
  const event = await pushToCargoWise(admin, {
    bookingId: booking.id,
    summary: `Booking ${bookingNumber} created in CargoWise`,
    payload: {
      bookingNumber,
      customer: customerName,
      accountCode: customer?.account_code ?? null,
      origin: booking.origin,
      destination: booking.destination,
      commodity,
      pieces: booking.pieces,
      weightKg: booking.weight_kg,
      requestedDate,
      flight,
      source,
    },
  });
  if (event.external_ref) {
    const { data: updated } = await admin
      .from('bookings')
      .update({ cargowise_ref: event.external_ref })
      .eq('id', booking.id)
      .select()
      .single();
    if (updated) booking = updated as Booking;
  }

  const when = requestedDate
    ? new Date(`${requestedDate}T12:00:00`).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
      })
    : 'a date to be confirmed';
  const what = [
    pieces != null ? `${Math.round(pieces)} piece${Math.round(pieces) === 1 ? '' : 's'}` : null,
    commodity ? `of ${commodity}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  const spoken =
    `Booking ${bookingNumber} is confirmed for ${customerName}` +
    (what ? `, ${what}` : '') +
    `, ${booking.origin} to ${booking.destination}, ready on ${when}.` +
    (booking.cargowise_ref ? ` It has been created in CargoWise, reference ${booking.cargowise_ref}.` : '');

  return { ok: true, spoken, bookingNumber, cargowiseRef: booking.cargowise_ref, booking };
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Vapi tool-call path (the voice agent booking on a client's behalf).
  const toolCalls = extractToolCalls(body);
  if (toolCalls.length > 0) {
    const results = [];
    for (const call of toolCalls) {
      const outcome = await createBooking(call.args as BookingArgs, 'voice_agent');
      results.push({ toolCallId: call.id, result: outcome.spoken });
    }
    return NextResponse.json(toolResults(results));
  }

  // Dashboard path — requires a signed-in user.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const outcome = await createBooking(body as BookingArgs, 'dashboard');
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.spoken }, { status: outcome.status });
  }
  return NextResponse.json({
    ok: true,
    bookingNumber: outcome.bookingNumber,
    cargowiseRef: outcome.cargowiseRef,
    message: outcome.spoken,
    booking: outcome.booking,
  });
}
