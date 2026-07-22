-- ===========================================================================
-- Prime Air Corp — demo seed data
-- Idempotent: safe to run repeatedly (upserts on natural keys).
-- ===========================================================================

-- --- air_waybills ----------------------------------------------------------
-- Two real records from the invoice reconciliation flow (both reconcile) plus
-- one synthetic AWB that FAILS reconciliation, to demo the FLAGGED badge.
insert into public.air_waybills
  (master_bill_number, carrier_code, flight, origin, destination, commodity,
   weight_charge, other_charges, total_collect, status, cargo_ready_at)
values
  ('810-21961413', 'M6', 'M68741', 'MIA', 'SJU', 'Fresh cut flowers',
   1685.25, 280.88, 1966.13, 'AVAILABLE', now() - interval '3 hours'),
  ('810-21961306', 'M6', 'M68641', 'MIA', 'SJU', 'Empty plastic bottles',
   9011.04, 1407.97, 10419.01, 'ARRIVED', now() - interval '1 hour'),
  ('810-21961500', 'M6', 'M68741', 'MIA', 'SJU', 'Pharmaceuticals (cold chain)',
   4200.00, 615.50, 5000.00, 'IN_TRANSIT', null)  -- 4200+615.50 = 4815.50 != 5000 -> FLAGGED
on conflict (master_bill_number) do update set
  carrier_code   = excluded.carrier_code,
  flight         = excluded.flight,
  origin         = excluded.origin,
  destination    = excluded.destination,
  commodity      = excluded.commodity,
  weight_charge  = excluded.weight_charge,
  other_charges  = excluded.other_charges,
  total_collect  = excluded.total_collect,
  status         = excluded.status,
  cargo_ready_at = excluded.cargo_ready_at;

-- --- discrepancy_reports ---------------------------------------------------
insert into public.discrepancy_reports
  (message_id, carrier_code, invoice_number, master_bill_number, status, payload_xml)
values
  ('MSG-M6-20260721-001', 'M6', 'INV-M6-778412', '810-21961413', 'RECONCILED',
$xml$<?xml version="1.0" encoding="UTF-8"?>
<DiscrepancyReport>
  <MessageId>MSG-M6-20260721-001</MessageId>
  <CarrierCode>M6</CarrierCode>
  <InvoiceNumber>INV-M6-778412</InvoiceNumber>
  <MasterBillNumber>810-21961413</MasterBillNumber>
  <Route origin="MIA" destination="SJU"/>
  <Flight>M68741</Flight>
  <Commodity>Fresh cut flowers</Commodity>
  <Charges currency="USD">
    <WeightCharge>1685.25</WeightCharge>
    <OtherCharges>280.88</OtherCharges>
    <TotalCollect>1966.13</TotalCollect>
  </Charges>
  <Reconciliation status="RECONCILED">
    <Expected>1966.13</Expected>
    <Computed>1966.13</Computed>
    <Delta>0.00</Delta>
  </Reconciliation>
</DiscrepancyReport>$xml$),

  ('MSG-M6-20260721-002', 'M6', 'INV-M6-778419', '810-21961306', 'RECONCILED',
$xml$<?xml version="1.0" encoding="UTF-8"?>
<DiscrepancyReport>
  <MessageId>MSG-M6-20260721-002</MessageId>
  <CarrierCode>M6</CarrierCode>
  <InvoiceNumber>INV-M6-778419</InvoiceNumber>
  <MasterBillNumber>810-21961306</MasterBillNumber>
  <Route origin="MIA" destination="SJU"/>
  <Flight>M68641</Flight>
  <Commodity>Empty plastic bottles</Commodity>
  <Charges currency="USD">
    <WeightCharge>9011.04</WeightCharge>
    <OtherCharges>1407.97</OtherCharges>
    <TotalCollect>10419.01</TotalCollect>
  </Charges>
  <Reconciliation status="RECONCILED">
    <Expected>10419.01</Expected>
    <Computed>10419.01</Computed>
    <Delta>0.00</Delta>
  </Reconciliation>
</DiscrepancyReport>$xml$),

  ('MSG-M6-20260722-003', 'M6', 'INV-M6-778533', '810-21961500', 'FLAGGED',
$xml$<?xml version="1.0" encoding="UTF-8"?>
<DiscrepancyReport>
  <MessageId>MSG-M6-20260722-003</MessageId>
  <CarrierCode>M6</CarrierCode>
  <InvoiceNumber>INV-M6-778533</InvoiceNumber>
  <MasterBillNumber>810-21961500</MasterBillNumber>
  <Route origin="MIA" destination="SJU"/>
  <Flight>M68741</Flight>
  <Commodity>Pharmaceuticals (cold chain)</Commodity>
  <Charges currency="USD">
    <WeightCharge>4200.00</WeightCharge>
    <OtherCharges>615.50</OtherCharges>
    <TotalCollect>5000.00</TotalCollect>
  </Charges>
  <Reconciliation status="FLAGGED">
    <Expected>4815.50</Expected>
    <Computed>5000.00</Computed>
    <Delta>184.50</Delta>
    <Reason>weight_charge + other_charges != total_collect</Reason>
  </Reconciliation>
</DiscrepancyReport>$xml$)
on conflict (message_id) do update set
  carrier_code       = excluded.carrier_code,
  invoice_number     = excluded.invoice_number,
  master_bill_number = excluded.master_bill_number,
  status             = excluded.status,
  payload_xml        = excluded.payload_xml;

-- --- calls (demo, timestamped "today" so KPIs render) ----------------------
insert into public.calls
  (vapi_call_id, caller, assistant_id, started_at, ended_at, duration,
   detected_intent, referenced_awb, outcome, transcript)
values
  ('demo-call-0001', '+17875551234', 'demo-assistant', now() - interval '2 hours',
   now() - interval '2 hours' + interval '95 seconds', 95,
   'awb_status', '810-21961413', 'self_served',
   'Assistant: Thanks for calling Prime Air. I can check air waybill status or schedule a pickup. How can I help?
Caller: Hi, checking on eight one zero, two one nine six one four one three.
Assistant: That is flight M68741 from Miami to San Juan, fresh cut flowers. It has arrived and is available for pickup. Anything else?
Caller: No, that is all, thank you.'),
  ('demo-call-0002', '+17875559876', 'demo-assistant', now() - interval '40 minutes',
   now() - interval '40 minutes' + interval '160 seconds', 160,
   'schedule_pickup', '810-21961306', 'scheduled',
   'Assistant: Prime Air, how can I help? / Caller: I need to pick up 810-21961306 tomorrow morning. / Assistant: I have scheduled a pickup window for tomorrow 9 to 11 AM. You are all set.'),
  ('demo-call-0003', '+13055552211', 'demo-assistant', now() - interval '15 minutes',
   now() - interval '15 minutes' + interval '210 seconds', 210,
   'invoice_question', '810-21961500', 'transferred',
   'Caller asked why the total collect did not match line items on invoice INV-M6-778533. Assistant explained charges and transferred to billing.')
on conflict (vapi_call_id) do nothing;

-- --- pickups (demo) --------------------------------------------------------
insert into public.pickups
  (master_bill_number, window_start, window_end, contact, status, source, vapi_call_id)
values
  ('810-21961306', (now() + interval '1 day')::date + time '09:00',
   (now() + interval '1 day')::date + time '11:00',
   '+17875559876', 'SCHEDULED', 'voice_agent', 'demo-call-0002')
on conflict do nothing;

-- --- tickets (demo; auto-created per call in production) --------------------
insert into public.tickets
  (vapi_call_id, master_bill_number, subject, category, priority, status, description)
values
  ('demo-call-0001', '810-21961413', 'AWB status inquiry — 810-21961413', 'awb_status', 'low', 'closed',
   'Caller confirmed flight M68741 (MIA->SJU), fresh cut flowers, arrived and available for pickup. Self-served.'),
  ('demo-call-0002', '810-21961306', 'Pickup scheduling — 810-21961306', 'schedule_pickup', 'normal', 'open',
   'Caller requested pickup for tomorrow morning; window 9-11 AM booked by the agent. Confirm dock availability.'),
  ('demo-call-0003', '810-21961500', 'Invoice/charges question — 810-21961500', 'invoice_question', 'high', 'open',
   'Caller disputed total collect vs line items on invoice INV-M6-778533. Transferred to billing; follow up on reconciliation (report FLAGGED).')
on conflict (vapi_call_id) do nothing;
