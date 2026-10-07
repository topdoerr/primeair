import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  EmptyState,
  Id,
  InlineNotice,
  Kbd,
  KeyValue,
  Num,
  PageHeader,
  Tag,
} from '@/components/ui';
import { AlertIcon } from '@/components/icons';
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

const SUBTITLE = 'Live Vapi configuration for the voice agent; edits push back through the Vapi MCP server.';

function extractSystemPrompt(a: VapiAssistant | null): string {
  const messages = a?.model?.messages ?? [];
  const sys = messages.find((m) => m.role === 'system');
  return sys?.content ?? '';
}

export function AssistantView({ configured, assistant, phone, error }: AssistantViewProps) {
  if (!configured) {
    return (
      <div>
        <PageHeader title="Assistant" subtitle={SUBTITLE} />
        <Card>
          <EmptyState
            icon={<AlertIcon />}
            title="Vapi is not configured"
            description={
              <>
                Set <Kbd>VAPI_API_KEY</Kbd> in the environment, then run <Kbd>npm run vapi:provision</Kbd> to create
                the assistant.
              </>
            }
          />
        </Card>
      </div>
    );
  }

  const provider = assistant?.model?.provider;
  const model = assistant?.model?.model;

  return (
    <div>
      <PageHeader title="Assistant" subtitle={SUBTITLE} />

      {error && (
        <Card className="mb-5">
          <EmptyState
            icon={<AlertIcon />}
            title="Could not reach Vapi"
            description="The assistant configuration could not be loaded. Check the API key and try again."
            action={
              <InlineNotice tone="danger" className="max-w-[60ch] text-left">
                {error}
              </InlineNotice>
            }
          />
        </Card>
      )}

      {!error && !assistant && (
        <Card className="mb-5">
          <EmptyState
            icon={<AlertIcon />}
            title="No assistant found"
            description={
              <>
                Run <Kbd>npm run vapi:provision</Kbd> to create the Prime Air AWB Status assistant.
              </>
            }
          />
        </Card>
      )}

      {assistant && (
        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="min-w-0">
            <Card>
              <CardHeader
                title={assistant.name ?? 'Assistant'}
                actions={
                  <span className="inline-flex items-center gap-1.5 text-2xs text-ink-3">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ok-dot" />
                    Live
                  </span>
                }
              />
              <CardBody>
                <KeyValue
                  rows={[
                    {
                      key: 'id',
                      label: 'Assistant ID',
                      value: <Id className="block whitespace-normal break-all text-xs">{assistant.id}</Id>,
                    },
                    {
                      key: 'phone',
                      label: 'Phone number',
                      value: phone?.number ? (
                        <Num className="text-ink">{phone.number}</Num>
                      ) : (
                        <span className="text-ink-3">None attached</span>
                      ),
                    },
                    {
                      key: 'model',
                      label: 'Model',
                      value: (
                        <span className="flex min-w-0 items-center gap-2">
                          {provider ? <Tag className="shrink-0">{provider}</Tag> : <Tag muted>Unspecified</Tag>}
                          {model ? (
                            <Id className="min-w-0 truncate text-xs">{model}</Id>
                          ) : (
                            <span className="text-ink-3">Unspecified</span>
                          )}
                        </span>
                      ),
                    },
                  ]}
                />
              </CardBody>
              <CardFooter>Read from Vapi on every page load.</CardFooter>
            </Card>
          </div>

          <div className="min-w-0">
            <AssistantEditor
              assistantId={assistant.id}
              initialFirstMessage={assistant.firstMessage ?? ''}
              initialSystemPrompt={extractSystemPrompt(assistant)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
