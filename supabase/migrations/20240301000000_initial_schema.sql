-- FindMyTesla — Initial Database Schema
-- Run via: supabase db push

-- ============================================================
-- Table: vehicles
-- A snapshot of Tesla's used inventory.
-- The VIN (Vehicle Identification Number) is unique per car.
-- Upserted on every scrape cycle by the fetch-inventory Edge Function.
-- ============================================================
create table if not exists public.vehicles (
  vin             text primary key,
  model           text not null,            -- 'm3', 'my', 'ms', 'mx', 'ct'
  year            integer not null,
  trim_name       text,                     -- e.g. 'Long Range AWD'
  price           integer not null,         -- USD, no decimal places
  mileage         integer,                  -- Odometer in miles
  color           text,                     -- Exterior paint code/name
  interior        text,                     -- Interior color name
  options         text[],                   -- Array of Tesla option codes
  location_city   text,
  location_state  text,
  zip_code        text,
  latitude        numeric(9,6),
  longitude       numeric(9,6),
  image_url       text,                     -- Primary compositor image URL
  detail_url      text,                     -- Link to Tesla.com listing
  is_available    boolean default true,     -- False when removed from API
  first_seen_at   timestamptz default now(),
  last_seen_at    timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_vehicles_model     on public.vehicles (model);
create index if not exists idx_vehicles_price     on public.vehicles (price);
create index if not exists idx_vehicles_available on public.vehicles (is_available);
create index if not exists idx_vehicles_year      on public.vehicles (year);

-- ============================================================
-- Table: price_history
-- Records every detected price change for each vehicle.
-- Queried to show price history on the detail page.
-- ============================================================
create table if not exists public.price_history (
  id          uuid primary key default gen_random_uuid(),
  vin         text not null references public.vehicles(vin) on delete cascade,
  price       integer not null,
  recorded_at timestamptz default now()
);

create index if not exists idx_price_history_vin on public.price_history (vin, recorded_at desc);

-- ============================================================
-- Table: user_favorites
-- Maps authenticated users to the vehicles they have "hearted".
-- The UNIQUE constraint prevents a user from hearting the same car twice.
-- ============================================================
create table if not exists public.user_favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  vin         text not null references public.vehicles(vin) on delete cascade,
  hearted_at  timestamptz default now(),
  unique (user_id, vin)
);

create index if not exists idx_user_favorites_user on public.user_favorites (user_id);
create index if not exists idx_user_favorites_vin  on public.user_favorites (vin);

-- ============================================================
-- Table: alert_log
-- Records every price-change email that has been sent.
-- Checked before sending to prevent duplicate emails.
-- ============================================================
create table if not exists public.alert_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  vin         text not null,
  old_price   integer not null,
  new_price   integer not null,
  alerted_at  timestamptz default now()
);

create index if not exists idx_alert_log_user on public.alert_log (user_id);
create index if not exists idx_alert_log_vin  on public.alert_log (vin, alerted_at desc);

-- ============================================================
-- Row Level Security (RLS)
-- Controls who can read/write which rows.
-- ============================================================
alter table public.vehicles       enable row level security;
alter table public.price_history  enable row level security;
alter table public.user_favorites enable row level security;
alter table public.alert_log      enable row level security;

-- Vehicles: anyone (including anonymous visitors) can read
create policy "Vehicles are publicly readable"
  on public.vehicles for select using (true);

-- Price history: publicly readable (shown on detail page)
create policy "Price history is publicly readable"
  on public.price_history for select using (true);

-- User favorites: users can only see their own hearted vehicles
create policy "Users can view own favorites"
  on public.user_favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert own favorites"
  on public.user_favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own favorites"
  on public.user_favorites for delete
  using (auth.uid() = user_id);

-- Alert log: users can only see their own alerts
create policy "Users can view own alerts"
  on public.alert_log for select
  using (auth.uid() = user_id);

-- ============================================================
-- Note: Edge Functions run with the service_role key, which
-- bypasses RLS automatically. No extra policies needed for them.
-- ============================================================
