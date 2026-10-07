'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownToLineIcon, ArrowUpFromLineIcon } from '@/components/icons';
import { Button, Id, InlineNotice } from '@/components/ui';

// "Pull from portal" + "Push to CargoWise" for one shipment. The result renders as an
// InlineNotice under the buttons and clears on the next action.
export function TrackingActions({ masterBillNumber }: { masterBillNumber: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'pull' | 'push' | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: ReactNode } | null>(null);

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
            : 'Portal checked, all milestones already complete',
        });
        router.refresh();
      } else {
        setMsg({
          ok: data.status !== 'FAILED',
          text:
            data.status === 'FAILED' ? (
              data.event?.summary ?? 'CargoWise push failed'
            ) : (
              <>
                Pushed to CargoWise, ref <Id>{data.reference}</Id>
              </>
            ),
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
    <div className="flex flex-col items-end gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="md"
          icon={<ArrowDownToLineIcon />}
          loading={busy === 'pull'}
          disabled={busy !== null}
          onClick={() => run('pull')}
        >
          {busy === 'pull' ? 'Checking portal' : 'Pull from portal'}
        </Button>
        <Button
          variant="primary"
          size="md"
          icon={<ArrowUpFromLineIcon />}
          loading={busy === 'push'}
          disabled={busy !== null}
          onClick={() => run('push')}
        >
          {busy === 'push' ? 'Pushing' : 'Push to CargoWise'}
        </Button>
      </div>
      {msg && (
        <InlineNotice tone={msg.ok ? 'ok' : 'danger'} className="max-w-[48ch]">
          {msg.text}
        </InlineNotice>
      )}
    </div>
  );
}
