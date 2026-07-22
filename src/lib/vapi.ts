import 'server-only';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

// ---------------------------------------------------------------------------
// Vapi is managed exclusively through the Vapi MCP server (mcp.vapi.ai/sse).
// This module opens a short-lived MCP session per request, calls a tool, and
// closes it. Auth is the private VAPI_API_KEY as a Bearer token.
//
// All exported helpers throw VapiError on failure; callers decide whether to
// surface the error or degrade to an empty state so the dashboard still loads.
// ---------------------------------------------------------------------------

export class VapiError extends Error {}

const ASSISTANT_NAME = 'Prime Air AWB Status';

function apiKey(): string {
  const key = process.env.VAPI_API_KEY;
  if (!key) throw new VapiError('VAPI_API_KEY is not set');
  return key;
}

function mcpUrl(): URL {
  return new URL(process.env.VAPI_MCP_URL || 'https://mcp.vapi.ai/sse');
}

// Open an authenticated MCP client. The Authorization header is injected on
// both the SSE GET stream and the JSON-RPC POSTs.
async function connect(): Promise<Client> {
  const headers = { Authorization: `Bearer ${apiKey()}` };
  const transport = new SSEClientTransport(mcpUrl(), {
    requestInit: { headers },
    eventSourceInit: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, headers: { ...(init?.headers || {}), ...headers } }),
    },
  });
  const client = new Client(
    { name: 'prime-air-dashboard', version: '0.1.0' },
    { capabilities: {} },
  );
  await client.connect(transport);
  return client;
}

// Call a single Vapi MCP tool and parse its JSON text content.
async function callTool<T = unknown>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  let client: Client | null = null;
  try {
    client = await connect();
    const res = await client.callTool({ name, arguments: args });
    if (res.isError) {
      throw new VapiError(`Vapi tool ${name} returned an error`);
    }
    return parseToolResult<T>(res);
  } finally {
    if (client) await client.close().catch(() => {});
  }
}

function parseToolResult<T>(res: any): T {
  const content = Array.isArray(res?.content) ? res.content : [];
  const textPart = content.find((c: any) => c?.type === 'text');
  if (!textPart) return {} as T;
  try {
    return JSON.parse(textPart.text) as T;
  } catch {
    // Some tools return plain text; hand it back verbatim.
    return textPart.text as unknown as T;
  }
}

// The exact tool names exposed by the Vapi MCP server can evolve. Each helper
// tries the known aliases in order and uses the first that succeeds.
async function callFirst<T>(
  names: string[],
  args: Record<string, unknown> = {},
): Promise<T> {
  let lastErr: unknown;
  for (const name of names) {
    try {
      return await callTool<T>(name, args);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new VapiError(
    `None of [${names.join(', ')}] succeeded: ${(lastErr as Error)?.message ?? 'unknown'}`,
  );
}

export function vapiConfigured(): boolean {
  return Boolean(process.env.VAPI_API_KEY);
}

// --- Calls ----------------------------------------------------------------
export interface VapiCall {
  id: string;
  assistantId?: string;
  phoneNumber?: { number?: string } | null;
  customer?: { number?: string } | null;
  startedAt?: string;
  endedAt?: string;
  // Vapi provides a rolled-up transcript on the artifact/message list.
  transcript?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  artifact?: {
    transcript?: string;
    messages?: unknown[];
    recordingUrl?: string;
    stereoRecordingUrl?: string;
    recording?: { url?: string; stereoUrl?: string; mono?: { combinedUrl?: string } };
  } | null;
  analysis?: {
    summary?: string;
    structuredData?: Record<string, unknown>;
    successEvaluation?: string;
  } | null;
  endedReason?: string;
  [k: string]: unknown;
}

export async function listCalls(limit = 100): Promise<VapiCall[]> {
  const assistantId = process.env.VAPI_ASSISTANT_ID;
  const args: Record<string, unknown> = { limit };
  if (assistantId) args.assistantId = assistantId;
  const result = await callFirst<VapiCall[] | { calls?: VapiCall[]; results?: VapiCall[] }>(
    ['list_calls', 'listCalls', 'get_calls'],
    args,
  );
  if (Array.isArray(result)) return result;
  return result.calls ?? result.results ?? [];
}

export async function getCall(callId: string): Promise<VapiCall> {
  return callFirst<VapiCall>(['get_call', 'getCall'], { callId, id: callId });
}

// --- Assistant ------------------------------------------------------------
export interface VapiAssistant {
  id: string;
  name?: string;
  firstMessage?: string;
  model?: { messages?: { role: string; content: string }[]; provider?: string; model?: string };
  voice?: Record<string, unknown>;
  [k: string]: unknown;
}

export async function getAssistant(id?: string): Promise<VapiAssistant | null> {
  const assistantId = id || process.env.VAPI_ASSISTANT_ID;
  if (assistantId) {
    return callFirst<VapiAssistant>(['get_assistant', 'getAssistant'], {
      assistantId,
      id: assistantId,
    });
  }
  // Fall back to locating by name.
  const list = await callFirst<VapiAssistant[] | { assistants?: VapiAssistant[] }>(
    ['list_assistants', 'listAssistants'],
    {},
  );
  const assistants = Array.isArray(list) ? list : list.assistants ?? [];
  return assistants.find((a) => a.name === ASSISTANT_NAME) ?? assistants[0] ?? null;
}

export async function updateAssistant(
  id: string,
  patch: Partial<Pick<VapiAssistant, 'firstMessage'>> & {
    systemPrompt?: string;
  },
): Promise<VapiAssistant> {
  const args: Record<string, unknown> = { assistantId: id, id };
  if (patch.firstMessage !== undefined) args.firstMessage = patch.firstMessage;
  if (patch.systemPrompt !== undefined) {
    // Vapi keeps the system prompt as the first model message.
    args.model = {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [{ role: 'system', content: patch.systemPrompt }],
    };
  }
  return callFirst<VapiAssistant>(['update_assistant', 'updateAssistant'], args);
}

// --- Phone numbers --------------------------------------------------------
export interface VapiPhoneNumber {
  id: string;
  number?: string;
  assistantId?: string;
  [k: string]: unknown;
}

export async function listPhoneNumbers(): Promise<VapiPhoneNumber[]> {
  const result = await callFirst<VapiPhoneNumber[] | { results?: VapiPhoneNumber[] }>(
    ['list_phone_numbers', 'listPhoneNumbers'],
    {},
  );
  return Array.isArray(result) ? result : result.results ?? [];
}
