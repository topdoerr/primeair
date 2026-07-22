import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Card, Badge } from '@/components/ui';
import { parseDiscrepancyXml } from '@/lib/discrepancy-xml';
import { formatUSD } from '@/lib/reconcile';
import type { DiscrepancyReport } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DiscrepancyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from('discrepancy_reports')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!data) notFound();
  const report = data as DiscrepancyReport;
  const parsed = parseDiscrepancyXml(report.payload_xml);

  return (
    <div>
      <div className="mb-4">
        <Link href="/discrepancies" className="text-sm text-brand-600 hover:underline">
          ← Back to reports
        </Link>
      </div>
      <PageHeader
        title={report.message_id}
        subtitle={`Carrier ${report.carrier_code}${
          report.invoice_number ? ` · Invoice ${report.invoice_number}` : ''
        }`}
        action={<Badge>{report.status}</Badge>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 text-sm font-semibold text-slate-900">Parsed summary</div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Master bill" value={parsed.masterBillNumber ?? report.master_bill_number ?? '—'} mono />
            <Field label="Flight" value={parsed.flight ?? '—'} />
            <Field label="Route" value={`${parsed.origin ?? '?'} → ${parsed.destination ?? '?'}`} />
            <Field label="Commodity" value={parsed.commodity ?? '—'} />
          </dl>

          <div className="mt-5 mb-2 text-xs font-medium uppercase text-slate-400">Charges</div>
          <dl className="space-y-2 text-sm">
            <Row label="Weight charge" value={money(parsed.weightCharge)} />
            <Row label="Other charges" value={money(parsed.otherCharges)} />
            <div className="border-t border-slate-200 pt-2">
              <Row label="Total collect" value={money(parsed.totalCollect)} strong />
            </div>
          </dl>

          <div
            className={`mt-4 rounded-md p-3 text-xs ${
              report.status === 'FLAGGED'
                ? 'bg-red-50 text-red-700'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            <div>
              Expected {money(parsed.expected)} · Computed {money(parsed.computed)} · Δ{' '}
              {money(parsed.delta)}
            </div>
            {parsed.reason && <div className="mt-1 font-medium">{parsed.reason}</div>}
          </div>
        </Card>

        <Card>
          <div className="mb-3 text-sm font-semibold text-slate-900">DiscrepancyReport XML</div>
          <pre className="mono-block max-h-[28rem] overflow-auto">{report.payload_xml}</pre>
        </Card>
      </div>
    </div>
  );
}

function money(n?: number): string {
  return n === undefined ? '—' : formatUSD(n);
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-400">{label}</dt>
      <dd className={`mt-0.5 text-slate-700 ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? 'font-semibold text-slate-900' : 'text-slate-700'}>{value}</span>
    </div>
  );
}
