import Link from 'next/link';
import { Card, PageHeader, Badge } from '@/components/ui';
import { MilestoneTimeline } from '@/components/MilestoneTimeline';
import { TrackingActions } from '@/components/TrackingActions';
import { MILESTONE_STEPS } from '@/lib/milestones';
import type { AirWaybill, IntegrationEvent, ShipmentMilestone } from '@/lib/types';

function fmtWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

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
  return (
    <div>
      <PageHeader
        title="Milestone Tracking"
        subtitle="Flight or air waybill → cargo-portal milestones → CargoWise via the e-adapter REST integration"
      />

      <form method="get" className="mb-6 flex max-w-lg gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Air waybill (810-21961413) or flight (M68741)"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Track
        </button>
        {q && (
          <Link
            href="/tracking"
            className="rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-muted"
          >
            Clear
          </Link>
        )}
      </form>

      {notFound && (
        <Card>
          <p className="text-sm text-slate-500">
            Nothing tracked for <span className="font-mono">{q}</span>. Try an air waybill like{' '}
            <span className="font-mono">810-21961413</span> or a flight like{' '}
            <span className="font-mono">M68741</span>.
          </p>
        </Card>
      )}

      {detail ? (
        <ShipmentDetail
          t={detail}
          events={events.filter((e) => e.master_bill_number === detail.awb.master_bill_number)}
        />
      ) : (
        !notFound && (
          <TrackedTable
            rows={tracked}
            heading={
              flight
                ? `Flight ${flight} · ${tracked.length} shipment${tracked.length === 1 ? '' : 's'}`
                : `Tracked shipments · ${tracked.length}`
            }
          />
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function ShipmentDetail({ t, events }: { t: Tracked; events: IntegrationEvent[] }) {
  const { awb, timeline, current, done, lastPush } = t;
  const pct = Math.round((done / MILESTONE_STEPS.length) * 100);
  return (
    <>
      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="font-mono text-lg font-semibold text-slate-900">
                {awb.master_bill_number}
              </div>
              <Badge>{awb.status}</Badge>
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {awb.commodity ?? 'Cargo'} · Flight{' '}
              <span className="font-mono">{awb.flight ?? '—'}</span> · {awb.origin} → {awb.destination}
            </div>
            <div className="mt-2 text-sm text-slate-700">
              Current milestone:{' '}
              <span className="font-medium">{current?.label ?? 'Not started'}</span>
            </div>
          </div>
          <TrackingActions masterBillNumber={awb.master_bill_number} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Milestones</div>
            <div className="text-xs text-slate-400">
              {done} of {MILESTONE_STEPS.length} complete
            </div>
          </div>
          <MilestoneTimeline milestones={timeline} />
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="mb-3 text-sm font-semibold text-slate-900">CargoWise sync</div>
            {lastPush ? (
              <dl className="space-y-2 text-sm">
                <Row label="Status" value={<Badge>{lastPush.status}</Badge>} />
                <Row
                  label="Reference"
                  value={<span className="font-mono text-xs">{lastPush.external_ref ?? '—'}</span>}
                />
                <Row label="Last push" value={fmtWhen(lastPush.created_at)} />
                <Row label="Via" value={lastPush.system} />
              </dl>
            ) : (
              <p className="text-sm text-slate-400">
                Not pushed yet. Use <span className="font-medium">Push to CargoWise</span> to send the
                milestones through the e-adapter.
              </p>
            )}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                <span>Progress</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-accent-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-3 text-sm font-semibold text-slate-900">Integration log</div>
            {events.length === 0 ? (
              <p className="text-sm text-slate-400">No portal pulls or CargoWise pushes yet.</p>
            ) : (
              <ul className="space-y-3">
                {events.slice(0, 8).map((e) => (
                  <li key={e.id} className="text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-800">
                        {e.kind === 'PORTAL_PULL' ? 'Portal pull' : 'CargoWise push'}
                      </span>
                      <Badge>{e.status}</Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {fmtWhen(e.created_at)}
                      {e.external_ref ? (
                        <>
                          {' · '}
                          <span className="font-mono">{e.external_ref}</span>
                        </>
                      ) : null}
                    </div>
                    {e.summary && <div className="mt-0.5 text-xs text-slate-500">{e.summary}</div>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function TrackedTable({ rows, heading }: { rows: Tracked[]; heading: string }) {
  return (
    <>
      <div className="mb-3 text-sm text-slate-500">{heading}</div>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">AWB</th>
              <th className="px-4 py-3 font-medium">Flight</th>
              <th className="px-4 py-3 font-medium">Commodity</th>
              <th className="px-4 py-3 font-medium">Current milestone</th>
              <th className="px-4 py-3 font-medium">Progress</th>
              <th className="px-4 py-3 font-medium">CargoWise</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                  No shipments tracked yet.
                </td>
              </tr>
            ) : (
              rows.map(({ awb, current, done, lastPush }) => {
                const pct = Math.round((done / MILESTONE_STEPS.length) * 100);
                return (
                  <tr key={awb.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tracking?q=${encodeURIComponent(awb.master_bill_number)}`}
                        className="font-mono text-xs text-brand-600 hover:underline"
                      >
                        {awb.master_bill_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{awb.flight ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{awb.commodity ?? '—'}</td>
                    <td className="px-4 py-3">
                      {current ? (
                        <div className="flex items-center gap-2">
                          <Badge>{current.status}</Badge>
                          <span className="text-slate-700">{current.label}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-accent-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {done}/{MILESTONE_STEPS.length}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {lastPush ? (
                        <div>
                          <span className="font-mono text-xs text-slate-700">
                            {lastPush.external_ref ?? '—'}
                          </span>
                          <div className="text-xs text-slate-400">{fmtWhen(lastPush.created_at)}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Not pushed</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{awb.status}</Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Card className="mt-6">
        <p className="text-sm text-slate-500">
          Open a shipment to see its full milestone timeline, pull the latest status from the
          carrier&apos;s cargo portal, and push the milestones into CargoWise through the e-adapter.
          Searching a flight number lists every shipment on that flight.
        </p>
      </Card>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-700">{value}</dd>
    </div>
  );
}
