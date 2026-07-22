import type { SupabaseClient } from '@supabase/supabase-js';
import type { CallRow } from './call-mapping';

// Derive a follow-up ticket from a completed call. One ticket per call
// (keyed by vapi_call_id) so re-syncing never creates duplicates.

const SUBJECTS: Record<string, string> = {
  awb_status: 'AWB status inquiry',
  schedule_pickup: 'Pickup scheduling',
  invoice_question: 'Invoice/charges question',
  other: 'General inquiry',
};

export interface TicketDraft {
  vapi_call_id: string;
  master_bill_number: string | null;
  subject: string;
  category: string;
  priority: 'low' | 'normal' | 'high';
  status: 'open' | 'closed';
  description: string | null;
}

export function deriveTicket(call: CallRow): TicketDraft {
  const intent = call.detected_intent || 'other';
  const base = SUBJECTS[intent] ?? SUBJECTS.other;
  const subject = call.referenced_awb ? `${base} — ${call.referenced_awb}` : base;

  const priority: TicketDraft['priority'] =
    intent === 'invoice_question' || call.outcome === 'transferred'
      ? 'high'
      : intent === 'awb_status' && call.outcome === 'self_served'
        ? 'low'
        : 'normal';

  // A call fully handled by the agent needs no human follow-up.
  const status: TicketDraft['status'] = call.outcome === 'self_served' ? 'closed' : 'open';

  const description = summarize(call);

  return {
    vapi_call_id: call.vapi_call_id,
    master_bill_number: call.referenced_awb,
    subject,
    category: intent,
    priority,
    status,
    description,
  };
}

function summarize(call: CallRow): string | null {
  const t = (call.transcript || '').trim().replace(/\s+/g, ' ');
  if (!t) return null;
  return t.length > 300 ? `${t.slice(0, 300)}…` : t;
}

// Create tickets for the given calls if they don't already exist.
export async function ensureTicketsForCalls(
  admin: SupabaseClient,
  calls: CallRow[],
): Promise<number> {
  const drafts = calls.filter((c) => c.vapi_call_id).map(deriveTicket);
  if (drafts.length === 0) return 0;
  const { data, error } = await admin
    .from('tickets')
    .upsert(drafts, { onConflict: 'vapi_call_id', ignoreDuplicates: true })
    .select('id');
  if (error) throw error;
  return data?.length ?? 0;
}
