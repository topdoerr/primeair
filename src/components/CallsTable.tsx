'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, IntentBadge } from '@/components/ui';
import { CloseIcon, PlayIcon } from '@/components/icons';
import type { CallRecord } from '@/lib/types';

function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function fmtDuration(sec: number | null): string {
  if (sec == null) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function CallsTable({ calls }: { calls: CallRecord[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<CallRecord | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  async function syncCalls() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/sync-calls', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setSyncMsg(data.error ?? 'Sync failed');
      } else {
        setSyncMsg(`Synced ${data.synced} call(s).`);
        router.refresh();
      }
    } catch (err) {
      setSyncMsg((err as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-end gap-3">
        {syncMsg && <span className="text-xs text-slate-500">{syncMsg}</span>}
        <button
          onClick={syncCalls}
          disabled={syncing}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {syncing ? 'Syncing…' : 'Sync calls'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Started</th>
              <th className="px-4 py-3 font-medium">Caller</th>
              <th className="px-4 py-3 font-medium">Intent</th>
              <th className="px-4 py-3 font-medium">AWB</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {calls.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                  No calls yet. Click “Sync calls” to pull from Vapi.
                </td>
              </tr>
            ) : (
              calls.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-slate-600">{fmtTime(c.started_at)}</td>
                  <td className="px-4 py-3 text-slate-700">{c.caller ?? '—'}</td>
                  <td className="px-4 py-3">
                    <IntentBadge intent={c.detected_intent} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {c.referenced_awb ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      {fmtDuration(c.duration)}
                      {c.recording_url && (
                        <PlayIcon
                          className="h-3.5 w-3.5 text-brand-500"
                          aria-label="Recording available"
                        />
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.outcome ? <Badge>{c.outcome.toUpperCase()}</Badge> : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Transcript drawer */}
      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-slate-900/30"
            onClick={() => setSelected(null)}
          />
          <div className="relative z-50 flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">Call detail</div>
                <div className="text-xs text-slate-500">{selected.caller ?? 'Unknown caller'}</div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 px-5 py-4 text-sm">
              <Meta label="Started" value={fmtTime(selected.started_at)} />
              <Meta label="Duration" value={fmtDuration(selected.duration)} />
              <Meta label="Intent" value={<IntentBadge intent={selected.detected_intent} />} />
              <Meta
                label="Outcome"
                value={selected.outcome ? <Badge>{selected.outcome.toUpperCase()}</Badge> : '—'}
              />
              <Meta
                label="Referenced AWB"
                value={
                  <span className="font-mono text-xs">{selected.referenced_awb ?? '—'}</span>
                }
              />
              <Meta label="Vapi call id" value={<span className="font-mono text-xs">{selected.vapi_call_id}</span>} />
            </div>
            <div className="border-t border-slate-200 px-5 py-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase text-slate-400">
                <PlayIcon className="h-3.5 w-3.5" />
                Recording
              </div>
              {selected.recording_url ? (
                <audio
                  controls
                  preload="none"
                  src={selected.recording_url}
                  className="w-full"
                >
                  Your browser does not support audio playback.
                </audio>
              ) : (
                <p className="text-sm text-slate-400">
                  No recording available for this call.
                </p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto border-t border-slate-200 px-5 py-4">
              <div className="mb-2 text-xs font-medium uppercase text-slate-400">Transcript</div>
              <div className="mono-block">
                {selected.transcript?.trim() || 'No transcript available.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase text-slate-400">{label}</div>
      <div className="mt-0.5 text-slate-700">{value}</div>
    </div>
  );
}
