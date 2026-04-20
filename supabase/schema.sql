create extension if not exists "pgcrypto";

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date not null,
  share_password char(6) not null,
  is_share_protected boolean not null default true,
  created_at timestamptz not null default now(),
  constraint trips_date_range_check check (start_date <= end_date)
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  visit_date date not null,
  name text not null,
  address text,
  memo text,
  lat double precision,
  lng double precision,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_places_trip_visit_sort on public.places (trip_id, visit_date, sort_order);
create index if not exists idx_notes_trip_created on public.notes (trip_id, created_at);

alter table public.trips enable row level security;
alter table public.places enable row level security;
alter table public.notes enable row level security;

create policy "public read trips" on public.trips for select using (true);
create policy "public read places" on public.places for select using (true);
create policy "public read notes" on public.notes for select using (true);

create policy "public insert trips" on public.trips for insert with check (true);
create policy "public insert places" on public.places for insert with check (true);
create policy "public insert notes" on public.notes for insert with check (true);
