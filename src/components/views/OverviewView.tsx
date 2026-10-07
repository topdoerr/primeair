import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Dot,
  EmptyState,
  Id,
  IntentBadge,
  Kpi,
  KpiStrip,
  LinkButton,
  Null,
  Num,
  PageHeader,
  RowLink,
  Segments,
  StatusBadge,
  TBody,
  TD,
  TR,
  Tag,
} from '@/components/ui';
import { ArrowUpRightIcon, BookingIcon, PackageIcon } from '@/components/icons';
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

export type OverviewViewProps = {
  awbs: AirWaybill[];
  milestones: ShipmentMilestone[];
  pushesToday: IntegrationEvent[];
  bookings: Booking[];
  calls: CallRecord[];
};

/** "Oct 8" from a date-only ISO string; null when there is no date. */
function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** "Tue, Oct 7": the render date shown in the header meta (static, no data change). */
function fmtToday(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function bookingNumber(n: number): string {
  return `BK-${String(n).padStart(4, '0')}`;
}

// Milestone labels come from the catalogue; typed middle dots are not UI copy.
// Same formatter as TrackingView so the milestone reads identically on both screens.
function cleanLabel(label: string): string {
  return label.replace(/\s·\s/g, ', ');
}

export function OverviewView({ awbs, milestones, pushesToday, bookings, calls }: OverviewViewProps) {
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
  const recentBookings = bookings.slice(0, 5);
  const today = fmtToday(new Date());

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Milestone tracking, CargoWise sync, bookings and the voice agent at a glance."
        meta={
          <>
            <span>
              <Num>{awbs.length}</Num> shipments
            </span>
            <Dot />
            <span>
              <Num>{inTransit}</Num> in transit
            </span>
            <Dot />
            <span>
              Today <Num>{today}</Num>
            </span>
          </>
        }
      />

      <KpiStrip>
        <Kpi
          primary
          label="Shipments tracked"
          value={awbs.length}
          hint={
            <>
              <span>
                <Num className="text-ink-2">{inTransit}</Num> in transit
              </span>
              <Dot />
              <span>
                <Num className="text-ink-2">{arrived}</Num> arrived
              </span>
              <Dot />
              <span>
                <Num className="text-ink-2">{available}</Num> available
              </span>
            </>
          }
        />
        <Kpi label="In transit" value={inTransit} hint={<span>MIA to SJU, milestones updating</span>} />
        <Kpi
          label="CargoWise syncs today"
          value={pushesToday.length}
          hint={
            <span>
              <Num className="text-ink-2">{pushesAck}</Num> acknowledged via e-adapter
            </span>
          }
        />
        <Kpi
          label="Bookings, 7 days"
          value={bookings.length}
          hint={
            <span>
              <Num className="text-ink-2">{confirmedBookings}</Num> confirmed in CargoWise
            </span>
          }
        />
      </KpiStrip>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Milestone snapshot: identifier-first rows, one per tracked shipment. */}
        <Card className="min-w-0 self-start">
          <CardHeader
            title="Milestone snapshot"
            count={<Num>{snapshot.length}</Num>}
            actions={
              <LinkButton href="/tracking" variant="ghost" size="sm" trailingIcon={<ArrowUpRightIcon />}>
                Open tracking
              </LinkButton>
            }
          />
          <CardBody variant="flush">
            {snapshot.length === 0 ? (
              <EmptyState
                icon={<PackageIcon />}
                title="No shipments tracked yet"
                description="Shipments appear here once a flight or air waybill is tracked."
                action={
                  <LinkButton href="/tracking" variant="secondary" size="sm">
                    Track a shipment
                  </LinkButton>
                }
              />
            ) : (
              // Borderless table inside the card (section 6.8): it never exceeds the card. Identifier, flight and
              // Progress cells shrink to their content; the milestone cell takes the slack and truncates (max-w-0).
              <div className="overflow-hidden rounded-b-lg">
                <table className="w-full table-auto border-collapse text-sm">
                  <TBody>
                    {snapshot.map(({ awb, current, done }) => {
                      const href = `/tracking?q=${encodeURIComponent(awb.master_bill_number)}`;
                      return (
                        <TR key={awb.id} href={href}>
                          {/* AWB, flight and Progress shrink to their content (w-px); the milestone cell takes the slack (w-full). */}
                          <TD identifier className="w-px whitespace-nowrap">
                            <RowLink href={href}>{awb.master_bill_number}</RowLink>
                          </TD>
                          <TD muted className="w-px whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {awb.flight ? <Id className="shrink-0 whitespace-nowrap">{awb.flight}</Id> : <Null />}
                              <span>{awb.commodity ?? 'Cargo'}</span>
                            </div>
                          </TD>
                          <TD className="w-full max-w-0">
                            {current ? (
                              <div className="flex min-w-0 items-center gap-2">
                                <StatusBadge status={current.status} />
                                <span className="truncate text-ink-2">{cleanLabel(current.label)}</span>
                              </div>
                            ) : (
                              <span className="text-ink-3">Not started</span>
                            )}
                          </TD>
                          <TD align="right" className="w-[140px] whitespace-nowrap">
                            <div className="flex justify-end">
                              <Segments
                                done={done}
                                total={MILESTONE_STEPS.length}
                                current={current?.status === 'IN_PROGRESS'}
                              />
                            </div>
                          </TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <div className="flex min-w-0 flex-col gap-5">
          {/* Recent bookings: a quiet list, not tiles. */}
          <Card>
            <CardHeader
              title="Recent bookings"
              count={<Num>{bookings.length}</Num>}
              actions={
                <LinkButton href="/bookings" variant="ghost" size="sm" trailingIcon={<ArrowUpRightIcon />}>
                  View all
                </LinkButton>
              }
            />
            <CardBody variant="flush">
              {recentBookings.length === 0 ? (
                <EmptyState
                  size="sm"
                  icon={<BookingIcon />}
                  title="No bookings in the last 7 days"
                  description="Bookings made here or by the voice agent appear as they are created in CargoWise."
                  action={
                    <LinkButton href="/bookings" variant="secondary" size="sm">
                      New booking
                    </LinkButton>
                  }
                />
              ) : (
                <ul className="divide-y divide-line-subtle">
                  {recentBookings.map((b) => {
                    const ready = fmtDate(b.requested_date);
                    const voice = b.source === 'voice_agent';
                    return (
                      <li key={b.id} className="px-4 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-sm font-medium text-ink">{b.customer_name}</span>
                          <StatusBadge status={b.status} size="sm" />
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-3">
                          <Id className="whitespace-nowrap">{bookingNumber(b.number)}</Id>
                          <Dot />
                          <span>{b.commodity ?? 'Cargo'}</span>
                          <Dot />
                          <span className="whitespace-nowrap">
                            ready {ready ? <Num>{ready}</Num> : <Null />}
                          </span>
                        </div>
                        {(b.cargowise_ref || voice) && (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-3">
                            {b.cargowise_ref && <Id className="whitespace-nowrap text-xs">{b.cargowise_ref}</Id>}
                            {voice && <Tag size="sm">Voice agent</Tag>}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Voice agent strip: three figures and a quiet link. */}
          <Card>
            <CardHeader title="Voice agent today" />
            <CardBody variant="flush" className="grid grid-cols-3 divide-x divide-line">
              {/* Cells are min-w-0 so a long intent label truncates inside its cell instead of spilling over the divider. */}
              <div className="min-w-0 px-4 py-3">
                <div className="text-xs text-ink-3">Calls</div>
                <div className="mt-1 font-mono text-lg font-medium text-ink tnum">{calls.length}</div>
              </div>
              <div className="min-w-0 px-4 py-3">
                <div className="text-xs text-ink-3">Self-served</div>
                <div className="mt-1 font-mono text-lg font-medium text-ink tnum">{selfServedPct}%</div>
              </div>
              <div className="min-w-0 px-4 py-3">
                <div className="text-xs text-ink-3">Top intent</div>
                <div className="mt-1.5 flex h-6 items-center">
                  {calls.length > 0 ? (
                    <IntentBadge intent={topIntent(calls)} className="max-w-full truncate" />
                  ) : (
                    <Null />
                  )}
                </div>
              </div>
            </CardBody>
            <CardFooter className="flex items-center justify-end py-1.5">
              <LinkButton href="/calls" variant="ghost" size="sm" trailingIcon={<ArrowUpRightIcon />}>
                View calls
              </LinkButton>
            </CardFooter>
          </Card>
        </div>
      </div>
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
