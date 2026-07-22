import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { reconcile, formatUSD } from '@/lib/reconcile';
import { extractToolCalls, toolResults } from '@/lib/vapi-tools';
import type { AwbLookupResult } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST /api/awb-lookup
//
// The lookup tool the "Prime Air AWB Status" assistant calls DURING a call.
// Vapi sends a { message: { toolCallList: [...] } } envelope and expects a
// { results: [{ toolCallId, result }] } response. We also accept a plain
// { masterBillNumber } body for direct testing.
// ---------------------------------------------------------------------------

// Callers/STT send AWBs many ways: "810-21961413", "81021961413",
// "810 2196 1413". Normalize to canonical 810-XXXXXXXX.
function normalizeAwb(input: string): string | null {
  const digits = (input || '').replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('810')) return `810-${digits.slice(3)}`;
  const trimmed = (input || '').trim();
  if (/^810-[0-9]{8}$/.test(trimmed)) return trimmed;
  return null;
}

type LookupOutcome =
  | { ok: true; data: AwbLookupResult; spoken: string }
  | { ok: false; spoken: string; status: number };

async function lookupAwb(rawInput: string): Promise<LookupOutcome> {
  const mbn = normalizeAwb(rawInput);
  if (!mbn) {
    return {
      ok: false,
      status: 400,
      spoken:
        'I could not read that air waybill number. It should be 810 followed by eight digits.',
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('air_waybills')
    .select('*')
    .eq('master_bill_number', mbn)
    .maybeSingle();

  if (error) return { ok: false, status: 500, spoken: 'The lookup failed. Please try again.' };
  if (!data) {
    return {
      ok: false,
      status: 404,
      spoken: `I could not find any shipment for ${mbn}.`,
    };
  }

  const availableForPickup = data.status === 'AVAILABLE';
  const cargoReady =
    Boolean(data.cargo_ready_at) && new Date(data.cargo_ready_at).getTime() <= Date.now();
  const { status: recon } = reconcile(
    Number(data.weight_charge),
    Number(data.other_charges),
    Number(data.total_collect),
  );

  const chargesSummary =
    `Weight charge ${formatUSD(Number(data.weight_charge))}, ` +
    `other charges ${formatUSD(Number(data.other_charges))}, ` +
    `total collect ${formatUSD(Number(data.total_collect))}` +
    (recon === 'FLAGGED' ? ' (charges under review)' : '') +
    '.';

  const result: AwbLookupResult = {
    masterBillNumber: data.master_bill_number,
    flight: data.flight,
    origin: data.origin,
    destination: data.destination,
    status: data.status,
    cargoReady,
    availableForPickup,
    chargesSummary,
    commodity: data.commodity,
  };

  const spoken =
    `Air waybill ${data.master_bill_number}: flight ${data.flight}, ` +
    `${data.origin} to ${data.destination}, ${data.commodity ?? 'cargo'}. ` +
    `Status is ${String(data.status).toLowerCase().replace(/_/g, ' ')}. ` +
    `${availableForPickup ? 'It is available for pickup.' : 'It is not yet available for pickup.'} ` +
    chargesSummary;

  return { ok: true, data, spoken };
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
      const input = String(call.args.masterBillNumber ?? call.args.awb ?? '');
      const outcome = await lookupAwb(input);
      results.push({ toolCallId: call.id, result: outcome.spoken });
    }
    return NextResponse.json(toolResults(results));
  }

  // Plain-body path (direct testing).
  const outcome = await lookupAwb(String(body?.masterBillNumber ?? ''));
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.spoken }, { status: outcome.status });
  }
  return NextResponse.json(outcome.data);
}
