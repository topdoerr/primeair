import { PageHeader, Card } from '@/components/ui';
import { AssistantEditor } from '@/components/AssistantEditor';
// Type-only import: erased at compile time, so the `server-only` guard in
// @/lib/vapi never executes when this View is rendered without a backend.
import type { VapiAssistant, VapiPhoneNumber } from '@/lib/vapi';

export type AssistantViewProps = {
  /** Whether VAPI_API_KEY is set. When false, only the setup notice renders. */
  configured: boolean;
  /** The live Vapi assistant config, or null when none was found. */
  assistant: VapiAssistant | null;
  /** Phone number attached to the assistant (or the first available), or null. */
  phone: VapiPhoneNumber | null;
  /** Error message when Vapi could not be reached, otherwise null. */
  error: string | null;
};

function extractSystemPrompt(a: VapiAssistant | null): string {
  const messages = a?.model?.messages ?? [];
  const sys = messages.find((m) => m.role === 'system');
  return sys?.content ?? '';
}

export function AssistantView({ configured, assistant, phone, error }: AssistantViewProps) {
  if (!configured) {
    return (
      <div>
        <PageHeader title="Assistant" subtitle="Prime Air AWB Status voice agent" />
        <Card>
          <p className="text-sm text-slate-600">
            Vapi is not configured. Set <code className="font-mono">VAPI_API_KEY</code> in your
            environment, then run{' '}
            <code className="font-mono">npm run vapi:provision</code> to create the assistant.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Assistant"
        subtitle="Read the live Vapi config and push edits back through the Vapi MCP server"
      />

      {error && (
        <Card className="mb-6">
          <p className="text-sm text-red-600">Could not reach Vapi: {error}</p>
        </Card>
      )}

      {!error && !assistant && (
        <Card className="mb-6">
          <p className="text-sm text-slate-600">
            No assistant found. Run <code className="font-mono">npm run vapi:provision</code> to
            create “Prime Air AWB Status”.
          </p>
        </Card>
      )}

      {assistant && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <div className="text-sm font-semibold text-slate-900">{assistant.name}</div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase text-slate-400">Assistant ID</dt>
                <dd className="mt-0.5 break-all font-mono text-xs text-slate-600">
                  {assistant.id}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">Phone number</dt>
                <dd className="mt-0.5 font-mono text-slate-700">
                  {phone?.number ?? 'None attached'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">Model</dt>
                <dd className="mt-0.5 text-slate-700">
                  {assistant.model?.provider ?? '—'} / {assistant.model?.model ?? '—'}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="lg:col-span-2">
            <AssistantEditor
              assistantId={assistant.id}
              initialFirstMessage={assistant.firstMessage ?? ''}
              initialSystemPrompt={extractSystemPrompt(assistant)}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
