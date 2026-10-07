// Fixture data for the dev-only design preview (/design-preview) so every
// screen can be rendered and screenshotted without a database or a session.
// Shapes mirror the Supabase rows; values mirror the demo seed.
import type {
  AirWaybill,
  Booking,
  CallRecord,
  Customer,
  DiscrepancyReport,
  IntegrationEvent,
  ShipmentMilestone,
  Ticket,
} from './types';

const T0 = Date.parse('2026-10-07T14:00:00-04:00');
const iso = (offsetMinutes: number) => new Date(T0 + offsetMinutes * 60_000).toISOString();
const H = 60;
const D = 24 * H;

export const FIXTURE_AWBS: AirWaybill[] = [
  {
    id: 'awb-1',
    master_bill_number: '810-21961413',
    carrier_code: 'M6',
    flight: 'M68741',
    origin: 'MIA',
    destination: 'SJU',
    commodity: 'Fresh cut flowers',
    weight_charge: 1685.25,
    other_charges: 280.88,
    total_collect: 1966.13,
    status: 'AVAILABLE',
    cargo_ready_at: iso(-3 * H),
    created_at: iso(-5 * D),
    updated_at: iso(-3 * H),
  },
  {
    id: 'awb-2',
    master_bill_number: '810-21961306',
    carrier_code: 'M6',
    flight: 'M68641',
    origin: 'MIA',
    destination: 'SJU',
    commodity: 'Empty plastic bottles',
    weight_charge: 9011.04,
    other_charges: 1407.97,
    total_collect: 10419.01,
    status: 'ARRIVED',
    cargo_ready_at: iso(-1 * H),
    created_at: iso(-4 * D),
    updated_at: iso(-1 * H),
  },
  {
    id: 'awb-3',
    master_bill_number: '810-21961500',
    carrier_code: 'M6',
    flight: 'M68741',
    origin: 'MIA',
    destination: 'SJU',
    commodity: 'Pharmaceuticals (cold chain)',
    weight_charge: 4200.0,
    other_charges: 615.5,
    total_collect: 5000.0,
    status: 'IN_TRANSIT',
    cargo_ready_at: null,
    created_at: iso(-2 * D),
    updated_at: iso(-2 * H),
  },
];

const PORTAL = 'Amerijet cargo portal';
function ms(
  master_bill_number: string,
  code: string,
  label: string,
  sequence: number,
  status: ShipmentMilestone['status'],
  occurred_at: string | null,
  location: string,
  source: string | null,
  notes: string | null,
): ShipmentMilestone {
  return {
    id: `${master_bill_number}-${code}`,
    master_bill_number,
    code,
    label,
    sequence,
    status,
    occurred_at,
    location,
    source,
    notes,
    created_at: iso(-5 * D),
    updated_at: occurred_at ?? iso(-5 * D),
  };
}

export const FIXTURE_MILESTONES: ShipmentMilestone[] = [
  ms('810-21961413', 'BOOKED', 'Booking confirmed', 1, 'COMPLETED', iso(-5 * D), 'MIA', 'CargoWise', 'Booked by Flores de Borinquen'),
  ms('810-21961413', 'RECEIVED_ORIGIN', 'Received at origin (MIA)', 2, 'COMPLETED', iso(-4 * D), 'MIA', PORTAL, '139 pieces, 1,031 kg · keep in cooler'),
  ms('810-21961413', 'DEPARTED', 'Departed MIA', 3, 'COMPLETED', iso(-3 * D), 'MIA', PORTAL, 'Flight M68741'),
  ms('810-21961413', 'ARRIVED', 'Arrived SJU', 4, 'COMPLETED', iso(-3 * D + 4 * H), 'SJU', PORTAL, 'Flight M68741'),
  ms('810-21961413', 'AVAILABLE', 'Customs cleared · available for pickup', 5, 'COMPLETED', iso(-3 * H), 'SJU', PORTAL, null),
  ms('810-21961413', 'DELIVERED', 'Delivered / picked up', 6, 'PENDING', null, 'SJU', null, null),
  ms('810-21961306', 'BOOKED', 'Booking confirmed', 1, 'COMPLETED', iso(-4 * D), 'MIA', 'CargoWise', 'Booked by Caribe Bottling Co.'),
  ms('810-21961306', 'RECEIVED_ORIGIN', 'Received at origin (MIA)', 2, 'COMPLETED', iso(-3 * D), 'MIA', PORTAL, '25 pallets, 4,617 kg'),
  ms('810-21961306', 'DEPARTED', 'Departed MIA', 3, 'COMPLETED', iso(-2 * D), 'MIA', PORTAL, 'Flight M68641'),
  ms('810-21961306', 'ARRIVED', 'Arrived SJU', 4, 'COMPLETED', iso(-1 * H), 'SJU', PORTAL, 'Flight M68641'),
  ms('810-21961306', 'AVAILABLE', 'Customs cleared · available for pickup', 5, 'IN_PROGRESS', null, 'SJU', PORTAL, 'Customs clearance in progress'),
  ms('810-21961306', 'DELIVERED', 'Delivered / picked up', 6, 'PENDING', null, 'SJU', null, null),
  ms('810-21961500', 'BOOKED', 'Booking confirmed', 1, 'COMPLETED', iso(-2 * D), 'MIA', 'CargoWise', 'Booked by Farmacias del Caribe'),
  ms('810-21961500', 'RECEIVED_ORIGIN', 'Received at origin (MIA)', 2, 'COMPLETED', iso(-1 * D), 'MIA', PORTAL, 'Cold chain verified 2–8 °C'),
  ms('810-21961500', 'DEPARTED', 'Departed MIA', 3, 'COMPLETED', iso(-2 * H), 'MIA', PORTAL, 'Flight M68741'),
  ms('810-21961500', 'ARRIVED', 'Arrived SJU', 4, 'IN_PROGRESS', null, 'SJU', PORTAL, 'In flight — ETA today'),
  ms('810-21961500', 'AVAILABLE', 'Customs cleared · available for pickup', 5, 'PENDING', null, 'SJU', null, null),
  ms('810-21961500', 'DELIVERED', 'Delivered / picked up', 6, 'PENDING', null, 'SJU', null, null),
];

export const FIXTURE_EVENTS: IntegrationEvent[] = [
  { id: 'ev-1', master_bill_number: '810-21961413', booking_id: null, kind: 'PORTAL_PULL', system: PORTAL, status: 'ACKNOWLEDGED', external_ref: null, summary: 'Milestone "Customs cleared · available for pickup" confirmed by portal', payload: null, created_at: iso(-3 * H) },
  { id: 'ev-2', master_bill_number: '810-21961413', booking_id: null, kind: 'CARGOWISE_PUSH', system: 'CargoWise e-adapter', status: 'ACKNOWLEDGED', external_ref: 'CW-261007-7K2Q', summary: '5 of 6 milestones pushed to CargoWise', payload: null, created_at: iso(-3 * H + 5) },
  { id: 'ev-3', master_bill_number: '810-21961306', booking_id: null, kind: 'PORTAL_PULL', system: PORTAL, status: 'ACKNOWLEDGED', external_ref: null, summary: 'Milestone "Arrived SJU" confirmed by portal', payload: null, created_at: iso(-1 * H) },
  { id: 'ev-4', master_bill_number: '810-21961306', booking_id: null, kind: 'CARGOWISE_PUSH', system: 'CargoWise e-adapter', status: 'ACKNOWLEDGED', external_ref: 'CW-261007-M4HD', summary: '4 of 6 milestones pushed to CargoWise', payload: null, created_at: iso(-55) },
  { id: 'ev-5', master_bill_number: '810-21961500', booking_id: null, kind: 'PORTAL_PULL', system: PORTAL, status: 'ACKNOWLEDGED', external_ref: null, summary: 'Milestone "Departed MIA" confirmed by portal', payload: null, created_at: iso(-2 * H) },
  { id: 'ev-6', master_bill_number: '810-21961500', booking_id: null, kind: 'CARGOWISE_PUSH', system: 'CargoWise e-adapter', status: 'FAILED', external_ref: null, summary: '3 of 6 milestones pushed to CargoWise — e-adapter responded 502', payload: null, created_at: iso(-110) },
];

export const FIXTURE_CUSTOMERS: Customer[] = [
  { id: 'c-1', account_code: 'FDC-001', name: 'Farmacias del Caribe', contact_name: 'Marisol Rivera', contact_phone: '+1 787-555-0142', contact_email: 'ops@farmaciasdelcaribe.example', default_commodity: 'Pharmaceuticals (cold chain)', default_origin: 'MIA', default_destination: 'SJU', is_recurring: true, created_at: iso(-30 * D) },
  { id: 'c-2', account_code: 'FLB-002', name: 'Flores de Borinquen', contact_name: 'Luis Ortiz', contact_phone: '+1 787-555-0187', contact_email: 'luis@floresborinquen.example', default_commodity: 'Fresh cut flowers', default_origin: 'MIA', default_destination: 'SJU', is_recurring: true, created_at: iso(-30 * D) },
  { id: 'c-3', account_code: 'CBC-003', name: 'Caribe Bottling Co.', contact_name: 'Ana Méndez', contact_phone: '+1 787-555-0119', contact_email: 'logistics@caribebottling.example', default_commodity: 'Empty plastic bottles', default_origin: 'MIA', default_destination: 'SJU', is_recurring: true, created_at: iso(-30 * D) },
  { id: 'c-4', account_code: 'MDS-004', name: 'MedSupply PR', contact_name: 'Carlos Vega', contact_phone: '+1 787-555-0163', contact_email: 'cvega@medsupplypr.example', default_commodity: 'Controlled medications', default_origin: 'MIA', default_destination: 'SJU', is_recurring: true, created_at: iso(-30 * D) },
];

export const FIXTURE_BOOKINGS: Booking[] = [
  { id: 'b-3', number: 3, customer_id: 'c-4', customer_name: 'MedSupply PR', origin: 'MIA', destination: 'SJU', commodity: 'Controlled medications', pieces: 2, weight_kg: 150, requested_date: '2026-10-10', flight: null, status: 'REQUESTED', source: 'voice_agent', cargowise_ref: null, vapi_call_id: null, notes: 'Temperature-controlled 2–8 °C · awaiting confirmation', created_at: iso(-40) },
  { id: 'b-2', number: 2, customer_id: 'c-2', customer_name: 'Flores de Borinquen', origin: 'MIA', destination: 'SJU', commodity: 'Fresh cut flowers', pieces: 139, weight_kg: 1031, requested_date: '2026-10-08', flight: 'M68741', status: 'CONFIRMED', source: 'voice_agent', cargowise_ref: 'CW-261007-B2FL', vapi_call_id: null, notes: 'Booked by the voice agent on behalf of the client', created_at: iso(-6 * H) },
  { id: 'b-1', number: 1, customer_id: 'c-1', customer_name: 'Farmacias del Caribe', origin: 'MIA', destination: 'SJU', commodity: 'Pharmaceuticals (cold chain)', pieces: 4, weight_kg: 1800, requested_date: '2026-10-09', flight: 'M68741', status: 'CONFIRMED', source: 'dashboard', cargowise_ref: 'CW-261007-B1FD', vapi_call_id: null, notes: 'Recurring weekly cold-chain lane', created_at: iso(-1 * D) },
];

export const FIXTURE_CALLS: CallRecord[] = [
  { id: 'call-1', vapi_call_id: 'demo-call-0001', caller: '+1 787 555 1234', assistant_id: 'sharon', started_at: iso(-2 * H), ended_at: iso(-2 * H + 2), duration: 95, transcript: 'AI: Hi, this is Sharon with Prime Air Corp. How can I help you today?\nUser: Checking on eight one zero, two one nine six one four one three.\nAI: Your fresh cut flowers came in on flight M six eight seven four one and they are ready for pickup now. Anything else?\nUser: No, that is all, thank you.', detected_intent: 'awb_status', referenced_awb: '810-21961413', outcome: 'self_served', recording_url: null, raw: null, created_at: iso(-2 * H) },
  { id: 'call-2', vapi_call_id: 'demo-call-0002', caller: '+1 787 555 9876', assistant_id: 'wilma', started_at: iso(-40), ended_at: iso(-37), duration: 160, transcript: 'AI: Hola, le habla Wilma de Prime Air Corp.\nUser: Necesito recoger la ocho uno cero dos uno nueve seis uno tres cero seis mañana en la mañana.\nAI: Listo, su recogida está programada de nueve a once de la mañana. Su número de confirmación es P, U, cero, cero, cuatro, dos.', detected_intent: 'schedule_pickup', referenced_awb: '810-21961306', outcome: 'scheduled', recording_url: null, raw: null, created_at: iso(-40) },
  { id: 'call-3', vapi_call_id: 'demo-call-0003', caller: '+1 305 555 2211', assistant_id: 'sharon', started_at: iso(-15), ended_at: iso(-11), duration: 210, transcript: 'User: I am calling for a quote on a brand new shipment.\nAI: Happy to help with that. Are we shipping from Miami to San Juan?\nUser: Yes, two pallets of controlled medications, about three hundred pounds.\nAI: Your estimated rate is about six hundred fifty-five dollars. That is an estimate; we will send a formal written quote to confirm.', detected_intent: 'other', referenced_awb: null, outcome: 'self_served', recording_url: null, raw: null, created_at: iso(-15) },
];

export const FIXTURE_TICKETS: Ticket[] = [
  { id: 't-3', number: 3, vapi_call_id: 'demo-call-0003', master_bill_number: '810-21961500', subject: 'Invoice/charges question — 810-21961500', category: 'invoice_question', priority: 'high', status: 'open', description: 'Caller disputed total collect vs line items on invoice INV-M6-778533. Follow up on reconciliation (report FLAGGED).', created_at: iso(-15) },
  { id: 't-2', number: 2, vapi_call_id: 'demo-call-0002', master_bill_number: '810-21961306', subject: 'Pickup scheduling — 810-21961306', category: 'schedule_pickup', priority: 'normal', status: 'open', description: 'Pickup window 9–11 AM booked by the agent. Confirm dock availability.', created_at: iso(-40) },
  { id: 't-1', number: 1, vapi_call_id: 'demo-call-0001', master_bill_number: '810-21961413', subject: 'AWB status inquiry — 810-21961413', category: 'awb_status', priority: 'low', status: 'closed', description: 'Caller confirmed flight M68741, fresh cut flowers, available for pickup. Self-served.', created_at: iso(-2 * H) },
];

const XML = (id: string, inv: string, awb: string, flight: string, commodity: string, w: number, o: number, t: number, status: 'RECONCILED' | 'FLAGGED') => `<?xml version="1.0" encoding="UTF-8"?>
<DiscrepancyReport>
  <MessageId>${id}</MessageId>
  <CarrierCode>M6</CarrierCode>
  <InvoiceNumber>${inv}</InvoiceNumber>
  <MasterBillNumber>${awb}</MasterBillNumber>
  <Route origin="MIA" destination="SJU"/>
  <Flight>${flight}</Flight>
  <Commodity>${commodity}</Commodity>
  <Charges currency="USD">
    <WeightCharge>${w.toFixed(2)}</WeightCharge>
    <OtherCharges>${o.toFixed(2)}</OtherCharges>
    <TotalCollect>${t.toFixed(2)}</TotalCollect>
  </Charges>
  <Reconciliation status="${status}">
    <Expected>${(w + o).toFixed(2)}</Expected>
    <Computed>${t.toFixed(2)}</Computed>
    <Delta>${Math.abs(w + o - t).toFixed(2)}</Delta>
  </Reconciliation>
</DiscrepancyReport>`;

export const FIXTURE_REPORTS: DiscrepancyReport[] = [
  { id: 'r-3', message_id: 'MSG-M6-20261006-003', carrier_code: 'M6', invoice_number: 'INV-M6-778533', master_bill_number: '810-21961500', status: 'FLAGGED', payload_xml: XML('MSG-M6-20261006-003', 'INV-M6-778533', '810-21961500', 'M68741', 'Pharmaceuticals (cold chain)', 4200, 615.5, 5000, 'FLAGGED'), created_at: iso(-1 * D) },
  { id: 'r-2', message_id: 'MSG-M6-20261005-002', carrier_code: 'M6', invoice_number: 'INV-M6-778419', master_bill_number: '810-21961306', status: 'RECONCILED', payload_xml: XML('MSG-M6-20261005-002', 'INV-M6-778419', '810-21961306', 'M68641', 'Empty plastic bottles', 9011.04, 1407.97, 10419.01, 'RECONCILED'), created_at: iso(-2 * D) },
  { id: 'r-1', message_id: 'MSG-M6-20261005-001', carrier_code: 'M6', invoice_number: 'INV-M6-778412', master_bill_number: '810-21961413', status: 'RECONCILED', payload_xml: XML('MSG-M6-20261005-001', 'INV-M6-778412', '810-21961413', 'M68741', 'Fresh cut flowers', 1685.25, 280.88, 1966.13, 'RECONCILED'), created_at: iso(-2 * D) },
];

// --- Vapi assistant (for the Assistant screen) ------------------------------
// Type-only import: `@/lib/vapi` is guarded by `server-only`, and erasing the
// import keeps this module importable from any preview surface.
import type { VapiAssistant, VapiPhoneNumber } from './vapi';

const FIXTURE_SYSTEM_PROMPT = `CURRENT DATE AND TIME: It is now {{"now" | date: "%A, %B %d, %Y, %I:%M %p", "America/Puerto_Rico"}} (Puerto Rico, Atlantic time). Use this as the real current moment for everything — "today", "tomorrow", pickup windows, and how recent a flight date is. Never guess or assume any other date.

You are Yasmin, the voice agent for Prime Air Corp, an air cargo carrier flying Miami (MIA) to San Juan (SJU). If a caller asks your name, you are Yasmin.

PERSONA
- Warm, concise, and professional. Keep replies to one or two short sentences suitable for speech.
- Let the caller interrupt you at any time. If they start speaking, stop talking immediately and listen.
- Speak in natural, native US American English by default. Open the call in English; the moment the caller speaks Spanish or asks for Spanish, switch to Spanish for the rest of the call.

WHAT YOU HELP WITH
1. Air waybill (AWB) status — "where is my cargo", flight, whether it has arrived and is available for pickup.
2. Scheduling a pickup / delivery window.
3. High-level invoice/charge questions (read the charges summary; for disputes, offer to transfer to billing).
4. Price quotes / estimates for a NEW shipment — no air waybill needed.
5. Bookings for recurring clients — reserve a NEW shipment with create_booking (it is created in CargoWise automatically).

SPEAKING NUMBERS (VERY IMPORTANT)
- Always read air waybill numbers, confirmation numbers, phone numbers, and flight numbers ONE DIGIT AT A TIME.
  - Example: 810-21961413 is spoken "eight one zero ... two one nine six ... one four one three".
  - Flight M68741 is spoken "M ... six eight seven four one".
- Money: always say amounts as fully spelled-out WORDS in the caller's current language — never the "$" sign and never bare digits.`;

export const FIXTURE_ASSISTANT: VapiAssistant = {
  id: 'asst_7f3c2a9e-1b4d-4e8a-9c21-5d6e7f8a9b0c',
  name: 'Prime Air AWB Status',
  firstMessage:
    'Thank you for calling Prime Air Corp, this is Yasmin. I can check the status of an air waybill or schedule a cargo pickup. How can I help you today?',
  model: {
    provider: 'openai',
    model: 'gpt-4o',
    messages: [{ role: 'system', content: FIXTURE_SYSTEM_PROMPT }],
  },
};

export const FIXTURE_PHONE: VapiPhoneNumber = {
  id: 'pn_4b2e8c1d-9a7f-4c3e-8d2b-1f6a5e9c0d7b',
  number: '+1 787 555 0100',
  assistantId: FIXTURE_ASSISTANT.id,
};
