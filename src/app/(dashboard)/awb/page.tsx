import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Card, Badge } from '@/components/ui';
import { reconcile, formatUSD } from '@/lib/reconcile';
import type { AirWaybill } from '@/lib/types';

export const dynamic = 'force-dynamic';

function normalizeAwb(input: string): string | null {
  const digits = input.replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('810')) return `810-${digits.slice(3)}`;
  if (/^810-[0-9]{8}$/.test(input.trim())) return input.trim();
  return null;
}

export default async function AwbLookupPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? '').trim();
  const supabase = createClient();

  let awb: AirWaybill | null = null;
  let notFound = false;

  if (q) {
    const mbn = normalizeAwb(q);
    if (mbn) {
      const { data } = await supabase
        .from('air_waybills')
        .select('*')
        .eq('master_bill_number', mbn)
        .maybeSingle();
      awb = (data as AirWaybill) ?? null;
      notFound = !awb;
    } else {
      notFound = true;
    }
  }

  const recon = awb
    ? reconcile(Number(awb.weight_charge), Number(awb.other_charges), Number(awb.total_collect))
    : null;

  return (
    <div>
      <PageHeader
        title="AWB Lookup"
        subtitle="Search a master air waybill and review the full record + charge breakdown"
      />

      <form method="get" className="mb-6 flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="810-21961413"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      {q && notFound && (
        <Card>
          <p className="text-sm text-slate-500">
            No air waybill found for <span className="font-mono">{q}</span>. Try{' '}
            <span className="font-mono">810-21961413</span> or{' '}
            <span className="font-mono">810-21961306</span>.
          </p>
        </Card>
      )}

      {awb && recon && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-mono text-lg font-semibold text-slate-900">
                  {awb.master_bill_number}
                </div>
                <div className="text-sm text-slate-500">{awb.commodity ?? '—'}</div>
              </div>
              <Badge>{awb.status}</Badge>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Carrier" value={awb.carrier_code} />
              <Field label="Flight" value={awb.flight ?? '—'} />
              <Field label="Origin" value={awb.origin} />
              <Field label="Destination" value={awb.destination} />
              <Field
                label="Cargo ready"
                value={
                  awb.cargo_ready_at
                    ? new Date(awb.cargo_ready_at).toLocaleString('en-US')
                    : 'Not yet'
                }
              />
              <Field
                label="Available for pickup"
                value={awb.status === 'AVAILABLE' ? 'Yes' : 'No'}
              />
            </dl>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Charge breakdown</div>
              <Badge>{recon.status}</Badge>
            </div>
            <dl className="space-y-2 text-sm">
              <Row label="Weight charge" value={formatUSD(Number(awb.weight_charge))} />
              <Row label="Other charges" value={formatUSD(Number(awb.other_charges))} />
              <div className="border-t border-slate-200 pt-2">
                <Row label="Total collect" value={formatUSD(Number(awb.total_collect))} strong />
              </div>
              <div className="mt-2 rounded-md bg-slate-50 p-3 text-xs text-slate-500">
                Expected (weight + other): {formatUSD(recon.expected)}
                {recon.status === 'FLAGGED' ? (
                  <span className="mt-1 block font-medium text-red-600">
                    Δ {formatUSD(recon.delta)} — flagged for review
                  </span>
                ) : (
                  <span className="mt-1 block font-medium text-emerald-600">
                    Matches total collect
                  </span>
                )}
              </div>
            </dl>
          </Card>
        </div>
      )}

      {awb && (
        <div className="mt-4">
          <Link href="/discrepancies" className="text-sm text-brand-600 hover:underline">
            View related discrepancy reports →
          </Link>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-700">{value}</dd>
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
