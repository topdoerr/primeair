import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Badge } from '@/components/ui';
import type { DiscrepancyReport } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DiscrepanciesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('discrepancy_reports')
    .select('*')
    .order('created_at', { ascending: false });

  const reports = (data ?? []) as DiscrepancyReport[];

  return (
    <div>
      <PageHeader
        title="Discrepancy Reports"
        subtitle="Invoice reconciliation output — flagged when weight charge + surcharges ≠ total collect"
      />

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Message ID</th>
              <th className="px-4 py-3 font-medium">Carrier</th>
              <th className="px-4 py-3 font-medium">Invoice</th>
              <th className="px-4 py-3 font-medium">AWB</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                  No discrepancy reports yet.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.message_id}</td>
                  <td className="px-4 py-3 text-slate-700">{r.carrier_code}</td>
                  <td className="px-4 py-3 text-slate-700">{r.invoice_number ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {r.master_bill_number ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/discrepancies/${r.id}`}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
