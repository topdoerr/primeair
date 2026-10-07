'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SyncIcon, UploadCloudIcon } from '@/components/icons';

// "Pull from cargo portals" + "Push to CargoWise" for one shipment.
export function TrackingActions({ masterBillNumber }: { masterBillNumber: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'pull' | 'push' | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(kind: 'pull' | 'push') {
    setBusy(kind);
    setMsg(null);
    try {
      const res = await fetch(kind === 'pull' ? '/api/tracking/pull' : '/api/cargowise/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterBillNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? 'Request failed' });
      } else if (kind === 'pull') {
        setMsg({
          ok: true,
          text: data.advanced
            ? `Portal confirmed: ${data.advanced.label}`
            : 'Portal checked — all milestones already complete',
        });
        router.refresh();
      } else {
        setMsg({
          ok: data.status !== 'FAILED',
          text:
            data.status === 'FAILED'
              ? data.event?.summary ?? 'CargoWise push failed'
              : `Pushed to CargoWise · ref ${data.reference}`,
        });
        router.refresh();
      }
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => run('pull')}
        disabled={busy !== null}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-muted disabled:opacity-60"
      >
        <SyncIcon className={`h-4 w-4 ${busy === 'pull' ? 'animate-spin' : ''}`} />
        {busy === 'pull' ? 'Checking portal…' : 'Pull from cargo portal'}
      </button>
      <button
        onClick={() => run('push')}
        disabled={busy !== null}
        className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        <UploadCloudIcon className="h-4 w-4" />
        {busy === 'push' ? 'Pushing…' : 'Push to CargoWise'}
      </button>
      {msg && (
        <span className={`text-xs ${msg.ok ? 'text-accent-700' : 'text-red-600'}`}>{msg.text}</span>
      )}
    </div>
  );
}
