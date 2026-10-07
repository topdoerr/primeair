'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Divider, Field, InlineNotice, Input, Num, Route, Select } from '@/components/ui';
import type { Customer } from '@/lib/types';

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

type Result =
  | { ok: true; bookingNumber: string; cargowiseRef: string | null }
  | { ok: false; text: string };

// New booking for a recurring client. Posts to /api/bookings, which creates
// the booking and pushes it to CargoWise through the e-adapter.
export function BookingForm({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const uid = useId();
  const first = customers[0];
  const [customerId, setCustomerId] = useState(first?.id ?? '');
  const [commodity, setCommodity] = useState(first?.default_commodity ?? '');
  const [pieces, setPieces] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [requestedDate, setRequestedDate] = useState(tomorrow());
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Result | null>(null);

  const selected = customers.find((x) => x.id === customerId) ?? first;

  function pickCustomer(id: string) {
    setCustomerId(id);
    const c = customers.find((x) => x.id === id);
    if (c?.default_commodity) setCommodity(c.default_commodity);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, commodity, pieces, weightKg, requestedDate, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? 'Could not create the booking' });
      } else {
        setMsg({ ok: true, bookingNumber: data.bookingNumber, cargowiseRef: data.cargowiseRef ?? null });
        setPieces('');
        setWeightKg('');
        setNotes('');
        router.refresh();
      }
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  const ids = {
    client: `${uid}-client`,
    commodity: `${uid}-commodity`,
    pieces: `${uid}-pieces`,
    weight: `${uid}-weight`,
    date: `${uid}-date`,
    notes: `${uid}-notes`,
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Client */}
      <Field label="Client" htmlFor={ids.client}>
        <Select id={ids.client} size="lg" value={customerId} onChange={(e) => pickCustomer(e.target.value)} required>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.account_code})
            </option>
          ))}
        </Select>
      </Field>

      <Divider />

      {/* Shipment */}
      <Field label="Commodity" htmlFor={ids.commodity}>
        <Input
          id={ids.commodity}
          size="lg"
          value={commodity}
          onChange={(e) => setCommodity(e.target.value)}
          placeholder="e.g. Fresh cut flowers"
          autoComplete="off"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Pieces" htmlFor={ids.pieces}>
          <Input
            id={ids.pieces}
            size="lg"
            mono
            type="number"
            min={1}
            inputMode="numeric"
            value={pieces}
            onChange={(e) => setPieces(e.target.value)}
            placeholder="e.g. 4"
          />
        </Field>
        <Field label="Weight" htmlFor={ids.weight}>
          <Input
            id={ids.weight}
            size="lg"
            mono
            type="number"
            min={0}
            step="0.1"
            inputMode="decimal"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="e.g. 1800"
            suffix="kg"
          />
        </Field>
      </div>

      <Divider />

      {/* Schedule */}
      <Field label="Ready date" htmlFor={ids.date}>
        <Input
          id={ids.date}
          size="lg"
          mono
          type="date"
          value={requestedDate}
          onChange={(e) => setRequestedDate(e.target.value)}
          required
        />
      </Field>
      <Field label="Notes" htmlFor={ids.notes} optional>
        <Input
          id={ids.notes}
          size="lg"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Keep in cooler, 2 to 8 C"
          autoComplete="off"
        />
      </Field>

      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
          Lane
          <Route from={selected?.default_origin ?? 'MIA'} to={selected?.default_destination ?? 'SJU'} />
        </span>
        <Button type="submit" variant="primary" size="lg" busy={busy} disabled={customers.length === 0}>
          {busy ? 'Creating' : 'Create booking'}
        </Button>
      </div>

      {msg && (
        <InlineNotice tone={msg.ok ? 'ok' : 'danger'} className="mt-3 w-full">
          {msg.ok ? (
            <>
              <Num className="font-medium">{msg.bookingNumber}</Num> created
              {msg.cargowiseRef && (
                <>
                  , CargoWise ref <Num className="font-medium">{msg.cargowiseRef}</Num>
                </>
              )}
            </>
          ) : (
            msg.text
          )}
        </InlineNotice>
      )}
    </form>
  );
}
