-- ===========================================================================
-- Demo seed: milestones, integration events, recurring customers, bookings.
-- Idempotent — safe to run repeatedly. Run after seed.sql (needs the AWBs).
-- ===========================================================================

-- Make sure the three demo AWBs exist (same rows as seed.sql).
insert into public.air_waybills
  (master_bill_number, carrier_code, flight, origin, destination, commodity,
   weight_charge, other_charges, total_collect, status, cargo_ready_at)
values
  ('810-21961413', 'M6', 'M68741', 'MIA', 'SJU', 'Fresh cut flowers',
   1685.25, 280.88, 1966.13, 'AVAILABLE', now() - interval '3 hours'),
  ('810-21961306', 'M6', 'M68641', 'MIA', 'SJU', 'Empty plastic bottles',
   9011.04, 1407.97, 10419.01, 'ARRIVED', now() - interval '1 hour'),
  ('810-21961500', 'M6', 'M68741', 'MIA', 'SJU', 'Pharmaceuticals (cold chain)',
   4200.00, 615.50, 5000.00, 'IN_TRANSIT', null)
on conflict (master_bill_number) do nothing;

-- --- shipment_milestones ---------------------------------------------------
insert into public.shipment_milestones
  (master_bill_number, code, label, sequence, status, occurred_at, location, source, notes)
values
  -- 810-21961413 : fresh cut flowers — arrived, cleared, available for pickup
  ('810-21961413', 'BOOKED',          'Booking confirmed',                        1, 'COMPLETED', now() - interval '5 days',             'MIA', 'CargoWise',            'Booked by Flores de Borinquen'),
  ('810-21961413', 'RECEIVED_ORIGIN', 'Received at origin (MIA)',                 2, 'COMPLETED', now() - interval '4 days',             'MIA', 'Amerijet cargo portal', '139 pieces, 1,031 kg · keep in cooler'),
  ('810-21961413', 'DEPARTED',        'Departed MIA',                             3, 'COMPLETED', now() - interval '3 days',             'MIA', 'Amerijet cargo portal', 'Flight M68741'),
  ('810-21961413', 'ARRIVED',         'Arrived SJU',                              4, 'COMPLETED', now() - interval '3 days' + interval '4 hours', 'SJU', 'Amerijet cargo portal', 'Flight M68741'),
  ('810-21961413', 'AVAILABLE',       'Customs cleared · available for pickup',   5, 'COMPLETED', now() - interval '3 hours',            'SJU', 'Amerijet cargo portal', null),
  ('810-21961413', 'DELIVERED',       'Delivered / picked up',                    6, 'PENDING',   null,                                  'SJU', null,                    null),

  -- 810-21961306 : empty plastic bottles — arrived, customs clearance in progress
  ('810-21961306', 'BOOKED',          'Booking confirmed',                        1, 'COMPLETED', now() - interval '4 days',             'MIA', 'CargoWise',            'Booked by Caribe Bottling Co.'),
  ('810-21961306', 'RECEIVED_ORIGIN', 'Received at origin (MIA)',                 2, 'COMPLETED', now() - interval '3 days',             'MIA', 'Amerijet cargo portal', '25 pallets, 4,617 kg'),
  ('810-21961306', 'DEPARTED',        'Departed MIA',                             3, 'COMPLETED', now() - interval '2 days',             'MIA', 'Amerijet cargo portal', 'Flight M68641'),
  ('810-21961306', 'ARRIVED',         'Arrived SJU',                              4, 'COMPLETED', now() - interval '1 hour',             'SJU', 'Amerijet cargo portal', 'Flight M68641'),
  ('810-21961306', 'AVAILABLE',       'Customs cleared · available for pickup',   5, 'IN_PROGRESS', null,                                'SJU', 'Amerijet cargo portal', 'Customs clearance in progress'),
  ('810-21961306', 'DELIVERED',       'Delivered / picked up',                    6, 'PENDING',   null,                                  'SJU', null,                    null),

  -- 810-21961500 : pharmaceuticals (cold chain) — in the air
  ('810-21961500', 'BOOKED',          'Booking confirmed',                        1, 'COMPLETED', now() - interval '2 days',             'MIA', 'CargoWise',            'Booked by Farmacias del Caribe'),
  ('810-21961500', 'RECEIVED_ORIGIN', 'Received at origin (MIA)',                 2, 'COMPLETED', now() - interval '1 day',              'MIA', 'Amerijet cargo portal', 'Cold chain verified 2–8 °C'),
  ('810-21961500', 'DEPARTED',        'Departed MIA',                             3, 'COMPLETED', now() - interval '2 hours',            'MIA', 'Amerijet cargo portal', 'Flight M68741'),
  ('810-21961500', 'ARRIVED',         'Arrived SJU',                              4, 'IN_PROGRESS', null,                                'SJU', 'Amerijet cargo portal', 'In flight — ETA today'),
  ('810-21961500', 'AVAILABLE',       'Customs cleared · available for pickup',   5, 'PENDING',   null,                                  'SJU', null,                    null),
  ('810-21961500', 'DELIVERED',       'Delivered / picked up',                    6, 'PENDING',   null,                                  'SJU', null,                    null)
on conflict (master_bill_number, code) do update set
  label       = excluded.label,
  sequence    = excluded.sequence,
  status      = excluded.status,
  occurred_at = excluded.occurred_at,
  location    = excluded.location,
  source      = excluded.source,
  notes       = excluded.notes;

-- --- integration_events (portal pulls + CargoWise pushes) ------------------
insert into public.integration_events
  (master_bill_number, kind, system, status, external_ref, summary, payload, created_at)
select v.* from (values
  ('810-21961413', 'PORTAL_PULL',    'Amerijet cargo portal', 'ACKNOWLEDGED', null,
     'Milestone "Customs cleared · available for pickup" confirmed by portal',
     '{"flight":"M68741","milestone":"AVAILABLE"}'::jsonb, now() - interval '3 hours'),
  ('810-21961413', 'CARGOWISE_PUSH', 'CargoWise e-adapter',   'ACKNOWLEDGED', 'CW-260811-7K2Q',
     '5 of 6 milestones pushed to CargoWise',
     '{"masterBillNumber":"810-21961413","milestonesPushed":5}'::jsonb, now() - interval '2 hours 55 minutes'),
  ('810-21961306', 'PORTAL_PULL',    'Amerijet cargo portal', 'ACKNOWLEDGED', null,
     'Milestone "Arrived SJU" confirmed by portal',
     '{"flight":"M68641","milestone":"ARRIVED"}'::jsonb, now() - interval '1 hour'),
  ('810-21961306', 'CARGOWISE_PUSH', 'CargoWise e-adapter',   'ACKNOWLEDGED', 'CW-260811-M4HD',
     '4 of 6 milestones pushed to CargoWise',
     '{"masterBillNumber":"810-21961306","milestonesPushed":4}'::jsonb, now() - interval '55 minutes'),
  ('810-21961500', 'PORTAL_PULL',    'Amerijet cargo portal', 'ACKNOWLEDGED', null,
     'Milestone "Departed MIA" confirmed by portal',
     '{"flight":"M68741","milestone":"DEPARTED"}'::jsonb, now() - interval '2 hours'),
  ('810-21961500', 'CARGOWISE_PUSH', 'CargoWise e-adapter',   'ACKNOWLEDGED', 'CW-260811-Z9PA',
     '3 of 6 milestones pushed to CargoWise',
     '{"masterBillNumber":"810-21961500","milestonesPushed":3}'::jsonb, now() - interval '1 hour 50 minutes')
) as v(master_bill_number, kind, system, status, external_ref, summary, payload, created_at)
where not exists (
  select 1 from public.integration_events e
  where e.master_bill_number = v.master_bill_number
    and e.kind = v.kind
    and coalesce(e.external_ref, '') = coalesce(v.external_ref, '')
    and e.summary = v.summary
);

-- --- customers (recurring / fixed clients) ---------------------------------
insert into public.customers
  (account_code, name, contact_name, contact_phone, contact_email, default_commodity, is_recurring)
values
  ('FDC-001', 'Farmacias del Caribe',  'Marisol Rivera', '+1 787-555-0142', 'ops@farmaciasdelcaribe.example', 'Pharmaceuticals (cold chain)', true),
  ('FLB-002', 'Flores de Borinquen',   'Luis Ortiz',     '+1 787-555-0187', 'luis@floresborinquen.example',   'Fresh cut flowers',            true),
  ('CBC-003', 'Caribe Bottling Co.',   'Ana Méndez',     '+1 787-555-0119', 'logistics@caribebottling.example','Empty plastic bottles',        true),
  ('MDS-004', 'MedSupply PR',          'Carlos Vega',    '+1 787-555-0163', 'cvega@medsupplypr.example',      'Controlled medications',       true)
on conflict (account_code) do update set
  name              = excluded.name,
  contact_name      = excluded.contact_name,
  contact_phone     = excluded.contact_phone,
  contact_email     = excluded.contact_email,
  default_commodity = excluded.default_commodity,
  is_recurring      = excluded.is_recurring;

-- --- bookings --------------------------------------------------------------
insert into public.bookings
  (customer_id, customer_name, origin, destination, commodity, pieces, weight_kg,
   requested_date, flight, status, source, cargowise_ref, notes, created_at)
select c.id, v.customer_name, 'MIA', 'SJU', v.commodity, v.pieces, v.weight_kg,
       v.requested_date, v.flight, v.status, v.source, v.cargowise_ref, v.notes, v.created_at
from (values
  ('Farmacias del Caribe', 'Pharmaceuticals (cold chain)', 4,   1800.00, (now() + interval '2 days')::date, 'M68741', 'CONFIRMED', 'dashboard',   'CW-260811-B1FD', 'Recurring weekly cold-chain lane', now() - interval '1 day'),
  ('Flores de Borinquen',  'Fresh cut flowers',            139, 1031.00, (now() + interval '1 day')::date, 'M68741', 'CONFIRMED', 'voice_agent', 'CW-260811-B2FL', 'Booked by the voice agent on behalf of the client', now() - interval '6 hours'),
  ('MedSupply PR',         'Controlled medications',       2,   150.00,  (now() + interval '3 days')::date, null,     'REQUESTED', 'voice_agent', null,             'Temperature-controlled 2–8 °C · awaiting confirmation', now() - interval '40 minutes')
) as v(customer_name, commodity, pieces, weight_kg, requested_date, flight, status, source, cargowise_ref, notes, created_at)
left join public.customers c on c.name = v.customer_name
where not exists (
  select 1 from public.bookings b
  where b.customer_name = v.customer_name and b.commodity = v.commodity
);
