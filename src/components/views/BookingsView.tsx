import { Card, PageHeader, Badge } from '@/components/ui';
import { BookingForm } from '@/components/BookingForm';
import type { Booking, Customer } from '@/lib/types';

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export type BookingsViewProps = {
  /** All bookings, newest first (ordered by created_at desc). */
  bookings: Booking[];
  /** Recurring customers only (is_recurring = true), ordered by name. */
  customers: Customer[];
};

export function BookingsView({ bookings, customers }: BookingsViewProps) {
  const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length;

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Recurring clients book a shipment here or through the voice agent — it is created in CargoWise via the e-adapter"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 text-sm text-slate-500">
            {bookings.length} total ·{' '}
            <span className="font-medium text-accent-700">{confirmed} confirmed</span>
          </div>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Shipment</th>
                  <th className="px-4 py-3 font-medium">Ready</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">CargoWise</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                      No bookings yet. Create one for a recurring client on the right.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        BK-{String(b.number).padStart(4, '0')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800">{b.customer_name}</div>
                        <div className="text-xs text-slate-400">
                          {b.origin} → {b.destination}
                          {b.flight ? (
                            <>
                              {' · '}
                              <span className="font-mono">{b.flight}</span>
                            </>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700">{b.commodity ?? '—'}</div>
                        <div className="text-xs text-slate-400">
                          {b.pieces != null ? `${b.pieces} pcs` : ''}
                          {b.pieces != null && b.weight_kg != null ? ' · ' : ''}
                          {b.weight_kg != null ? `${Number(b.weight_kg).toLocaleString('en-US')} kg` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{fmtDate(b.requested_date)}</td>
                      <td className="px-4 py-3">
                        <Badge>{b.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {b.cargowise_ref ? (
                          <span className="font-mono text-xs text-slate-700">{b.cargowise_ref}</span>
                        ) : (
                          <span className="text-xs text-slate-400">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge>{b.source.toUpperCase()}</Badge>
                          <span className="text-[11px] text-slate-400">{fmtWhen(b.created_at)}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Card>
          <div className="mb-4 text-sm font-semibold text-slate-900">New booking</div>
          {customers.length === 0 ? (
            <p className="text-sm text-slate-400">No recurring clients on file yet.</p>
          ) : (
            <BookingForm customers={customers} />
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-3 text-sm font-semibold text-slate-900">Recurring clients</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {customers.map((c) => (
            <div key={c.id} className="rounded-lg bg-muted px-3 py-2.5">
              <div className="text-sm font-medium text-slate-800">{c.name}</div>
              <div className="text-xs text-slate-500">
                <span className="font-mono">{c.account_code}</span>
                {c.default_commodity ? ` · ${c.default_commodity}` : ''}
              </div>
              {c.contact_name && (
                <div className="mt-1 text-xs text-slate-400">
                  {c.contact_name}
                  {c.contact_phone ? ` · ${c.contact_phone}` : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
