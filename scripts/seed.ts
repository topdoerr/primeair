/**
 * Seed Supabase with demo data (idempotent upserts) using the service-role key.
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 *   npm run db:seed
 *
 * Prefer running supabase/seed.sql in the SQL editor if you want pure SQL; this
 * script produces the same rows and additionally derives each DiscrepancyReport
 * XML + status from the shared reconciliation rule.
 */
import { createClient } from '@supabase/supabase-js';
import { reconcile } from '../src/lib/reconcile';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('ERROR: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

interface Seed {
  master_bill_number: string;
  carrier_code: string;
  flight: string;
  commodity: string;
  weight_charge: number;
  other_charges: number;
  total_collect: number;
  status: string;
  cargo_ready_offset_hours: number | null;
  invoice_number: string;
  message_id: string;
}

const AWBS: Seed[] = [
  {
    master_bill_number: '810-21961413',
    carrier_code: 'M6',
    flight: 'M68741',
    commodity: 'Fresh cut flowers',
    weight_charge: 1685.25,
    other_charges: 280.88,
    total_collect: 1966.13,
    status: 'AVAILABLE',
    cargo_ready_offset_hours: -3,
    invoice_number: 'INV-M6-778412',
    message_id: 'MSG-M6-20260721-001',
  },
  {
    master_bill_number: '810-21961306',
    carrier_code: 'M6',
    flight: 'M68641',
    commodity: 'Empty plastic bottles',
    weight_charge: 9011.04,
    other_charges: 1407.97,
    total_collect: 10419.01,
    status: 'ARRIVED',
    cargo_ready_offset_hours: -1,
    invoice_number: 'INV-M6-778419',
    message_id: 'MSG-M6-20260721-002',
  },
  {
    // Synthetic FLAGGED example: 4200 + 615.50 = 4815.50 != 5000.
    master_bill_number: '810-21961500',
    carrier_code: 'M6',
    flight: 'M68741',
    commodity: 'Pharmaceuticals (cold chain)',
    weight_charge: 4200.0,
    other_charges: 615.5,
    total_collect: 5000.0,
    status: 'IN_TRANSIT',
    cargo_ready_offset_hours: null,
    invoice_number: 'INV-M6-778533',
    message_id: 'MSG-M6-20260722-003',
  },
];

function xmlFor(s: Seed): string {
  const r = reconcile(s.weight_charge, s.other_charges, s.total_collect);
  const reason =
    r.status === 'FLAGGED'
      ? '\n    <Reason>weight_charge + other_charges != total_collect</Reason>'
      : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<DiscrepancyReport>
  <MessageId>${s.message_id}</MessageId>
  <CarrierCode>${s.carrier_code}</CarrierCode>
  <InvoiceNumber>${s.invoice_number}</InvoiceNumber>
  <MasterBillNumber>${s.master_bill_number}</MasterBillNumber>
  <Route origin="MIA" destination="SJU"/>
  <Flight>${s.flight}</Flight>
  <Commodity>${s.commodity}</Commodity>
  <Charges currency="USD">
    <WeightCharge>${s.weight_charge.toFixed(2)}</WeightCharge>
    <OtherCharges>${s.other_charges.toFixed(2)}</OtherCharges>
    <TotalCollect>${s.total_collect.toFixed(2)}</TotalCollect>
  </Charges>
  <Reconciliation status="${r.status}">
    <Expected>${r.expected.toFixed(2)}</Expected>
    <Computed>${s.total_collect.toFixed(2)}</Computed>
    <Delta>${r.delta.toFixed(2)}</Delta>${reason}
  </Reconciliation>
</DiscrepancyReport>`;
}

async function main() {
  const now = Date.now();

  // air_waybills
  const awbRows = AWBS.map((s) => ({
    master_bill_number: s.master_bill_number,
    carrier_code: s.carrier_code,
    flight: s.flight,
    origin: 'MIA',
    destination: 'SJU',
    commodity: s.commodity,
    weight_charge: s.weight_charge,
    other_charges: s.other_charges,
    total_collect: s.total_collect,
    status: s.status,
    cargo_ready_at:
      s.cargo_ready_offset_hours == null
        ? null
        : new Date(now + s.cargo_ready_offset_hours * 3600_000).toISOString(),
  }));
  await upsert('air_waybills', awbRows, 'master_bill_number');

  // discrepancy_reports
  const reportRows = AWBS.map((s) => ({
    message_id: s.message_id,
    carrier_code: s.carrier_code,
    invoice_number: s.invoice_number,
    master_bill_number: s.master_bill_number,
    status: reconcile(s.weight_charge, s.other_charges, s.total_collect).status,
    payload_xml: xmlFor(s),
  }));
  await upsert('discrepancy_reports', reportRows, 'message_id');

  // demo calls (timestamped today so KPIs render)
  const callRows = [
    {
      vapi_call_id: 'demo-call-0001',
      caller: '+17875551234',
      assistant_id: 'demo-assistant',
      started_at: new Date(now - 2 * 3600_000).toISOString(),
      ended_at: new Date(now - 2 * 3600_000 + 95_000).toISOString(),
      duration: 95,
      detected_intent: 'awb_status',
      referenced_awb: '810-21961413',
      outcome: 'self_served',
      transcript:
        'Assistant: Thanks for calling Prime Air. AWB status or a pickup?\nCaller: Status on 810-21961413.\nAssistant: Flight M68741 MIA to SJU, fresh cut flowers, arrived and available for pickup.',
    },
    {
      vapi_call_id: 'demo-call-0002',
      caller: '+17875559876',
      assistant_id: 'demo-assistant',
      started_at: new Date(now - 40 * 60_000).toISOString(),
      ended_at: new Date(now - 40 * 60_000 + 160_000).toISOString(),
      duration: 160,
      detected_intent: 'schedule_pickup',
      referenced_awb: '810-21961306',
      outcome: 'scheduled',
      transcript:
        'Caller: I need to pick up 810-21961306 tomorrow morning.\nAssistant: Scheduled a pickup window for tomorrow 9 to 11 AM.',
    },
    {
      vapi_call_id: 'demo-call-0003',
      caller: '+13055552211',
      assistant_id: 'demo-assistant',
      started_at: new Date(now - 15 * 60_000).toISOString(),
      ended_at: new Date(now - 15 * 60_000 + 210_000).toISOString(),
      duration: 210,
      detected_intent: 'invoice_question',
      referenced_awb: '810-21961500',
      outcome: 'transferred',
      transcript:
        'Caller asked why total collect did not match line items on invoice INV-M6-778533. Assistant explained and transferred to billing.',
    },
  ];
  await upsert('calls', callRows, 'vapi_call_id');

  // demo pickup (tomorrow 9-11)
  const tomorrow = new Date(now + 24 * 3600_000);
  tomorrow.setHours(9, 0, 0, 0);
  const end = new Date(tomorrow);
  end.setHours(11, 0, 0, 0);
  const { data: existingPickup } = await db
    .from('pickups')
    .select('id')
    .eq('vapi_call_id', 'demo-call-0002')
    .maybeSingle();
  if (!existingPickup) {
    const { error } = await db.from('pickups').insert({
      master_bill_number: '810-21961306',
      window_start: tomorrow.toISOString(),
      window_end: end.toISOString(),
      contact: '+17875559876',
      status: 'SCHEDULED',
      source: 'voice_agent',
      vapi_call_id: 'demo-call-0002',
    });
    if (error) throw error;
  }

  // tickets (one per demo call; auto-created per call in production)
  const ticketRows = [
    {
      vapi_call_id: 'demo-call-0001',
      master_bill_number: '810-21961413',
      subject: 'AWB status inquiry — 810-21961413',
      category: 'awb_status',
      priority: 'low',
      status: 'closed',
      description:
        'Caller confirmed flight M68741 (MIA->SJU), fresh cut flowers, arrived and available for pickup. Self-served.',
    },
    {
      vapi_call_id: 'demo-call-0002',
      master_bill_number: '810-21961306',
      subject: 'Pickup scheduling — 810-21961306',
      category: 'schedule_pickup',
      priority: 'normal',
      status: 'open',
      description:
        'Caller requested pickup for tomorrow morning; window 9-11 AM booked by the agent. Confirm dock availability.',
    },
    {
      vapi_call_id: 'demo-call-0003',
      master_bill_number: '810-21961500',
      subject: 'Invoice/charges question — 810-21961500',
      category: 'invoice_question',
      priority: 'high',
      status: 'open',
      description:
        'Caller disputed total collect vs line items on invoice INV-M6-778533. Transferred to billing; follow up on reconciliation (report FLAGGED).',
    },
  ];
  await upsert('tickets', ticketRows, 'vapi_call_id');

  // --- Milestone tracking + CargoWise sync + recurring-client bookings -----
  const H = 3600_000;
  const D = 24 * H;
  const ago = (ms: number) => new Date(now - ms).toISOString();
  const dateIn = (days: number) => new Date(now + days * D).toISOString().slice(0, 10);
  const PORTAL = 'Amerijet cargo portal';
  const ms = (
    master_bill_number: string,
    code: string,
    label: string,
    sequence: number,
    status: string,
    occurred_at: string | null,
    location: string,
    source: string | null,
    notes: string | null,
  ) => ({ master_bill_number, code, label, sequence, status, occurred_at, location, source, notes });

  const milestoneRows = [
    // fresh cut flowers — arrived, cleared, available for pickup
    ms('810-21961413', 'BOOKED', 'Booking confirmed', 1, 'COMPLETED', ago(5 * D), 'MIA', 'CargoWise', 'Booked by Flores de Borinquen'),
    ms('810-21961413', 'RECEIVED_ORIGIN', 'Received at origin (MIA)', 2, 'COMPLETED', ago(4 * D), 'MIA', PORTAL, '139 pieces, 1,031 kg · keep in cooler'),
    ms('810-21961413', 'DEPARTED', 'Departed MIA', 3, 'COMPLETED', ago(3 * D), 'MIA', PORTAL, 'Flight M68741'),
    ms('810-21961413', 'ARRIVED', 'Arrived SJU', 4, 'COMPLETED', ago(3 * D - 4 * H), 'SJU', PORTAL, 'Flight M68741'),
    ms('810-21961413', 'AVAILABLE', 'Customs cleared · available for pickup', 5, 'COMPLETED', ago(3 * H), 'SJU', PORTAL, null),
    ms('810-21961413', 'DELIVERED', 'Delivered / picked up', 6, 'PENDING', null, 'SJU', null, null),
    // empty plastic bottles — arrived, customs clearance in progress
    ms('810-21961306', 'BOOKED', 'Booking confirmed', 1, 'COMPLETED', ago(4 * D), 'MIA', 'CargoWise', 'Booked by Caribe Bottling Co.'),
    ms('810-21961306', 'RECEIVED_ORIGIN', 'Received at origin (MIA)', 2, 'COMPLETED', ago(3 * D), 'MIA', PORTAL, '25 pallets, 4,617 kg'),
    ms('810-21961306', 'DEPARTED', 'Departed MIA', 3, 'COMPLETED', ago(2 * D), 'MIA', PORTAL, 'Flight M68641'),
    ms('810-21961306', 'ARRIVED', 'Arrived SJU', 4, 'COMPLETED', ago(1 * H), 'SJU', PORTAL, 'Flight M68641'),
    ms('810-21961306', 'AVAILABLE', 'Customs cleared · available for pickup', 5, 'IN_PROGRESS', null, 'SJU', PORTAL, 'Customs clearance in progress'),
    ms('810-21961306', 'DELIVERED', 'Delivered / picked up', 6, 'PENDING', null, 'SJU', null, null),
    // pharmaceuticals (cold chain) — in the air
    ms('810-21961500', 'BOOKED', 'Booking confirmed', 1, 'COMPLETED', ago(2 * D), 'MIA', 'CargoWise', 'Booked by Farmacias del Caribe'),
    ms('810-21961500', 'RECEIVED_ORIGIN', 'Received at origin (MIA)', 2, 'COMPLETED', ago(1 * D), 'MIA', PORTAL, 'Cold chain verified 2–8 °C'),
    ms('810-21961500', 'DEPARTED', 'Departed MIA', 3, 'COMPLETED', ago(2 * H), 'MIA', PORTAL, 'Flight M68741'),
    ms('810-21961500', 'ARRIVED', 'Arrived SJU', 4, 'IN_PROGRESS', null, 'SJU', PORTAL, 'In flight — ETA today'),
    ms('810-21961500', 'AVAILABLE', 'Customs cleared · available for pickup', 5, 'PENDING', null, 'SJU', null, null),
    ms('810-21961500', 'DELIVERED', 'Delivered / picked up', 6, 'PENDING', null, 'SJU', null, null),
  ];
  await upsert('shipment_milestones', milestoneRows, 'master_bill_number,code');

  const customerRows = [
    { account_code: 'FDC-001', name: 'Farmacias del Caribe', contact_name: 'Marisol Rivera', contact_phone: '+1 787-555-0142', contact_email: 'ops@farmaciasdelcaribe.example', default_commodity: 'Pharmaceuticals (cold chain)', is_recurring: true },
    { account_code: 'FLB-002', name: 'Flores de Borinquen', contact_name: 'Luis Ortiz', contact_phone: '+1 787-555-0187', contact_email: 'luis@floresborinquen.example', default_commodity: 'Fresh cut flowers', is_recurring: true },
    { account_code: 'CBC-003', name: 'Caribe Bottling Co.', contact_name: 'Ana Méndez', contact_phone: '+1 787-555-0119', contact_email: 'logistics@caribebottling.example', default_commodity: 'Empty plastic bottles', is_recurring: true },
    { account_code: 'MDS-004', name: 'MedSupply PR', contact_name: 'Carlos Vega', contact_phone: '+1 787-555-0163', contact_email: 'cvega@medsupplypr.example', default_commodity: 'Controlled medications', is_recurring: true },
  ];
  await upsert('customers', customerRows, 'account_code');

  // Integration events and bookings have no natural key: seed once, when empty.
  const { count: eventCount } = await db
    .from('integration_events')
    .select('id', { count: 'exact', head: true });
  if (!eventCount) {
    const CW = 'CargoWise e-adapter';
    const eventRows = [
      { master_bill_number: '810-21961413', kind: 'PORTAL_PULL', system: PORTAL, status: 'ACKNOWLEDGED', external_ref: null, summary: 'Milestone "Customs cleared · available for pickup" confirmed by portal', payload: { flight: 'M68741', milestone: 'AVAILABLE' }, created_at: ago(3 * H) },
      { master_bill_number: '810-21961413', kind: 'CARGOWISE_PUSH', system: CW, status: 'ACKNOWLEDGED', external_ref: 'CW-260811-7K2Q', summary: '5 of 6 milestones pushed to CargoWise', payload: { masterBillNumber: '810-21961413', milestonesPushed: 5 }, created_at: ago(3 * H - 5 * 60_000) },
      { master_bill_number: '810-21961306', kind: 'PORTAL_PULL', system: PORTAL, status: 'ACKNOWLEDGED', external_ref: null, summary: 'Milestone "Arrived SJU" confirmed by portal', payload: { flight: 'M68641', milestone: 'ARRIVED' }, created_at: ago(1 * H) },
      { master_bill_number: '810-21961306', kind: 'CARGOWISE_PUSH', system: CW, status: 'ACKNOWLEDGED', external_ref: 'CW-260811-M4HD', summary: '4 of 6 milestones pushed to CargoWise', payload: { masterBillNumber: '810-21961306', milestonesPushed: 4 }, created_at: ago(55 * 60_000) },
      { master_bill_number: '810-21961500', kind: 'PORTAL_PULL', system: PORTAL, status: 'ACKNOWLEDGED', external_ref: null, summary: 'Milestone "Departed MIA" confirmed by portal', payload: { flight: 'M68741', milestone: 'DEPARTED' }, created_at: ago(2 * H) },
      { master_bill_number: '810-21961500', kind: 'CARGOWISE_PUSH', system: CW, status: 'ACKNOWLEDGED', external_ref: 'CW-260811-Z9PA', summary: '3 of 6 milestones pushed to CargoWise', payload: { masterBillNumber: '810-21961500', milestonesPushed: 3 }, created_at: ago(2 * H - 10 * 60_000) },
    ];
    const { error } = await db.from('integration_events').insert(eventRows);
    if (error) throw new Error(`integration_events: ${error.message}`);
    console.log(`  integration_events: ${eventRows.length} row(s) inserted`);
  }

  const { count: bookingCount } = await db
    .from('bookings')
    .select('id', { count: 'exact', head: true });
  if (!bookingCount) {
    const { data: customers } = await db.from('customers').select('id, name');
    const idFor = (name: string) =>
      (customers as { id: string; name: string }[] | null)?.find((c) => c.name === name)?.id ?? null;
    const bookingRows = [
      { customer_id: idFor('Farmacias del Caribe'), customer_name: 'Farmacias del Caribe', commodity: 'Pharmaceuticals (cold chain)', pieces: 4, weight_kg: 1800, requested_date: dateIn(2), flight: 'M68741', status: 'CONFIRMED', source: 'dashboard', cargowise_ref: 'CW-260811-B1FD', notes: 'Recurring weekly cold-chain lane', created_at: ago(1 * D) },
      { customer_id: idFor('Flores de Borinquen'), customer_name: 'Flores de Borinquen', commodity: 'Fresh cut flowers', pieces: 139, weight_kg: 1031, requested_date: dateIn(1), flight: 'M68741', status: 'CONFIRMED', source: 'voice_agent', cargowise_ref: 'CW-260811-B2FL', notes: 'Booked by the voice agent on behalf of the client', created_at: ago(6 * H) },
      { customer_id: idFor('MedSupply PR'), customer_name: 'MedSupply PR', commodity: 'Controlled medications', pieces: 2, weight_kg: 150, requested_date: dateIn(3), flight: null, status: 'REQUESTED', source: 'voice_agent', cargowise_ref: null, notes: 'Temperature-controlled 2–8 °C · awaiting confirmation', created_at: ago(40 * 60_000) },
    ];
    const { error } = await db.from('bookings').insert(bookingRows);
    if (error) throw new Error(`bookings: ${error.message}`);
    console.log(`  bookings: ${bookingRows.length} row(s) inserted`);
  }

  console.log('✅ Seed complete.');
}

async function upsert(table: string, rows: unknown[], onConflict: string) {
  const { error } = await db.from(table).upsert(rows as any, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ${table}: ${rows.length} row(s) upserted`);
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
