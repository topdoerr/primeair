import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { listCalls, vapiConfigured } from '@/lib/vapi';
import { mapCall } from '@/lib/call-mapping';
import { ensureTicketsForCalls } from '@/lib/tickets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST /api/sync-calls
// Manual "Sync calls" button. Pulls calls from the Vapi MCP server and
// upserts them into Supabase. Requires a signed-in dashboard user.
// ---------------------------------------------------------------------------
export async function POST() {
  // Gate on an authenticated dashboard session.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!vapiConfigured()) {
    return NextResponse.json(
      { error: 'Vapi is not configured (VAPI_API_KEY missing).' },
      { status: 503 },
    );
  }

  let calls;
  try {
    calls = await listCalls(200);
  } catch (err) {
    return NextResponse.json(
      { error: `Could not reach Vapi: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  const rows = calls.filter((c) => c?.id).map(mapCall);
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, synced: 0 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('calls')
    .upsert(rows, { onConflict: 'vapi_call_id' });

  if (error) {
    return NextResponse.json({ error: `Sync write failed: ${error.message}` }, { status: 500 });
  }

  // Backfill follow-up tickets for the synced calls (idempotent per call).
  let ticketsCreated = 0;
  try {
    ticketsCreated = await ensureTicketsForCalls(admin, rows);
  } catch {
    // Non-fatal — calls are already saved.
  }

  return NextResponse.json({ ok: true, synced: rows.length, ticketsCreated });
}
