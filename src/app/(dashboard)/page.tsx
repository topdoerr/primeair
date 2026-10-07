import { createClient } from '@/lib/supabase/server';
import { OverviewView } from '@/components/views/OverviewView';
import type {
  AirWaybill,
  Booking,
  CallRecord,
  IntegrationEvent,
  ShipmentMilestone,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export default async function OverviewPage() {
  const supabase = createClient();
  const todayISO = startOfTodayISO();

  const [
    { data: awbRows },
    { data: msRows },
    { data: pushRows },
    { data: bookingRows },
    { data: callsToday },
  ] = await Promise.all([
    supabase.from('air_waybills').select('*').order('updated_at', { ascending: false }),
    supabase.from('shipment_milestones').select('*').order('sequence', { ascending: true }),
    supabase
      .from('integration_events')
      .select('*')
      .eq('kind', 'CARGOWISE_PUSH')
      .gte('created_at', todayISO),
    supabase
      .from('bookings')
      .select('*')
      .gte('created_at', daysAgoISO(7))
      .order('created_at', { ascending: false }),
    supabase.from('calls').select('*').gte('started_at', todayISO),
  ]);

  const awbs = (awbRows ?? []) as AirWaybill[];
  const milestones = (msRows ?? []) as ShipmentMilestone[];
  const pushesToday = (pushRows ?? []) as IntegrationEvent[];
  const bookings = (bookingRows ?? []) as Booking[];
  const calls = (callsToday ?? []) as CallRecord[];

  return (
    <OverviewView
      awbs={awbs}
      milestones={milestones}
      pushesToday={pushesToday}
      bookings={bookings}
      calls={calls}
    />
  );
}
