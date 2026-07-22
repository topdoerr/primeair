-- ===========================================================================
-- Prime Air Corp — cargo dashboard schema
-- MIA -> SJU air cargo. Voice agent (Vapi) + call/discrepancy visibility.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- air_waybills : one row per master air waybill (AWB) we handle.
--   master_bill_number format: 810-XXXXXXXX (Amerijet / M6 prefix 810).
-- ---------------------------------------------------------------------------
create table if not exists public.air_waybills (
  id                  uuid primary key default gen_random_uuid(),
  master_bill_number  text not null unique
                      check (master_bill_number ~ '^810-[0-9]{8}$'),
  carrier_code        text not null default 'M6',
  flight              text,
  origin              text not null default 'MIA',
  destination         text not null default 'SJU',
  commodity           text,
  weight_charge       numeric(12,2) not null default 0,
  other_charges       numeric(12,2) not null default 0,
  total_collect       numeric(12,2) not null default 0,
  -- IN_TRANSIT | ARRIVED | AVAILABLE | PICKED_UP
  status              text not null default 'IN_TRANSIT',
  cargo_ready_at      timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists air_waybills_status_idx on public.air_waybills (status);

-- ---------------------------------------------------------------------------
-- calls : synced from Vapi (webhook + manual "Sync calls").
-- ---------------------------------------------------------------------------
create table if not exists public.calls (
  id               uuid primary key default gen_random_uuid(),
  vapi_call_id     text not null unique,
  caller           text,
  assistant_id     text,
  started_at       timestamptz,
  ended_at         timestamptz,
  duration         integer,               -- seconds
  transcript       text,
  detected_intent  text,                  -- awb_status | schedule_pickup | invoice_question | other
  referenced_awb   text,                  -- master_bill_number mentioned in the call
  outcome          text,                  -- self_served | transferred | scheduled | abandoned
  raw              jsonb,                 -- full Vapi payload for auditing
  created_at       timestamptz not null default now()
);

create index if not exists calls_started_at_idx on public.calls (started_at desc);
create index if not exists calls_referenced_awb_idx on public.calls (referenced_awb);

-- ---------------------------------------------------------------------------
-- pickups : delivery/pickup windows created by the scheduling tool or the UI.
--   Pilot scope: Supabase-only, no external calendar sync.
-- ---------------------------------------------------------------------------
create table if not exists public.pickups (
  id                  uuid primary key default gen_random_uuid(),
  master_bill_number  text not null references public.air_waybills (master_bill_number),
  window_start        timestamptz not null,
  window_end          timestamptz not null,
  contact             text,
  status              text not null default 'SCHEDULED', -- SCHEDULED | COMPLETED | CANCELLED
  source              text not null default 'voice_agent', -- voice_agent | dashboard
  vapi_call_id        text,
  created_at          timestamptz not null default now(),
  check (window_end > window_start)
);

create index if not exists pickups_awb_idx on public.pickups (master_bill_number);

-- ---------------------------------------------------------------------------
-- discrepancy_reports : output of the invoice reconciliation flow.
--   status is FLAGGED when weight_charge + other_charges != total_collect.
-- ---------------------------------------------------------------------------
create table if not exists public.discrepancy_reports (
  id              uuid primary key default gen_random_uuid(),
  message_id      text not null unique,
  carrier_code    text not null default 'M6',
  invoice_number  text,
  master_bill_number text,
  payload_xml     text not null,
  status          text not null default 'RECONCILED'
                  check (status in ('RECONCILED', 'FLAGGED')),
  created_at      timestamptz not null default now()
);

create index if not exists discrepancy_reports_status_idx on public.discrepancy_reports (status);

-- ---------------------------------------------------------------------------
-- updated_at trigger for air_waybills
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists air_waybills_set_updated_at on public.air_waybills;
create trigger air_waybills_set_updated_at
  before update on public.air_waybills
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--   The dashboard is an internal tool. Signed-in (authenticated) staff can
--   read everything and create pickups from the UI. All privileged writes
--   (call sync, awb lookup side effects, report ingestion) go through server
--   routes using the service-role key, which bypasses RLS.
-- ---------------------------------------------------------------------------
alter table public.air_waybills       enable row level security;
alter table public.calls              enable row level security;
alter table public.pickups            enable row level security;
alter table public.discrepancy_reports enable row level security;

do $$
begin
  -- read policies for authenticated staff
  create policy "auth read air_waybills"        on public.air_waybills
    for select to authenticated using (true);
  create policy "auth read calls"               on public.calls
    for select to authenticated using (true);
  create policy "auth read pickups"             on public.pickups
    for select to authenticated using (true);
  create policy "auth read discrepancy_reports" on public.discrepancy_reports
    for select to authenticated using (true);

  -- staff can schedule pickups from the dashboard
  create policy "auth insert pickups"           on public.pickups
    for insert to authenticated with check (true);
exception
  when duplicate_object then null;
end
$$;
