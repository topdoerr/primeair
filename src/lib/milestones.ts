import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AwbStatus,
  IntegrationEvent,
  IntegrationStatus,
  ShipmentMilestone,
} from './types';

// ---------------------------------------------------------------------------
// Milestone tracking.
//
// A shipment moves through a fixed sequence of milestones. Each milestone is
// confirmed from the carrier's cargo portal ("portal pull") and the resulting
// data is pushed into CargoWise through the e-adapter REST integration
// ("CargoWise push"). Both steps are logged in integration_events.
// ---------------------------------------------------------------------------

export const MILESTONE_STEPS = [
  { code: 'BOOKED', label: 'Booking confirmed', location: 'MIA' },
  { code: 'RECEIVED_ORIGIN', label: 'Received at origin (MIA)', location: 'MIA' },
  { code: 'DEPARTED', label: 'Departed MIA', location: 'MIA' },
  { code: 'ARRIVED', label: 'Arrived SJU', location: 'SJU' },
  { code: 'AVAILABLE', label: 'Customs cleared · available for pickup', location: 'SJU' },
  { code: 'DELIVERED', label: 'Delivered / picked up', location: 'SJU' },
] as const;

export type MilestoneCode = (typeof MILESTONE_STEPS)[number]['code'];

export const PORTAL_SYSTEM = 'Amerijet cargo portal';
export const CARGOWISE_SYSTEM = 'CargoWise e-adapter';

// Callers/STT send AWBs many ways: "810-21961413", "81021961413",
// "810 2196 1413". Normalize to canonical 810-XXXXXXXX.
export function normalizeAwb(input: string): string | null {
  const digits = (input || '').replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('810')) return `810-${digits.slice(3)}`;
  const trimmed = (input || '').trim();
  if (/^810-[0-9]{8}$/.test(trimmed)) return trimmed;
  return null;
}

// "M68741", "m6 8741", "M6-8741" -> "M68741". Returns null if it isn't a flight.
export function normalizeFlight(input: string): string | null {
  const compact = (input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^[A-Z][A-Z0-9]\d{3,5}$/.test(compact) ? compact : null;
}

// The AWB status that corresponds to the furthest completed milestone.
export function awbStatusForMilestone(code: string): AwbStatus {
  switch (code) {
    case 'DELIVERED':
      return 'PICKED_UP';
    case 'AVAILABLE':
      return 'AVAILABLE';
    case 'ARRIVED':
      return 'ARRIVED';
    default:
      return 'IN_TRANSIT';
  }
}

// CargoWise-style reference, e.g. CW-261007-7K2Q.
export function makeCargoWiseRef(now = new Date()): string {
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let tail = '';
  for (let i = 0; i < 4; i++) tail += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `CW-${yy}${mm}${dd}-${tail}`;
}

// Merge DB rows onto the canonical step list so the timeline always shows all
// six steps in order, defaulting any missing step to PENDING.
export function fullTimeline(
  masterBillNumber: string,
  rows: ShipmentMilestone[],
): ShipmentMilestone[] {
  return MILESTONE_STEPS.map((step, i) => {
    const row = rows.find((r) => r.code === step.code);
    return (
      row ?? {
        id: `${masterBillNumber}-${step.code}`,
        master_bill_number: masterBillNumber,
        code: step.code,
        label: step.label,
        sequence: i + 1,
        status: 'PENDING',
        occurred_at: null,
        location: step.location,
        source: null,
        notes: null,
        created_at: '',
        updated_at: '',
      }
    );
  });
}

// The milestone a shipment is currently "at": the last completed step, or the
// in-progress one if there is one.
export function currentMilestone(timeline: ShipmentMilestone[]): ShipmentMilestone | null {
  const inProgress = timeline.find((m) => m.status === 'IN_PROGRESS');
  if (inProgress) return inProgress;
  const completed = timeline.filter((m) => m.status === 'COMPLETED');
  return completed.length ? completed[completed.length - 1] : null;
}

export function completedCount(timeline: ShipmentMilestone[]): number {
  return timeline.filter((m) => m.status === 'COMPLETED').length;
}

export async function getMilestones(
  db: SupabaseClient,
  masterBillNumber: string,
): Promise<ShipmentMilestone[]> {
  const { data } = await db
    .from('shipment_milestones')
    .select('*')
    .eq('master_bill_number', masterBillNumber)
    .order('sequence', { ascending: true });
  return (data ?? []) as ShipmentMilestone[];
}

// Make sure the six step rows exist for an AWB (all PENDING). Idempotent.
export async function ensureMilestones(db: SupabaseClient, masterBillNumber: string) {
  const rows = MILESTONE_STEPS.map((step, i) => ({
    master_bill_number: masterBillNumber,
    code: step.code,
    label: step.label,
    sequence: i + 1,
    location: step.location,
  }));
  await db
    .from('shipment_milestones')
    .upsert(rows, { onConflict: 'master_bill_number,code', ignoreDuplicates: true });
}

// ---------------------------------------------------------------------------
// Portal pull: look the shipment up on the carrier's cargo portal and record
// the next milestone it reports. In the pilot this advances the timeline one
// step per pull so the flow can be demonstrated end to end; wiring it to the
// real portal only changes where the milestone data comes from.
// ---------------------------------------------------------------------------
export async function pullFromPortal(
  db: SupabaseClient,
  masterBillNumber: string,
): Promise<{
  milestones: ShipmentMilestone[];
  advanced: ShipmentMilestone | null;
  event: IntegrationEvent;
}> {
  await ensureMilestones(db, masterBillNumber);
  const before = fullTimeline(masterBillNumber, await getMilestones(db, masterBillNumber));

  const next = before.find((m) => m.status !== 'COMPLETED');
  const now = new Date().toISOString();
  let advanced: ShipmentMilestone | null = null;

  if (next) {
    const { data } = await db
      .from('shipment_milestones')
      .update({
        status: 'COMPLETED',
        occurred_at: now,
        source: PORTAL_SYSTEM,
        notes: next.notes ?? null,
      })
      .eq('master_bill_number', masterBillNumber)
      .eq('code', next.code)
      .select()
      .single();
    advanced = (data as ShipmentMilestone) ?? { ...next, status: 'COMPLETED', occurred_at: now };

    // Start the following step, if any.
    const following = before.find((m) => m.sequence === next.sequence + 1);
    if (following && following.status === 'PENDING') {
      await db
        .from('shipment_milestones')
        .update({ status: 'IN_PROGRESS', source: PORTAL_SYSTEM })
        .eq('master_bill_number', masterBillNumber)
        .eq('code', following.code);
    }

    // Keep the AWB's headline status in step with the milestone reached.
    const status = awbStatusForMilestone(next.code);
    const patch: Record<string, unknown> = { status };
    if (next.code === 'AVAILABLE') patch.cargo_ready_at = now;
    await db.from('air_waybills').update(patch).eq('master_bill_number', masterBillNumber);
  }

  const { data: ev } = await db
    .from('integration_events')
    .insert({
      master_bill_number: masterBillNumber,
      kind: 'PORTAL_PULL',
      system: PORTAL_SYSTEM,
      status: 'ACKNOWLEDGED',
      summary: advanced
        ? `Milestone "${advanced.label}" confirmed by portal`
        : 'Portal checked — all milestones already complete',
      payload: { masterBillNumber, milestone: advanced?.code ?? null, pulledAt: now },
    })
    .select()
    .single();

  const milestones = fullTimeline(masterBillNumber, await getMilestones(db, masterBillNumber));
  return { milestones, advanced, event: ev as IntegrationEvent };
}

// ---------------------------------------------------------------------------
// CargoWise push: send milestone (or booking) data to CargoWise through the
// e-adapter REST integration. When CARGOWISE_EADAPTER_URL is configured the
// payload is POSTed there and the adapter's reference is recorded; otherwise
// the push is simulated and acknowledged locally so the flow still runs.
// ---------------------------------------------------------------------------
export async function pushToCargoWise(
  db: SupabaseClient,
  opts: {
    masterBillNumber?: string | null;
    bookingId?: string | null;
    summary: string;
    payload: Record<string, unknown>;
  },
): Promise<IntegrationEvent> {
  const url = process.env.CARGOWISE_EADAPTER_URL;
  let status: IntegrationStatus = 'ACKNOWLEDGED';
  let externalRef = makeCargoWiseRef();
  let detail = opts.summary;

  if (url) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.CARGOWISE_EADAPTER_TOKEN
            ? { Authorization: `Bearer ${process.env.CARGOWISE_EADAPTER_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({ ...opts.payload, pushedAt: new Date().toISOString() }),
      });
      if (res.ok) {
        const body = (await res.json().catch(() => ({}))) as { reference?: string };
        if (body.reference) externalRef = String(body.reference);
      } else {
        status = 'FAILED';
        detail = `${opts.summary} — e-adapter responded ${res.status}`;
      }
    } catch (err) {
      status = 'FAILED';
      detail = `${opts.summary} — e-adapter unreachable: ${(err as Error).message}`;
    }
  }

  const { data } = await db
    .from('integration_events')
    .insert({
      master_bill_number: opts.masterBillNumber ?? null,
      booking_id: opts.bookingId ?? null,
      kind: 'CARGOWISE_PUSH',
      system: CARGOWISE_SYSTEM,
      status,
      external_ref: status === 'FAILED' ? null : externalRef,
      summary: detail,
      payload: opts.payload,
    })
    .select()
    .single();

  return data as IntegrationEvent;
}
