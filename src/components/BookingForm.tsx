'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Customer } from '@/lib/types';

const inputCls =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// New booking for a recurring client. Posts to /api/bookings, which creates
// the booking and pushes it to CargoWise through the e-adapter.
export function BookingForm({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const first = customers[0];
  const [customerId, setCustomerId] = useState(first?.id ?? '');
  const [commodity, setCommodity] = useState(first?.default_commodity ?? '');
  const [pieces, setPieces] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [requestedDate, setRequestedDate] = useState(tomorrow());
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

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
        setMsg({
          ok: true,
          text: `${data.bookingNumber} created${
            data.cargowiseRef ? ` · CargoWise ref ${data.cargowiseRef}` : ''
          }`,
        });
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

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Client
        </label>
        <select
          value={customerId}
          onChange={(e) => pickCustomer(e.target.value)}
          className={inputCls}
          required
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.account_code}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Commodity
        </label>
        <input
          value={commodity}
          onChange={(e) => setCommodity(e.target.value)}
          placeholder="Fresh cut flowers"
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pieces
          </label>
          <input
            type="number"
            min={1}
            value={pieces}
            onChange={(e) => setPieces(e.target.value)}
            placeholder="4"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Weight (kg)
          </label>
          <input
            type="number"
            min={0}
            step="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="1800"
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Ready date
        </label>
        <input
          type="date"
          value={requestedDate}
          onChange={(e) => setRequestedDate(e.target.value)}
          className={inputCls}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Notes
        </label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Keep in cooler · 2–8 °C"
          className={inputCls}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy || customers.length === 0}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? 'Creating…' : 'Create booking'}
        </button>
        {msg && (
          <span className={`text-xs ${msg.ok ? 'text-accent-700' : 'text-red-600'}`}>
            {msg.text}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400">
        Confirms the booking and creates it in CargoWise through the e-adapter.
      </p>
    </form>
  );
}
