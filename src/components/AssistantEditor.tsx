'use client';

import { useState } from 'react';

export function AssistantEditor({
  assistantId,
  initialFirstMessage,
  initialSystemPrompt,
}: {
  assistantId: string;
  initialFirstMessage: string;
  initialSystemPrompt: string;
}) {
  const [firstMessage, setFirstMessage] = useState(initialFirstMessage);
  const [systemPrompt, setSystemPrompt] = useState(initialSystemPrompt);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty =
    firstMessage !== initialFirstMessage || systemPrompt !== initialSystemPrompt;

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/assistant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistantId, firstMessage, systemPrompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? 'Update failed' });
      } else {
        setMsg({ ok: true, text: 'Pushed to Vapi.' });
      }
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">First message</label>
        <textarea
          value={firstMessage}
          onChange={(e) => setFirstMessage(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <p className="mt-1 text-xs text-slate-400">
          Spoken when the assistant answers a call.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">System prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={12}
          className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? 'Pushing…' : 'Push updates to Vapi'}
        </button>
        {msg && (
          <span className={`text-sm ${msg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
