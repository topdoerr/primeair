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

      {/*
        Measured at 1440 inside the real shell: the ten nowrap columns need 1,039px, and a
        ledger column beside the 360px form tops out at 760px (972px even at the 1400px cap),
        so the side-by-side grid can never show the Source and Created columns without a
        horizontal scroll. The ledger therefore takes the full width, and the New booking
        card shares the row below it with Recurring clients (360px beside 1fr from lg).
      */}
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

        {/*
          Full width fits every column from ~1,340px. Below that (lg rail widths) the table
          scrolls horizontally: overflow-x-auto + scroll-stable's thin thumb, and the edge fade
          makes the clipped right edge read as "more to the right" rather than a broken layout.
        */}
        <Table
          minWidth={920}
          edgeFade
          footer="Bookings from the dashboard and the voice agent share one ledger. A CargoWise reference is written back as soon as the e-adapter acknowledges the booking."
        >
          <THead>
            {/* Fixed-content columns shrink to their nowrap content; Commodity takes the slack and wraps. */}
            <tr>
              <TH className="w-[1%]">#</TH>
              <TH>Client</TH>
              <TH>Commodity</TH>
              <TH align="right" className="w-[1%]">
                Pieces
              </TH>
              <TH align="right" className="w-[1%]">
                Weight kg
              </TH>
              <TH className="w-[1%]">Ready</TH>
              <TH className="w-[1%]">Status</TH>
              <TH className="w-[1%]">CargoWise</TH>
              <TH className="w-[1%]">Source</TH>
              <TH className="w-[1%]">Created</TH>
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
                      {/* Two-line cell (7.4): neither line wraps, so rows hold 44px and the Route reads as one token. */}
                      <div className="whitespace-nowrap font-medium text-ink">{b.customer_name}</div>
                      <div className="mt-0.5 flex items-center gap-x-2 whitespace-nowrap text-xs text-ink-3">
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
                    <TD className="whitespace-nowrap">{ready ? <Num className="whitespace-nowrap">{ready}</Num> : <Null />}</TD>
                    <TD className="whitespace-nowrap">
                      <StatusBadge status={b.status} />
                    </TD>
                    <TD className="whitespace-nowrap">
                      {b.cargowise_ref ? (
                        <Id className="whitespace-nowrap">{b.cargowise_ref}</Id>
                      ) : (
                        <span className="text-ink-3">Pending</span>
                      )}
                    </TD>
                    <TD className="whitespace-nowrap">
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

      <div className="mt-5 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
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

        {/* Recurring clients */}
        <Card className="min-w-0 self-start">
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
              // One column at lg (the card is ~340px beside the form), two from xl (~600px and up).
              <div className="grid gap-px overflow-hidden rounded-b-lg bg-line-subtle sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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
    </div>
  );
}
