import type { VapiCall } from './vapi';

// Turn a Vapi call object into a row for the `calls` table.
// Prefers structured extraction from the assistant's analysis; falls back to
// simple keyword/regex heuristics over the transcript.

const AWB_RE = /\b810[-\s]?(\d{4})[-\s]?(\d{4})\b|\b810(\d{8})\b/;

export function extractAwb(text: string | undefined | null): string | null {
  if (!text) return null;
  const m = text.match(AWB_RE);
  if (!m) return null;
  const digits = m[0].replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('810')) return `810-${digits.slice(3)}`;
  return null;
}

export function detectIntent(text: string | undefined | null): string {
  const t = (text || '').toLowerCase();
  if (!t) return 'other';
  if (/(pick ?up|pickup|schedule|delivery|window|collect my)/.test(t)) return 'schedule_pickup';
  if (/(invoice|charge|charges|billing|total collect|why.*cost)/.test(t)) return 'invoice_question';
  if (/(status|where.*cargo|arrived|available|track|flight)/.test(t)) return 'awb_status';
  return 'other';
}

function deriveOutcome(call: VapiCall, transcript: string): string {
  const struct = call.analysis?.structuredData ?? {};
  if (typeof struct.outcome === 'string') return struct.outcome;
  const t = transcript.toLowerCase();
  if (/scheduled|booked a pickup|pickup.*scheduled/.test(t)) return 'scheduled';
  if (/transfer|connect you|billing department/.test(t)) return 'transferred';
  if (call.endedReason && /customer-ended|assistant-ended|hangup/.test(call.endedReason)) {
    return 'self_served';
  }
  return 'self_served';
}

function transcriptOf(call: VapiCall): string {
  return (
    call.transcript ||
    call.artifact?.transcript ||
    (call.analysis?.summary ? `Summary: ${call.analysis.summary}` : '') ||
    ''
  );
}

function durationSeconds(call: VapiCall): number | null {
  if (!call.startedAt || !call.endedAt) return null;
  const s = new Date(call.startedAt).getTime();
  const e = new Date(call.endedAt).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return null;
  return Math.round((e - s) / 1000);
}

export interface CallRow {
  vapi_call_id: string;
  caller: string | null;
  assistant_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration: number | null;
  transcript: string | null;
  detected_intent: string;
  referenced_awb: string | null;
  outcome: string;
  raw: unknown;
}

export function mapCall(call: VapiCall): CallRow {
  const transcript = transcriptOf(call);
  const struct = call.analysis?.structuredData ?? {};
  const referencedAwb =
    (typeof struct.referencedAwb === 'string' && struct.referencedAwb) ||
    (typeof struct.masterBillNumber === 'string' && struct.masterBillNumber) ||
    extractAwb(transcript);
  const intent =
    (typeof struct.intent === 'string' && struct.intent) || detectIntent(transcript);

  return {
    vapi_call_id: call.id,
    caller: call.customer?.number ?? call.phoneNumber?.number ?? null,
    assistant_id: call.assistantId ?? null,
    started_at: call.startedAt ?? null,
    ended_at: call.endedAt ?? null,
    duration: durationSeconds(call),
    transcript: transcript || null,
    detected_intent: intent,
    referenced_awb: referencedAwb || null,
    outcome: deriveOutcome(call, transcript),
    raw: call,
  };
}
