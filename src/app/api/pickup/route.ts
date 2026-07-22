import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { extractToolCalls, toolResults } from '@/lib/vapi-tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST /api/pickup
//   { masterBillNumber, windowStart, windowEnd, contact?, vapiCallId? }
//
// Scheduling tool the assistant calls to book a pickup/delivery window.
// Handles the Vapi tool-call envelope (returns { results: [...] }) and a plain
// body for direct testing. Pilot scope: Supabase only (no calendar sync).
// ---------------------------------------------------------------------------

function normalizeAwb(input: string): string | null {
  const digits = (input || '').replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('810')) return `810-${digits.slice(3)}`;
  const trimmed = (input || '').trim();
  if (/^810-[0-9]{8}$/.test(trimmed)) return trimmed;
  return null;
}

interface PickupArgs {
  masterBillNumber?: string;
  windowStart?: string;
  windowEnd?: string;
  contact?: string;
  vapiCallId?: string;
  source?: string;
}

type PickupOutcome =
  | { ok: true; spoken: string; confirmationNumber: string; pickup: unknown }
  | { ok: false; spoken: string; status: number };

async function schedulePickup(args: PickupArgs): Promise<PickupOutcome> {
  const mbn = normalizeAwb(args.masterBillNumber ?? '');
  if (!mbn) {
    return { ok: false, status: 400, spoken: 'A valid air waybill number is required.' };
  }

  const start = args.windowStart ? new Date(args.windowStart) : null;
  const end = args.windowEnd ? new Date(args.windowEnd) : null;
  if (!start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
    return {
      ok: false,
      status: 400,
      spoken: 'I need a valid start and end time for the pickup window.',
    };
  }
  if (end.getTime() <= start.getTime()) {
    return { ok: false, status: 400, spoken: 'The pickup window end must be after the start.' };
  }

  const supabase = createAdminClient();

  const { data: awb } = await supabase
    .from('air_waybills')
    .select('master_bill_number')
    .eq('master_bill_number', mbn)
    .maybeSingle();
  if (!awb) {
    return { ok: false, status: 404, spoken: `I could not find any shipment for ${mbn}.` };
  }

  const { data, error } = await supabase
    .from('pickups')
    .insert({
      master_bill_number: mbn,
      window_start: start.toISOString(),
      window_end: end.toISOString(),
      contact: args.contact ?? null,
      status: 'SCHEDULED',
      source: args.source === 'dashboard' ? 'dashboard' : 'voice_agent',
      vapi_call_id: args.vapiCallId ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, status: 500, spoken: 'I could not create the pickup.' };

  const confirmationNumber = `PU-${String(data.number ?? 0).padStart(4, '0')}`;
  const spoken =
    `Pickup for ${mbn} is scheduled from ${start.toLocaleString('en-US')} ` +
    `to ${end.toLocaleString('en-US')}. Your confirmation number is ${confirmationNumber}.`;

  return { ok: true, spoken, confirmationNumber, pickup: data };
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Vapi tool-call path.
  const toolCalls = extractToolCalls(body);
  if (toolCalls.length > 0) {
    const results = [];
    for (const call of toolCalls) {
      const outcome = await schedulePickup(call.args as PickupArgs);
      results.push({ toolCallId: call.id, result: outcome.spoken });
    }
    return NextResponse.json(toolResults(results));
  }

  // Plain-body path (direct testing).
  const outcome = await schedulePickup(body as PickupArgs);
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.spoken }, { status: outcome.status });
  }
  return NextResponse.json({
    ok: true,
    confirmationNumber: outcome.confirmationNumber,
    message: outcome.spoken,
    pickup: outcome.pickup,
  });
}
