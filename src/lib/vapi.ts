import 'server-only';

// ---------------------------------------------------------------------------
// Vapi client (REST API, https://api.vapi.ai).
//
// The assistant is provisioned/managed through the Vapi MCP server
// (scripts/provision-vapi.ts). At runtime the dashboard talks to Vapi's REST
// API with the same private key — it's far more reliable inside Next.js
// serverless functions than holding an MCP/SSE session open per request.
//
// Auth: VAPI_API_KEY (your Vapi private key) as a Bearer token.
// ---------------------------------------------------------------------------

export class VapiError extends Error {}

const ASSISTANT_NAME = 'Prime Air AWB Status';

function apiKey(): string {
  const key = process.env.VAPI_API_KEY;
  if (!key) throw new VapiError('VAPI_API_KEY is not set');
  return key;
}

function baseUrl(): string {
  return process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
}

async function vapiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new VapiError(`Vapi ${init?.method || 'GET'} ${path} -> ${res.status} ${body.slice(0, 300)}`);
  }
  if (res.status === 204) return {} as T;
  return (await res.json()) as T;
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
  const params = new URLSearchParams({ limit: String(limit) });
  if (assistantId) params.set('assistantId', assistantId);
  return vapiFetch<VapiCall[]>(`/call?${params.toString()}`);
}

export async function getCall(callId: string): Promise<VapiCall> {
  return vapiFetch<VapiCall>(`/call/${callId}`);
}

// --- Assistant ------------------------------------------------------------
export interface VapiAssistant {
  id: string;
  name?: string;
  firstMessage?: string;
  model?: {
    provider?: string;
    model?: string;
    messages?: { role: string; content: string }[];
    tools?: unknown[];
  };
  voice?: Record<string, unknown>;
  [k: string]: unknown;
}

export async function getAssistant(id?: string): Promise<VapiAssistant | null> {
  const assistantId = id || process.env.VAPI_ASSISTANT_ID;
  if (assistantId) {
    return vapiFetch<VapiAssistant>(`/assistant/${assistantId}`);
  }
  // Fall back to locating by name.
  const assistants = await vapiFetch<VapiAssistant[]>('/assistant?limit=100');
  return assistants.find((a) => a.name === ASSISTANT_NAME) ?? assistants[0] ?? null;
}

export async function updateAssistant(
  id: string,
  patch: { firstMessage?: string; systemPrompt?: string },
): Promise<VapiAssistant> {
  const body: Record<string, unknown> = {};
  if (patch.firstMessage !== undefined) body.firstMessage = patch.firstMessage;

  if (patch.systemPrompt !== undefined) {
    // Preserve provider/model/tools; only swap the system message.
    const current = await vapiFetch<VapiAssistant>(`/assistant/${id}`);
    const model = current.model ?? {};
    const messages = (model.messages ?? []).filter((m) => m.role !== 'system');
    body.model = {
      ...model,
      messages: [{ role: 'system', content: patch.systemPrompt }, ...messages],
    };
  }

  return vapiFetch<VapiAssistant>(`/assistant/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// --- Phone numbers --------------------------------------------------------
export interface VapiPhoneNumber {
  id: string;
  number?: string;
  assistantId?: string;
  [k: string]: unknown;
}

export async function listPhoneNumbers(): Promise<VapiPhoneNumber[]> {
  return vapiFetch<VapiPhoneNumber[]>('/phone-number?limit=100');
}
