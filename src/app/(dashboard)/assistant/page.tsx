import { PageHeader, Card } from '@/components/ui';
import { AssistantEditor } from '@/components/AssistantEditor';
import {
  getAssistant,
  listPhoneNumbers,
  vapiConfigured,
  type VapiAssistant,
  type VapiPhoneNumber,
} from '@/lib/vapi';

export const dynamic = 'force-dynamic';

function extractSystemPrompt(a: VapiAssistant | null): string {
  const messages = a?.model?.messages ?? [];
  const sys = messages.find((m) => m.role === 'system');
  return sys?.content ?? '';
}

export default async function AssistantPage() {
  if (!vapiConfigured()) {
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

  let assistant: VapiAssistant | null = null;
  let phone: VapiPhoneNumber | null = null;
  let error: string | null = null;

  try {
    assistant = await getAssistant();
    const numbers = await listPhoneNumbers().catch(() => []);
    phone = assistant
      ? numbers.find((n) => n.assistantId === assistant!.id) ?? numbers[0] ?? null
      : null;
  } catch (err) {
    error = (err as Error).message;
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
