import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { KpiCard, Card, PageHeader, Badge, IntentBadge } from '@/components/ui';
import type { CallRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function OverviewPage() {
  const supabase = createClient();
  const todayISO = startOfTodayISO();

  const [{ data: callsToday }, { data: flaggedReports }, { data: recentCalls }] =
    await Promise.all([
      supabase.from('calls').select('*').gte('started_at', todayISO),
      supabase.from('discrepancy_reports').select('id').eq('status', 'FLAGGED'),
      supabase
        .from('calls')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(5),
    ]);

  const calls = (callsToday ?? []) as CallRecord[];
  const total = calls.length;
  const selfServed = calls.filter((c) => c.outcome === 'self_served').length;
  const selfServedPct = total > 0 ? Math.round((selfServed / total) * 100) : 0;

  const intentCounts = new Map<string, number>();
  for (const c of calls) {
    const key = c.detected_intent ?? 'other';
    intentCounts.set(key, (intentCounts.get(key) ?? 0) + 1);
  }
  const topIntents = [...intentCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Prime Air voice agent + cargo operations at a glance"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Calls today" value={total} hint="since midnight local" />
        <KpiCard
          label="Self-served"
          value={`${selfServedPct}%`}
          hint={`${selfServed} of ${total} handled by the agent`}
        />
        <KpiCard
          label="Top intent"
          value={
            topIntents[0]
              ? formatIntent(topIntents[0][0])
              : '—'
          }
          hint={topIntents[0] ? `${topIntents[0][1]} call(s)` : 'no calls yet'}
        />
        <KpiCard
          label="AWBs flagged"
          value={flaggedReports?.length ?? 0}
          hint="reconciliation mismatches"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="mb-4 text-sm font-semibold text-slate-900">Top intents today</div>
          {topIntents.length === 0 ? (
            <p className="text-sm text-slate-400">No calls recorded today.</p>
          ) : (
            <ul className="space-y-3">
              {topIntents.map(([intent, count]) => (
                <li
                  key={intent}
                  className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5 text-sm"
                >
                  <IntentBadge intent={intent} />
                  <span className="font-semibold text-slate-700">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Recent calls</div>
            <Link
              href="/calls"
              className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50"
            >
              {'View all →'}
            </Link>
          </div>
          {(recentCalls?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400">
              No calls yet. Sync from the Calls page or take a live call.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="pb-3 font-medium">Caller</th>
                  <th className="pb-3 font-medium">Intent</th>
                  <th className="pb-3 font-medium">AWB</th>
                  <th className="pb-3 font-medium">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {(recentCalls as CallRecord[]).map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-border transition-colors hover:bg-muted/60"
                  >
                    <td className="py-2.5 text-slate-700">{c.caller ?? '—'}</td>
                    <td className="py-2.5">
                      <IntentBadge intent={c.detected_intent} />
                    </td>
                    <td className="py-2.5 font-mono text-xs text-slate-600">
                      {c.referenced_awb ?? '—'}
                    </td>
                    <td className="py-2.5">
                      {c.outcome ? <Badge>{c.outcome.toUpperCase()}</Badge> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

function formatIntent(intent: string): string {
  const map: Record<string, string> = {
    awb_status: 'AWB status',
    schedule_pickup: 'Schedule pickup',
    invoice_question: 'Invoice question',
    other: 'Other',
  };
  return map[intent] ?? intent;
}
