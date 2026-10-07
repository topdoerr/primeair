import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { normalizeAwb, normalizeFlight, pullFromPortal } from '@/lib/milestones';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST /api/tracking/pull
//   { masterBillNumber } | { flight }
//
// "Pull from cargo portals": look the shipment(s) up on the carrier's cargo
// portal and record the milestone(s) it reports. A flight number pulls every
// AWB on that flight. Requires a signed-in dashboard user.
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { masterBillNumber?: string; flight?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const admin = createAdminClient();

  if (body.masterBillNumber) {
    const mbn = normalizeAwb(body.masterBillNumber);
    if (!mbn) {
      return NextResponse.json({ error: 'Invalid air waybill number' }, { status: 400 });
    }
    const { data: awb } = await admin
      .from('air_waybills')
      .select('master_bill_number')
      .eq('master_bill_number', mbn)
      .maybeSingle();
    if (!awb) {
      return NextResponse.json({ error: `No shipment found for ${mbn}` }, { status: 404 });
    }
    const result = await pullFromPortal(admin, mbn);
    return NextResponse.json({ ok: true, masterBillNumber: mbn, ...result });
  }

  if (body.flight) {
    const flight = normalizeFlight(body.flight);
    if (!flight) {
      return NextResponse.json({ error: 'Invalid flight number' }, { status: 400 });
    }
    const { data: awbs } = await admin
      .from('air_waybills')
      .select('master_bill_number')
      .eq('flight', flight);
    const list = (awbs ?? []) as { master_bill_number: string }[];
    if (list.length === 0) {
      return NextResponse.json({ error: `No shipments on flight ${flight}` }, { status: 404 });
    }
    const results = [];
    for (const a of list) {
      const r = await pullFromPortal(admin, a.master_bill_number);
      results.push({ masterBillNumber: a.master_bill_number, advanced: r.advanced });
    }
    return NextResponse.json({ ok: true, flight, results });
  }

  return NextResponse.json(
    { error: 'Provide a masterBillNumber or a flight' },
    { status: 400 },
  );
}
