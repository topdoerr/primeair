-- New-shipment price quotes captured by the voice agents' quote_shipment tool.
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  created_at timestamptz not null default now(),
  origin text,
  destination text,
  ready_date text,
  commodity text,
  pieces integer,
  length_cm numeric,
  width_cm numeric,
  height_cm numeric,
  dimension_unit text,
  actual_weight_kg numeric,
  weight_unit text,
  dangerous_goods boolean default false,
  temperature_controlled boolean default false,
  temperature_range text,
  temperature_unit text,
  volumetric_weight_kg numeric,
  chargeable_weight_kg numeric,
  weight_charge numeric,
  fuel_handling numeric,
  dangerous_goods_fee numeric,
  temperature_fee numeric,
  estimated_total numeric,
  currency text default 'USD',
  raw_arguments jsonb
);

alter table public.quote_requests enable row level security;

create policy "quote_requests_read_authenticated"
  on public.quote_requests for select
  to authenticated
  using (true);
