import Link from 'next/link';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Dot,
  EmptyState,
  Id,
  Input,
  KeyValue,
  LinkButton,
  Null,
  Num,
  PageHeader,
  Route,
  RowLink,
  Segments,
  StatusBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  Toolbar,
  type KeyValueRow,
} from '@/components/ui';
import {
  ArrowDownToLineIcon,
  ArrowLeftIcon,
  ArrowUpFromLineIcon,
  PackageIcon,
  SearchIcon,
} from '@/components/icons';
import { MilestoneTimeline } from '@/components/MilestoneTimeline';
import { TrackingActions } from '@/components/TrackingActions';
import { MILESTONE_STEPS } from '@/lib/milestones';
import type { AirWaybill, IntegrationEvent, ShipmentMilestone } from '@/lib/types';

function fmtWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Milestone labels come from the catalogue; typed middle dots are not UI copy.
function cleanLabel(label: string): string {
  return label.replace(/\s·\s/g, ', ');
}

const TOTAL_STEPS = MILESTONE_STEPS.length;

export type Tracked = {
  awb: AirWaybill;
  timeline: ShipmentMilestone[];
  current: ShipmentMilestone | null;
  done: number;
  lastPush: IntegrationEvent | null;
};

export type TrackingViewProps = {
  /** The raw search query (trimmed); empty string when nothing was searched. */
  q: string;
  /** Normalized flight number when `q` was a flight search; otherwise null. */
  flight: string | null;
  /** Every shipment in scope (one AWB, one flight, or all), already derived. */
  tracked: Tracked[];
  /** The single shipment to show in detail mode (AWB search that hit one row); otherwise null. */
  detail: Tracked | null;
  /** All integration events for the shipments in scope; the View filters them per detail AWB. */
  events: IntegrationEvent[];
  /** True when a search was made and nothing matched. */
  notFound: boolean;
};

export function TrackingView({ q, flight, tracked, detail, events, notFound }: TrackingViewProps) {
  if (detail) {
    return (
      <ShipmentDetail
        t={detail}
        events={events.filter((e) => e.master_bill_number === detail.awb.master_bill_number)}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Milestone tracking"
        subtitle="Flight or air waybill milestones from the cargo portal, synced to CargoWise through the e-adapter."
        action={
          <form method="get" className="flex items-center gap-2">
            <div className="w-[320px]">
              <Input
                name="q"
                defaultValue={q}
                mono
                size="md"
                leading={<SearchIcon />}
                placeholder="AWB 810-21961413 or flight M68741"
                aria-label="Track a shipment"
                autoComplete="off"
              />
            </div>
            <Button type="submit" variant="primary" size="md">
              Track
            </Button>
            {q && (
              <LinkButton href="/tracking" variant="ghost" size="md">
                Clear
              </LinkButton>
            )}
          </form>
        }
      />

      {notFound ? (
        <Card>
          <EmptyState
            icon={<SearchIcon />}
            title={
              <>
                Nothing tracked for <Id>{q}</Id>
              </>
            }
            description="Try an air waybill such as 810-21961413 or a flight such as M68741."
            action={
              <LinkButton href="/tracking" variant="secondary" size="sm">
                Clear search
              </LinkButton>
            }
          />
        </Card>
      ) : (
        <TrackedTable rows={tracked} flight={flight} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function TrackedTable({ rows, flight }: { rows: Tracked[]; flight: string | null }) {
  const n = rows.length;
  return (
    <>
      <Toolbar>
        {flight ? (
          <>
            <span>
              Flight <Id>{flight}</Id>
            </span>
            <Dot />
            <span>
              <Num className="text-ink">{n}</Num> {n === 1 ? 'shipment' : 'shipments'}
            </span>
          </>
        ) : (
          <span>
            <Num className="text-ink">{n}</Num> tracked {n === 1 ? 'shipment' : 'shipments'}
          </span>
        )}
      </Toolbar>

      <Table
        minWidth={880}
        footer="Open a shipment for the full timeline, portal pull and CargoWise push. Searching a flight lists every shipment on it."
      >
        <THead>
          <tr>
            <TH>AWB</TH>
            <TH>Flight</TH>
            <TH>Commodity</TH>
            <TH>Current milestone</TH>
            <TH>Progress</TH>
            <TH>CargoWise</TH>
            <TH>Status</TH>
          </tr>
        </THead>
        <TBody>
          {n === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState
                  icon={<PackageIcon />}
                  title="No shipments tracked yet"
                  description="Search an air waybill or flight number to start tracking."
                />
              </td>
            </tr>
          ) : (
            rows.map(({ awb, current, done, lastPush }) => {
              const href = `/tracking?q=${encodeURIComponent(awb.master_bill_number)}`;
              return (
                <TR key={awb.id} href={href}>
                  <TD identifier>
                    <RowLink href={href}>{awb.master_bill_number}</RowLink>
                  </TD>
                  <TD mono muted>
                    {awb.flight ?? <Null />}
                  </TD>
                  <TD>{awb.commodity ?? <Null />}</TD>
                  <TD>
                    {current ? (
                      <div className="flex items-center gap-2">
                        <StatusBadge status={current.status} />
                        <span className="text-ink-2">{cleanLabel(current.label)}</span>
                      </div>
                    ) : (
                      <span className="text-ink-3">Not started</span>
                    )}
                  </TD>
                  <TD>
                    <Segments done={done} total={TOTAL_STEPS} current={current?.status === 'IN_PROGRESS'} />
                  </TD>
                  <TD>
                    {lastPush ? (
                      <div>
                        <div>{lastPush.external_ref ? <Id>{lastPush.external_ref}</Id> : <Null />}</div>
                        <div className="mt-0.5 font-mono text-xs text-ink-3 tnum">{fmtWhen(lastPush.created_at)}</div>
                      </div>
                    ) : (
                      <span className="text-ink-3">Not pushed</span>
                    )}
                  </TD>
                  <TD>
                    <StatusBadge status={awb.status} />
                  </TD>
                </TR>
              );
            })
          )}
        </TBody>
      </Table>
    </>
  );
}

// ---------------------------------------------------------------------------

function ShipmentDetail({ t, events }: { t: Tracked; events: IntegrationEvent[] }) {
  const { awb, timeline, current, done, lastPush } = t;
  const inProgress = current?.status === 'IN_PROGRESS';

  const syncRows: KeyValueRow[] | null = lastPush
    ? [
        { key: 'status', label: 'Status', value: <StatusBadge status={lastPush.status} /> },
        {
          key: 'ref',
          label: 'Reference',
          value: lastPush.external_ref ? <Id>{lastPush.external_ref}</Id> : <Null />,
        },
        { key: 'when', label: 'Last push', value: <Num>{fmtWhen(lastPush.created_at)}</Num> },
        { key: 'via', label: 'Via', value: lastPush.system },
        {
          key: 'pushed',
          label: 'Pushed',
          total: true,
          value: <Segments done={done} total={TOTAL_STEPS} current={inProgress} />,
        },
      ]
    : null;

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link
            href="/tracking"
            className="inline-flex items-center gap-1 rounded-sm transition-colors duration-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeftIcon className="h-3 w-3" />
            Milestone tracking
          </Link>
        }
        title={
          <>
            <Id className="text-2xl font-medium">{awb.master_bill_number}</Id>
            <StatusBadge status={awb.status} />
          </>
        }
        meta={
          <>
            <Route from={awb.origin} to={awb.destination} />
            <Dot />
            <span>
              Flight {awb.flight ? <Id>{awb.flight}</Id> : <Null />}
            </span>
            <Dot />
            <span>{awb.commodity ?? 'Cargo'}</span>
            <Dot />
            <span>
              Current: <b>{current ? cleanLabel(current.label) : 'Not started'}</b>
            </span>
          </>
        }
        action={<TrackingActions masterBillNumber={awb.master_bill_number} />}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title="Milestones"
            count={
              <>
                <Num>{done}</Num>/<Num>{TOTAL_STEPS}</Num> complete
              </>
            }
          />
          <CardBody variant="roomy">
            <MilestoneTimeline milestones={timeline} />
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="CargoWise sync" />
            <CardBody>
              {syncRows ? (
                <KeyValue rows={syncRows} />
              ) : (
                <EmptyState
                  size="sm"
                  icon={<ArrowUpFromLineIcon />}
                  title="Not pushed yet"
                  description="Push to CargoWise sends the milestones through the e-adapter."
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Integration log" count={<Num>{events.length}</Num>} />
            <CardBody variant="flush">
              {events.length === 0 ? (
                <EmptyState
                  size="sm"
                  title="No integration activity"
                  description="Portal pulls and CargoWise pushes for this shipment are logged here."
                />
              ) : (
                <ul className="divide-y divide-line-subtle">
                  {events.slice(0, 8).map((e) => {
                    const pull = e.kind === 'PORTAL_PULL';
                    return (
                      <li key={e.id} className="flex gap-3 px-4 py-2.5">
                        <span
                          aria-hidden
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-ink-3 [&_svg]:h-3.5 [&_svg]:w-3.5"
                        >
                          {pull ? <ArrowDownToLineIcon /> : <ArrowUpFromLineIcon />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-ink">{pull ? 'Portal pull' : 'CargoWise push'}</span>
                            <StatusBadge status={e.status} size="sm" />
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-xs text-ink-3 tnum">
                            <span>{fmtWhen(e.created_at)}</span>
                            {e.external_ref && (
                              <>
                                <Dot />
                                <Id>{e.external_ref}</Id>
                              </>
                            )}
                          </div>
                          {e.summary && <div className="mt-0.5 text-xs text-ink-3">{e.summary}</div>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
