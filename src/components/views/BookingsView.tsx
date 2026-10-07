import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Dot,
  EmptyState,
  Id,
  Null,
  Num,
  PageHeader,
  Route,
  StatusBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  Tag,
  Toolbar,
  statusSpec,
} from '@/components/ui';
import { BookingIcon, UserIcon } from '@/components/icons';
import { BookingForm } from '@/components/BookingForm';
import type { Booking, Customer } from '@/lib/types';

/** "Oct 8" from a date-only ISO string; null when there is no date. */
function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** "Oct 7, 3:45 PM" for the created-at column. */
function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** One fixed decimal so a column of kg values aligns on the decimal point. */
function fmtKg(kg: number): string {
  return Number(kg).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function bookingNumber(n: number): string {
  return `BK-${String(n).padStart(4, '0')}`;
}

export type BookingsViewProps = {
  /** All bookings, newest first (ordered by created_at desc). */
  bookings: Booking[];
  /** Recurring customers only (is_recurring = true), ordered by name. */
  customers: Customer[];
};

const COLUMNS = 10;

export function BookingsView({ bookings, customers }: BookingsViewProps) {
  const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const requested = bookings.filter((b) => b.status === 'REQUESTED').length;

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Recurring clients book here or through the voice agent; each booking is created in CargoWise via the e-adapter."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Bookings ledger */}
        <div className="min-w-0">
          <Toolbar>
            <span>
              <Num className="text-ink">{bookings.length}</Num> {bookings.length === 1 ? 'booking' : 'bookings'}
            </span>
            <Dot />
            <span className="inline-flex items-center gap-1.5">
              <StatusBadge size="sm" status="CONFIRMED" />
              <Num className="text-ink">{confirmed}</Num>
            </span>
            {requested > 0 && (
              <>
                <Dot />
                <span className="inline-flex items-center gap-1.5">
                  <StatusBadge size="sm" status="REQUESTED" />
                  <Num className="text-ink">{requested}</Num>
                </span>
              </>
            )}
          </Toolbar>

          <Table
            minWidth={920}
            footer="Bookings from the dashboard and the voice agent share one ledger. A CargoWise reference is written back as soon as the e-adapter acknowledges the booking."
          >
            <THead>
              <tr>
                <TH>#</TH>
                <TH>Client</TH>
                <TH>Commodity</TH>
                <TH align="right">Pieces</TH>
                <TH align="right">Weight kg</TH>
                <TH>Ready</TH>
                <TH>Status</TH>
                <TH>CargoWise</TH>
                <TH>Source</TH>
                <TH>Created</TH>
              </tr>
            </THead>
            <TBody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS}>
                    <EmptyState
                      icon={<BookingIcon />}
                      title="No bookings yet"
                      description="Create one for a recurring client using the form."
                    />
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const ready = fmtDate(b.requested_date);
                  return (
                    <TR key={b.id}>
                      <TD identifier>{bookingNumber(b.number)}</TD>
                      <TD>
                        <div className="font-medium text-ink">{b.customer_name}</div>
                        <div className="mt-0.5 flex items-center gap-x-2 text-xs text-ink-3">
                          <Route from={b.origin} to={b.destination} />
                          {b.flight && (
                            <>
                              <Dot />
                              <Id>{b.flight}</Id>
                            </>
                          )}
                        </div>
                      </TD>
                      <TD>{b.commodity ?? <Null />}</TD>
                      <TD numeric>{b.pieces != null ? b.pieces : <Null />}</TD>
                      <TD numeric>{b.weight_kg != null ? fmtKg(b.weight_kg) : <Null />}</TD>
                      <TD>{ready ? <Num>{ready}</Num> : <Null />}</TD>
                      <TD>
                        <StatusBadge status={b.status} />
                      </TD>
                      <TD>{b.cargowise_ref ? <Id>{b.cargowise_ref}</Id> : <span className="text-ink-3">Pending</span>}</TD>
                      <TD>
                        <Tag>{statusSpec(b.source).label}</Tag>
                      </TD>
                      <TD className="whitespace-nowrap font-mono text-xs text-ink-3 tnum">{fmtWhen(b.created_at)}</TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </div>

        {/* New booking */}
        <Card className="self-start">
          <CardHeader title="New booking" />
          <CardBody>
            {customers.length === 0 ? (
              <EmptyState
                size="sm"
                icon={<UserIcon />}
                title="No recurring clients on file"
                description="Bookings are created for recurring clients. Once a client is marked recurring, the form appears here."
              />
            ) : (
              <BookingForm customers={customers} />
            )}
          </CardBody>
          <CardFooter>Confirms the booking and creates it in CargoWise through the e-adapter.</CardFooter>
        </Card>
      </div>

      {/* Recurring clients */}
      <Card className="mt-5">
        <CardHeader title="Recurring clients" count={<Num>{customers.length}</Num>} />
        <CardBody variant="flush">
          {customers.length === 0 ? (
            <EmptyState
              size="sm"
              icon={<UserIcon />}
              title="No recurring clients"
              description="Clients marked recurring can book by phone or from this page."
            />
          ) : (
            // Hairline grid: 1px gaps over a line-colored backdrop so dividers stay correct when cells wrap.
            <div className="grid gap-px overflow-hidden rounded-b-lg bg-line-subtle sm:grid-cols-2 lg:grid-cols-4">
              {customers.map((c) => (
                <div key={c.id} className="bg-surface px-4 py-3">
                  <div className="text-sm font-medium text-ink">{c.name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
                    <Id>{c.account_code}</Id>
                    {c.default_commodity && (
                      <>
                        <Dot />
                        <span>{c.default_commodity}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
                    {c.contact_name ? <span>{c.contact_name}</span> : <span className="text-ink-4">No contact on file</span>}
                    {c.contact_phone && (
                      <>
                        <Dot />
                        <Num>{c.contact_phone}</Num>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
