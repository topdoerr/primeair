import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { mapCall } from '@/lib/call-mapping';
import type { VapiCall } from '@/lib/vapi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST /api/vapi/webhook
// Vapi server messages land here. We authenticate with a shared secret and
// upsert the call into Supabase on end-of-call-report (transcript + analysis
// are complete at that point).
//
// Set the same secret as the assistant's Server URL secret; Vapi echoes it in
// the `x-vapi-secret` header.
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (secret) {
    const provided = req.headers.get('x-vapi-secret');
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const message = payload?.message ?? payload;
  const type: string = message?.type ?? '';

  // We only persist completed calls. Acknowledge everything else so Vapi
  // doesn't retry (e.g. status-update, speech-update, transcript chunks).
  if (type !== 'end-of-call-report') {
    return NextResponse.json({ ok: true, ignored: type || 'unknown' });
  }

  const call: VapiCall | undefined = message.call
    ? {
        ...message.call,
        artifact: message.artifact ?? message.call.artifact,
        analysis: message.analysis ?? message.call.analysis,
        transcript: message.transcript ?? message.call.transcript,
        endedReason: message.endedReason ?? message.call.endedReason,
        startedAt: message.startedAt ?? message.call.startedAt,
        endedAt: message.endedAt ?? message.call.endedAt,
      }
    : undefined;

  if (!call?.id) {
    return NextResponse.json({ error: 'No call id in payload' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('calls')
    .upsert(mapCall(call), { onConflict: 'vapi_call_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, callId: call.id });
}
