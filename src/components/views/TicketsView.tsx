import {
  EmptyState,
  Id,
  IntentBadge,
  Null,
  Num,
  PageHeader,
  StatusBadge,
  Table,
  TBody,
  TD,
  TH,
  THead,
  Toolbar,
  TR,
} from '@/components/ui';
import { TicketIcon } from '@/components/icons';
import type { Ticket } from '@/lib/types';

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ticketRef(n: number): string {
  return `PA-${String(n).padStart(4, '0')}`;
}

export type TicketsViewProps = {
  /** All tickets, newest first (ordered by created_at desc). */
  tickets: Ticket[];
};

export function TicketsView({ tickets }: TicketsViewProps) {
  const open = tickets.filter((t) => t.status === 'open').length;

  return (
    <div>
      <PageHeader title="Tickets" subtitle="Created automatically after every call for follow-up by the ops team." />

      <Toolbar>
        <span>
          <Num className="text-ink">{tickets.length}</Num> {tickets.length === 1 ? 'ticket' : 'tickets'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <StatusBadge size="sm" status="OPEN" />
          <Num className="text-ink">{open}</Num>
        </span>
      </Toolbar>

      <Table
        minWidth={880}
        footer={
          <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span>Tickets are created when a call ends and when you run Sync calls. Self-served calls open as</span>
            <StatusBadge size="sm" status="LOW" />
            <span>and close; pickups and invoice questions stay</span>
            <StatusBadge size="sm" status="OPEN" />
            <span>for the team.</span>
          </span>
        }
      >
        <THead>
          <tr>
            <TH>#</TH>
            <TH>Subject</TH>
            <TH>Type</TH>
            <TH>AWB</TH>
            <TH>Priority</TH>
            <TH>Status</TH>
            <TH>Created</TH>
          </tr>
        </THead>
        <TBody>
          {tickets.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState
                  icon={<TicketIcon />}
                  title="No tickets yet"
                  description="One is created automatically after each call."
                />
              </td>
            </tr>
          ) : (
            tickets.map((t) => (
              <TR key={t.id}>
                <TD identifier className="whitespace-nowrap">
                  {ticketRef(t.number)}
                </TD>
                <TD>
                  <div className="font-medium text-ink">{t.subject}</div>
                  {t.description && (
                    <div className="mt-0.5 line-clamp-1 max-w-[48ch] text-xs text-ink-3">{t.description}</div>
                  )}
                </TD>
                <TD>
                  <IntentBadge intent={t.category} />
                </TD>
                <TD>
                  {t.master_bill_number ? (
                    <Id href={`/awb?q=${encodeURIComponent(t.master_bill_number)}`}>{t.master_bill_number}</Id>
                  ) : (
                    <Null />
                  )}
                </TD>
                <TD>
                  <StatusBadge status={t.priority} />
                </TD>
                <TD>
                  <StatusBadge status={t.status} />
                </TD>
                <TD>
                  <span className="whitespace-nowrap font-mono text-xs text-ink-3 tnum">{fmtDate(t.created_at)}</span>
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}
