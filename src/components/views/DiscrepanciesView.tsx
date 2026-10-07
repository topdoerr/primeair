import {
  EmptyState,
  Id,
  Null,
  Num,
  PageHeader,
  RowLink,
  StatusBadge,
  Table,
  TBody,
  TD,
  TH,
  THead,
  Toolbar,
  TR,
} from '@/components/ui';
import { ChevronRightIcon, ReceiptIcon } from '@/components/icons';
import type { DiscrepancyReport } from '@/lib/types';

export type DiscrepanciesViewProps = {
  /** All discrepancy reports, newest first (ordered by created_at desc). */
  reports: DiscrepancyReport[];
};

export function DiscrepanciesView({ reports }: DiscrepanciesViewProps) {
  const flagged = reports.filter((r) => r.status === 'FLAGGED').length;

  return (
    <div>
      <PageHeader
        title="Discrepancies"
        subtitle="Invoice reconciliation output, flagged when weight charge plus surcharges does not equal total collect."
      />

      <Toolbar>
        <span>
          <Num className="text-ink">{reports.length}</Num> {reports.length === 1 ? 'report' : 'reports'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <StatusBadge size="sm" status="FLAGGED" />
          <Num className="text-ink">{flagged}</Num>
        </span>
      </Toolbar>

      <Table
        minWidth={760}
        footer="Open a report for the parsed charges, the reconciliation verdict and the raw DiscrepancyReport XML."
      >
        <THead>
          <tr>
            <TH>Message ID</TH>
            <TH>Carrier</TH>
            <TH>Invoice</TH>
            <TH>AWB</TH>
            <TH>Status</TH>
            <TH align="right">
              <span className="sr-only">Open</span>
            </TH>
          </tr>
        </THead>
        <TBody>
          {reports.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  icon={<ReceiptIcon />}
                  title="No discrepancy reports"
                  description="Reports are generated when a carrier invoice does not reconcile."
                />
              </td>
            </tr>
          ) : (
            reports.map((r) => {
              const href = `/discrepancies/${r.id}`;
              return (
                <TR key={r.id} href={href}>
                  <TD identifier>
                    <RowLink href={href}>{r.message_id}</RowLink>
                  </TD>
                  <TD>
                    <Id>{r.carrier_code}</Id>
                  </TD>
                  <TD>{r.invoice_number ? <Id>{r.invoice_number}</Id> : <Null />}</TD>
                  <TD>{r.master_bill_number ? <Id>{r.master_bill_number}</Id> : <Null />}</TD>
                  <TD>
                    <StatusBadge status={r.status} />
                  </TD>
                  <TD align="right">
                    <ChevronRightIcon className="inline-block h-4 w-4 text-ink-4 group-hover:text-ink-3" />
                  </TD>
                </TR>
              );
            })
          )}
        </TBody>
      </Table>
    </div>
  );
}
