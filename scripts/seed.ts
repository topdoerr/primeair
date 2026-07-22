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
