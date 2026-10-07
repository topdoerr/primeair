'use client';

import { useId, useState } from 'react';
import { Button, Card, CardBody, CardFooter, CardHeader, Field, InlineNotice, Textarea } from '@/components/ui';

// "Prompts" card: edits the first message and system prompt and PATCHes them back to Vapi.
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
  const firstMessageId = useId();
  const systemPromptId = useId();

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
        setMsg({ ok: true, text: 'Pushed to topdoer.' });
      }
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Prompts"
        actions={
          dirty ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-warn-dot" />
              Unsaved changes
            </span>
          ) : undefined
        }
      />

      <CardBody className="space-y-4">
        <Field label="First message" htmlFor={firstMessageId} help="Spoken when the assistant answers a call.">
          <Textarea
            id={firstMessageId}
            value={firstMessage}
            onChange={(e) => setFirstMessage(e.target.value)}
            rows={3}
            placeholder="e.g. Thank you for calling Prime Air, how can I help?"
          />
        </Field>

        <Field label="System prompt" htmlFor={systemPromptId}>
          <Textarea
            id={systemPromptId}
            mono
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={14}
            spellCheck={false}
          />
        </Field>
      </CardBody>

      <CardFooter className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {msg ? (
            <InlineNotice tone={msg.ok ? 'ok' : 'danger'}>{msg.text}</InlineNotice>
          ) : (
            <span>Edits are sent to Vapi through the MCP server.</span>
          )}
        </div>
        <Button variant="primary" size="md" onClick={save} loading={saving} disabled={!dirty} className="shrink-0">
          {saving ? 'Pushing' : 'Push changes'}
        </Button>
      </CardFooter>
    </Card>
  );
}
