import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { reconcile, formatUSD } from '@/lib/reconcile';
import type { AwbLookupResult } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST /api/awb-lookup   { masterBillNumber }  -> AwbLookupResult
//
// This is the function/MCP tool the "Prime Air AWB Status" assistant calls
// DURING a live call to answer "where is my cargo / when can I pick it up".
// It reads from Supabase with the service-role key (the caller is Vapi, not a
// signed-in user). Keep the response short and speakable.
// ---------------------------------------------------------------------------

// Callers (and speech-to-text) send AWBs in many shapes: "810-21961413",
// "81021961413", "810 2196 1413". Normalize to canonical 810-XXXXXXXX.
function normalizeAwb(input: string): string | null {
  const digits = (input || '').replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('810')) {
    return `810-${digits.slice(3)}`;
  }
  // Already canonical?
  const trimmed = (input || '').trim();
  if (/^810-[0-9]{8}$/.test(trimmed)) return trimmed;
  return null;
}

export async function POST(req: Request) {
  let body: { masterBillNumber?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const mbn = normalizeAwb(body.masterBillNumber ?? '');
  if (!mbn) {
    return NextResponse.json(
      {
        error:
          'Could not read the air waybill number. It should be 810 followed by eight digits.',
      },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('air_waybills')
    .select('*')
    .eq('master_bill_number', mbn)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: `No air waybill found for ${mbn}.`, masterBillNumber: mbn },
      { status: 404 },
    );
  }

  const availableForPickup = data.status === 'AVAILABLE';
  const cargoReady =
    Boolean(data.cargo_ready_at) &&
    new Date(data.cargo_ready_at).getTime() <= Date.now();

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

  return NextResponse.json(result);
}
