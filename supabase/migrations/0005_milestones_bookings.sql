-- ===========================================================================
-- Milestone tracking + CargoWise integration log + recurring-client bookings
--
-- Milestone tracking: a flight or air waybill is looked up on the carrier's
-- cargo portal, each milestone (booked -> received -> departed -> arrived ->
-- available -> delivered) is recorded, and the data is pushed into CargoWise
-- through the e-adapter REST integration. Bookings let recurring clients
-- (or the voice agent on their behalf) create a shipment booking in-system.
--
-- Note: milestones and integration events are keyed by master_bill_number
-- (indexed) rather than a foreign key to air_waybills. That lets a shipment be
-- tracked or pushed before its AWB row is loaded, and avoids taking a lock on
-- the hot air_waybills table during migration.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- shipment_milestones : one row per (AWB, milestone step).
-- ---------------------------------------------------------------------------
create table if not exists public.shipment_milestones (
  id                  uuid primary key default gen_random_uuid(),
  master_bill_number  text not null,
  -- BOOKED | RECEIVED_ORIGIN | DEPARTED | ARRIVED | AVAILABLE | DELIVERED
  code                text not null,
  label               text not null,
  sequence            integer not null,
  status              text not null default 'PENDING'
                      check (status in ('COMPLETED', 'IN_PROGRESS', 'PENDING')),
  occurred_at         timestamptz,
  location            text,                  -- MIA | SJU
  source              text,                  -- e.g. 'Amerijet cargo portal', 'CargoWise'
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (master_bill_number, code)
);

create index if not exists shipment_milestones_awb_seq_idx
  on public.shipment_milestones (master_bill_number, sequence);

drop trigger if exists shipment_milestones_set_updated_at on public.shipment_milestones;
create trigger shipment_milestones_set_updated_at
  before update on public.shipment_milestones
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- integration_events : audit log of portal pulls and CargoWise e-adapter pushes.
-- ---------------------------------------------------------------------------
create table if not exists public.integration_events (
  id                  uuid primary key default gen_random_uuid(),
  master_bill_number  text,
  booking_id          uuid,                  -- set when the push was for a booking
  kind                text not null check (kind in ('PORTAL_PULL', 'CARGOWISE_PUSH')),
  system              text not null,         -- 'Amerijet cargo portal' | 'CargoWise e-adapter'
  status              text not null default 'SENT'
                      check (status in ('SENT', 'ACKNOWLEDGED', 'FAILED')),
  external_ref        text,                  -- reference returned by CargoWise
  summary             text,
  payload             jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists integration_events_awb_created_idx
  on public.integration_events (master_bill_number, created_at desc);
create index if not exists integration_events_kind_created_idx
  on public.integration_events (kind, created_at desc);

-- ---------------------------------------------------------------------------
-- customers : recurring / fixed clients who book with Prime Air regularly.
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id                   uuid primary key default gen_random_uuid(),
  account_code         text not null unique,
  name                 text not null,
  contact_name         text,
  contact_phone        text,
  contact_email        text,
  default_commodity    text,
  default_origin       text not null default 'MIA',
  default_destination  text not null default 'SJU',
  is_recurring         boolean not null default true,
  created_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- bookings : shipment bookings created from the dashboard or by the voice agent.
--   Displayed as BK-0001 (number is an identity column).
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  number          integer generated always as identity,
  customer_id     uuid references public.customers (id),
  customer_name   text not null,
  origin          text not null default 'MIA',
  destination     text not null default 'SJU',
  commodity       text,
  pieces          integer,
  weight_kg       numeric(12,2),
  requested_date  date,
  flight          text,
  status          text not null default 'CONFIRMED'
                  check (status in ('REQUESTED', 'CONFIRMED', 'CANCELLED')),
  source          text not null default 'dashboard',   -- dashboard | voice_agent
  cargowise_ref   text,
  vapi_call_id    text,
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists bookings_created_idx on public.bookings (created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security — staff read everything; privileged writes go through
-- server routes with the service-role key.
-- ---------------------------------------------------------------------------
alter table public.shipment_milestones enable row level security;
alter table public.integration_events  enable row level security;
alter table public.customers           enable row level security;
alter table public.bookings            enable row level security;

do $$
begin
  create policy "auth read shipment_milestones" on public.shipment_milestones
    for select to authenticated using (true);
  create policy "auth read integration_events"  on public.integration_events
    for select to authenticated using (true);
  create policy "auth read customers"           on public.customers
    for select to authenticated using (true);
  create policy "auth read bookings"            on public.bookings
    for select to authenticated using (true);
exception
  when duplicate_object then null;
end
$$;
