import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  completedCount,
  fullTimeline,
  getMilestones,
  normalizeAwb,
  pushToCargoWise,
} from '@/lib/milestones';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST /api/cargowise/push
//   { masterBillNumber }
//
// The CargoWise e-adapter integration point. Takes the shipment's current
// milestones and pushes them to CargoWise through the e-adapter REST API
// (CARGOWISE_EADAPTER_URL / CARGOWISE_EADAPTER_TOKEN). Without that config the
// push is simulated and acknowledged so the flow still runs end to end.
// Every push is logged in integration_events. Requires a signed-in user.
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { masterBillNumber?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const mbn = normalizeAwb(body.masterBillNumber ?? '');
  if (!mbn) {
    return NextResponse.json({ error: 'Invalid air waybill number' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: awb } = await admin
    .from('air_waybills')
    .select('master_bill_number, flight, origin, destination, commodity, status')
    .eq('master_bill_number', mbn)
    .maybeSingle();
  if (!awb) {
    return NextResponse.json({ error: `No shipment found for ${mbn}` }, { status: 404 });
  }

  const timeline = fullTimeline(mbn, await getMilestones(admin, mbn));
  const done = completedCount(timeline);

  const event = await pushToCargoWise(admin, {
    masterBillNumber: mbn,
    summary: `${done} of ${timeline.length} milestones pushed to CargoWise`,
    payload: {
      masterBillNumber: mbn,
      flight: awb.flight,
      origin: awb.origin,
      destination: awb.destination,
      commodity: awb.commodity,
      status: awb.status,
      milestonesPushed: done,
      milestones: timeline.map((m) => ({
        code: m.code,
        status: m.status,
        occurredAt: m.occurred_at,
        location: m.location,
      })),
    },
  });

  return NextResponse.json({
    ok: event.status !== 'FAILED',
    masterBillNumber: mbn,
    status: event.status,
    reference: event.external_ref,
    event,
  });
}
