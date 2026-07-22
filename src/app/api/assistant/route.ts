import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAssistant,
  updateAssistant,
  listPhoneNumbers,
  vapiConfigured,
} from '@/lib/vapi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// GET /api/assistant -> live assistant config + attached phone number.
export async function GET() {
  if (!(await requireUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!vapiConfigured()) {
    return NextResponse.json({ configured: false });
  }
  try {
    const assistant = await getAssistant();
    const numbers = await listPhoneNumbers().catch(() => []);
    const phone = assistant
      ? numbers.find((n) => n.assistantId === assistant.id) ?? numbers[0] ?? null
      : null;
    return NextResponse.json({ configured: true, assistant, phone });
  } catch (err) {
    return NextResponse.json(
      { configured: true, error: (err as Error).message },
      { status: 502 },
    );
  }
}

// PATCH /api/assistant  { firstMessage?, systemPrompt? } -> updated assistant.
export async function PATCH(req: Request) {
  if (!(await requireUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!vapiConfigured()) {
    return NextResponse.json({ error: 'Vapi not configured' }, { status: 503 });
  }

  let body: { firstMessage?: string; systemPrompt?: string; assistantId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const id = body.assistantId || process.env.VAPI_ASSISTANT_ID;
  if (!id) {
    const found = await getAssistant().catch(() => null);
    if (!found?.id) {
      return NextResponse.json({ error: 'No assistant id available' }, { status: 400 });
    }
    body.assistantId = found.id;
  }

  try {
    const updated = await updateAssistant((body.assistantId || id)!, {
      firstMessage: body.firstMessage,
      systemPrompt: body.systemPrompt,
    });
    return NextResponse.json({ ok: true, assistant: updated });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
