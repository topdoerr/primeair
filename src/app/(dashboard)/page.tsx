import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { KpiCard, Card, PageHeader, Badge, IntentBadge } from '@/components/ui';
import {
  MILESTONE_STEPS,
  completedCount,
  currentMilestone,
  fullTimeline,
} from '@/lib/milestones';
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

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  const inTransit = awbs.filter((a) => a.status === 'IN_TRANSIT').length;
  const arrived = awbs.filter((a) => a.status === 'ARRIVED').length;
  const available = awbs.filter((a) => a.status === 'AVAILABLE').length;
  const pushesAck = pushesToday.filter((p) => p.status === 'ACKNOWLEDGED').length;
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;

  const snapshot = awbs.map((awb) => {
    const timeline = fullTimeline(
      awb.master_bill_number,
      milestones.filter((m) => m.master_bill_number === awb.master_bill_number),
    );
    return { awb, current: currentMilestone(timeline), done: completedCount(timeline) };
  });

  const selfServed = calls.filter((c) => c.outcome === 'self_served').length;
  const selfServedPct = calls.length > 0 ? Math.round((selfServed / calls.length) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Milestone tracking, CargoWise sync, bookings, and the voice agent — Prime Air logistics at a glance"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Shipments tracked"
          value={awbs.length}
          hint={`${inTransit} in transit · ${arrived} arrived · ${available} available`}
        />
        <KpiCard label="In transit" value={inTransit} hint="MIA → SJU, milestones updating" />
        <KpiCard
          label="CargoWise syncs today"
          value={pushesToday.length}
          hint={`${pushesAck} acknowledged via e-adapter`}
        />
        <KpiCard
          label="Bookings (7 days)"
          value={bookings.length}
          hint={`${confirmedBookings} confirmed · created in CargoWise`}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Milestone snapshot</div>
            <Link
              href="/tracking"
              className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50"
            >
              {'Open tracking →'}
            </Link>
          </div>
          {snapshot.length === 0 ? (
            <p className="text-sm text-slate-400">No shipments tracked yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {snapshot.map(({ awb, current, done }) => {
                const pct = Math.round((done / MILESTONE_STEPS.length) * 100);
                return (
                  <li key={awb.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tracking?q=${encodeURIComponent(awb.master_bill_number)}`}
                          className="font-mono text-xs text-brand-600 hover:underline"
                        >
                          {awb.master_bill_number}
                        </Link>
                        <span className="text-xs text-slate-400">
                          {awb.flight ?? '—'} · {awb.commodity ?? 'Cargo'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                        {current ? (
                          <>
                            <Badge>{current.status}</Badge>
                            <span>{current.label}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">Not started</span>
                        )}
                      </div>
                    </div>
                    <div className="w-32 shrink-0">
                      <div className="mb-1 text-right text-[11px] text-slate-400">
                        {done}/{MILESTONE_STEPS.length}
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-accent-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Recent bookings</div>
            <Link
              href="/bookings"
              className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50"
            >
              {'View all →'}
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-400">No bookings in the last 7 days.</p>
          ) : (
            <ul className="space-y-3">
              {bookings.slice(0, 5).map((b) => (
                <li key={b.id} className="rounded-lg bg-muted px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">{b.customer_name}</span>
                    <Badge>{b.status}</Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {b.commodity ?? 'Cargo'} · ready {fmtDate(b.requested_date)}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    BK-{String(b.number).padStart(4, '0')}
                    {b.cargowise_ref ? ` · CargoWise ${b.cargowise_ref}` : ''}
                    {b.source === 'voice_agent' ? ' · via voice agent' : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-900">Voice agent today</div>
            <div className="mt-1 text-sm text-slate-500">
              {calls.length} call{calls.length === 1 ? '' : 's'} · {selfServedPct}% self-served
              {calls.length > 0 && (
                <>
                  {' · '}
                  <IntentBadge intent={topIntent(calls)} />
                </>
              )}
            </div>
          </div>
          <Link
            href="/calls"
            className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50"
          >
            {'View calls →'}
          </Link>
        </div>
      </Card>
    </div>
  );
}

function topIntent(calls: CallRecord[]): string | null {
  const counts = new Map<string, number>();
  for (const c of calls) {
    const key = c.detected_intent ?? 'other';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}
