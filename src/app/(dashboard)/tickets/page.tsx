import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Card, Badge, IntentBadge } from '@/components/ui';
import type { Ticket } from '@/lib/types';

export const dynamic = 'force-dynamic';

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function TicketsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  const tickets = (data ?? []) as Ticket[];
  const open = tickets.filter((t) => t.status === 'open').length;

  return (
    <div>
      <PageHeader
        title="Tickets"
        subtitle="Auto-created after every call for follow-up by the ops team"
      />

      <div className="mb-4 text-sm text-slate-500">
        {tickets.length} total · <span className="font-medium text-amber-700">{open} open</span>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">AWB</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                  No tickets yet. One is created automatically after each call.
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    PA-{String(t.number).padStart(4, '0')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-800">{t.subject}</div>
                    {t.description && (
                      <div className="mt-0.5 line-clamp-1 max-w-md text-xs text-slate-400">
                        {t.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <IntentBadge intent={t.category} />
                  </td>
                  <td className="px-4 py-3">
                    {t.master_bill_number ? (
                      <Link
                        href={`/awb?q=${encodeURIComponent(t.master_bill_number)}`}
                        className="font-mono text-xs text-brand-600 hover:underline"
                      >
                        {t.master_bill_number}
                      </Link>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{t.priority.toUpperCase()}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{t.status.toUpperCase()}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{fmtDate(t.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Card className="mt-6">
        <p className="text-sm text-slate-500">
          Tickets are created automatically when a call ends (via the Vapi webhook) and when you
          run <span className="font-medium">Sync calls</span>. Calls fully self-served by the agent
          are opened as <Badge>LOW</Badge> and closed; pickups and invoice questions stay{' '}
          <Badge>OPEN</Badge> for the team.
        </p>
      </Card>
    </div>
  );
}
