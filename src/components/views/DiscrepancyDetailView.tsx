'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  cn,
  Dot,
  Id,
  KeyValue,
  LedgerRow,
  MonoBlock,
  Null,
  Num,
  PageHeader,
  Route,
  SectionLabel,
  StatusBadge,
} from '@/components/ui';
import { ArrowLeftIcon, CheckIcon } from '@/components/icons';
import type { ParsedDiscrepancy } from '@/lib/discrepancy-xml';
import { formatUSD } from '@/lib/reconcile';
import type { DiscrepancyReport } from '@/lib/types';

export type DiscrepancyDetailViewProps = {
  /** The discrepancy report row being viewed. */
  report: DiscrepancyReport;
  /** Display-friendly parse of report.payload_xml: parseDiscrepancyXml(report.payload_xml). */
  parsed: ParsedDiscrepancy;
};

export function DiscrepancyDetailView({ report, parsed }: DiscrepancyDetailViewProps) {
  const flagged = report.status === 'FLAGGED';
  const masterBill = parsed.masterBillNumber ?? report.master_bill_number;
  const bytes = new TextEncoder().encode(report.payload_xml).length;
  const verdict =
    parsed.reason ??
    (flagged
      ? 'Weight charge plus other charges does not match total collect.'
      : 'Weight charge plus other charges matches total collect.');

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link
            href="/discrepancies"
            className="inline-flex items-center gap-1 rounded-sm transition-colors duration-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeftIcon className="h-3 w-3" />
            Discrepancies
          </Link>
        }
        title={<Id className="text-2xl font-medium">{report.message_id}</Id>}
        meta={
          <>
            <span>
              Carrier <Id>{report.carrier_code}</Id>
            </span>
            {report.invoice_number && (
              <>
                <Dot />
                <span>
                  Invoice <Id>{report.invoice_number}</Id>
                </span>
              </>
            )}
          </>
        }
        action={<StatusBadge status={report.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Parsed summary" />
          <CardBody>
            <KeyValue
              columns={2}
              rows={[
                { key: 'awb', label: 'Master bill', value: masterBill ? <Id>{masterBill}</Id> : <Null /> },
                { key: 'flight', label: 'Flight', value: parsed.flight ? <Id>{parsed.flight}</Id> : <Null /> },
                {
                  key: 'route',
                  label: 'Route',
                  value:
                    parsed.origin && parsed.destination ? <Route from={parsed.origin} to={parsed.destination} /> : <Null />,
                },
                { key: 'commodity', label: 'Commodity', value: parsed.commodity ?? <Null /> },
              ]}
            />

            <SectionLabel className="mt-5">Charges{parsed.currency ? ` (${parsed.currency})` : ''}</SectionLabel>
            <div>
              <LedgerRow label="Weight charge" value={money(parsed.weightCharge)} />
              <LedgerRow label="Other charges" value={money(parsed.otherCharges)} />
              <LedgerRow label="Total collect" value={money(parsed.totalCollect)} strong />
            </div>

            <div
              role="status"
              className={cn(
                'mt-4 rounded-md border p-3 text-xs',
                flagged ? 'border-danger-bg bg-danger-bg text-danger-fg' : 'border-ok-bg bg-ok-bg text-ok-fg',
              )}
            >
              <dl className="grid grid-cols-3 gap-3">
                <VerdictFigure label="Expected" value={money(parsed.expected)} />
                <VerdictFigure label="Computed" value={money(parsed.computed)} />
                <VerdictFigure label="Difference" value={money(parsed.delta)} />
              </dl>
              <p className="mt-2 font-medium">{verdict}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="DiscrepancyReport XML" actions={<CopyButton text={report.payload_xml} />} />
          <CardBody>
            <MonoBlock
              label="XML payload"
              meta={
                <>
                  <Num>{bytes.toLocaleString('en-US')}</Num> bytes
                </>
              }
            >
              {report.payload_xml}
            </MonoBlock>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function money(n?: number) {
  return n === undefined ? <Null /> : formatUSD(n);
}

function VerdictFigure({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm font-medium tracking-[-0.01em] tnum">{value}</dd>
    </div>
  );
}

/** Copies the raw payload; falls back silently where the clipboard API is unavailable. */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) return;
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard access denied; the XML stays selectable in the block below.
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={copy} icon={copied ? <CheckIcon /> : undefined} aria-live="polite">
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}
