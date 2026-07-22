import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST /api/pickup
//   { masterBillNumber, windowStart, windowEnd, contact?, vapiCallId? }
//   -> { ok, pickup }
//
// Scheduling tool the assistant calls to book a pickup/delivery window.
// Pilot scope: writes to Supabase only (no external calendar sync).
// ---------------------------------------------------------------------------

function normalizeAwb(input: string): string | null {
  const digits = (input || '').replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('810')) return `810-${digits.slice(3)}`;
  const trimmed = (input || '').trim();
  if (/^810-[0-9]{8}$/.test(trimmed)) return trimmed;
  return null;
}

export async function POST(req: Request) {
  let body: {
    masterBillNumber?: string;
    windowStart?: string;
    windowEnd?: string;
    contact?: string;
    vapiCallId?: string;
    source?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const mbn = normalizeAwb(body.masterBillNumber ?? '');
  if (!mbn) {
    return NextResponse.json(
      { error: 'A valid air waybill number (810-XXXXXXXX) is required.' },
      { status: 400 },
    );
  }

  const start = body.windowStart ? new Date(body.windowStart) : null;
  const end = body.windowEnd ? new Date(body.windowEnd) : null;
  if (!start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
    return NextResponse.json(
      { error: 'windowStart and windowEnd must be valid ISO timestamps.' },
      { status: 400 },
    );
  }
  if (end.getTime() <= start.getTime()) {
    return NextResponse.json(
      { error: 'windowEnd must be after windowStart.' },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Guard: the AWB must exist (FK would reject anyway, but give a clear error).
  const { data: awb } = await supabase
    .from('air_waybills')
    .select('master_bill_number')
    .eq('master_bill_number', mbn)
    .maybeSingle();
  if (!awb) {
    return NextResponse.json(
      { error: `No air waybill found for ${mbn}.` },
      { status: 404 },
    );
  }

  const { data, error } = await supabase
    .from('pickups')
    .insert({
      master_bill_number: mbn,
      window_start: start.toISOString(),
      window_end: end.toISOString(),
      contact: body.contact ?? null,
      status: 'SCHEDULED',
      source: body.source === 'dashboard' ? 'dashboard' : 'voice_agent',
      vapi_call_id: body.vapiCallId ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Could not create pickup.' }, { status: 500 });
  }

  const spoken =
    `Pickup for ${mbn} is scheduled from ` +
    `${start.toLocaleString('en-US')} to ${end.toLocaleString('en-US')}.`;

  return NextResponse.json({ ok: true, message: spoken, pickup: data });
}
