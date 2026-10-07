import { createClient } from '@/lib/supabase/server';
import { TrackingView, type Tracked } from '@/components/views/TrackingView';
import {
  completedCount,
  currentMilestone,
  fullTimeline,
  normalizeAwb,
  normalizeFlight,
} from '@/lib/milestones';
import type { AirWaybill, IntegrationEvent, ShipmentMilestone } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? '').trim();
  const mbn = q ? normalizeAwb(q) : null;
  const flight = q && !mbn ? normalizeFlight(q) : null;
  const supabase = createClient();

  // Shipments in scope: one AWB, one flight, or everything.
  let awbQuery = supabase.from('air_waybills').select('*').order('updated_at', { ascending: false });
  if (mbn) awbQuery = awbQuery.eq('master_bill_number', mbn);
  else if (flight) awbQuery = awbQuery.eq('flight', flight);
  const { data: awbRows } = await awbQuery;
  const awbs = (awbRows ?? []) as AirWaybill[];
  const ids = awbs.map((a) => a.master_bill_number);

  const [{ data: msRows }, { data: evRows }] = ids.length
    ? await Promise.all([
        supabase
          .from('shipment_milestones')
          .select('*')
          .in('master_bill_number', ids)
          .order('sequence', { ascending: true }),
        supabase
          .from('integration_events')
          .select('*')
          .in('master_bill_number', ids)
          .order('created_at', { ascending: false })
          .limit(200),
      ])
    : [{ data: [] }, { data: [] }];
  const milestones = (msRows ?? []) as ShipmentMilestone[];
  const events = (evRows ?? []) as IntegrationEvent[];

  const tracked: Tracked[] = awbs.map((awb) => {
    const timeline = fullTimeline(
      awb.master_bill_number,
      milestones.filter((m) => m.master_bill_number === awb.master_bill_number),
    );
    return {
      awb,
      timeline,
      current: currentMilestone(timeline),
      done: completedCount(timeline),
      lastPush:
        events.find(
          (e) => e.master_bill_number === awb.master_bill_number && e.kind === 'CARGOWISE_PUSH',
        ) ?? null,
    };
  });

  const notFound = Boolean(q) && tracked.length === 0;
  const detail = mbn && tracked.length === 1 ? tracked[0] : null;

  return (
    <TrackingView
      q={q}
      flight={flight}
      tracked={tracked}
      detail={detail}
      events={events}
      notFound={notFound}
    />
  );
}
