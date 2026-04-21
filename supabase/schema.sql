create extension if not exists "pgcrypto";

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  title text not null,
  start_date date not null,
  end_date date not null,
  share_password char(6) not null,
  is_share_protected boolean not null default true,
  created_at timestamptz not null default now(),
  constraint trips_date_range_check check (start_date <= end_date)
);

alter table public.trips
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

alter table public.trips
  add column if not exists itinerary_order jsonb not null default '{}'::jsonb;

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

create table if not exists public.flights (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  airline text not null,
  flight_number text not null,
  departure_airport text not null default '',
  arrival_airport text not null default '',
  departure_time timestamptz not null,
  arrival_time timestamptz not null,
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  address text,
  check_in_date date not null,
  check_out_date date not null,
  memo text,
  created_at timestamptz not null default now(),
  constraint hotels_date_range_check check (check_in_date <= check_out_date)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create index if not exists idx_places_trip_visit_sort on public.places (trip_id, visit_date, sort_order);
create index if not exists idx_trips_owner_user on public.trips (owner_user_id);
create index if not exists idx_flights_trip_departure on public.flights (trip_id, departure_time);
create index if not exists idx_hotels_trip_checkin on public.hotels (trip_id, check_in_date);
create index if not exists idx_notes_trip_created on public.notes (trip_id, created_at);
create index if not exists idx_trip_members_user on public.trip_members (user_id);

alter table public.trips enable row level security;
alter table public.places enable row level security;
alter table public.flights enable row level security;
alter table public.hotels enable row level security;
alter table public.notes enable row level security;
alter table public.trip_members enable row level security;

drop policy if exists "public read trips" on public.trips;
drop policy if exists "public insert trips" on public.trips;
drop policy if exists "public update trips" on public.trips;
drop policy if exists "public delete trips" on public.trips;
create policy "public read trips" on public.trips for select using (true);
create policy "public insert trips" on public.trips for insert with check (true);
create policy "public update trips" on public.trips for update using (true) with check (true);
create policy "public delete trips" on public.trips for delete using (auth.uid() = owner_user_id);

drop policy if exists "public read places" on public.places;
drop policy if exists "public insert places" on public.places;
drop policy if exists "public update places" on public.places;
drop policy if exists "public delete places" on public.places;
create policy "public read places" on public.places for select using (true);
create policy "public insert places" on public.places for insert with check (true);
create policy "public update places" on public.places for update using (true) with check (true);
create policy "public delete places" on public.places for delete using (true);

drop policy if exists "public read flights" on public.flights;
drop policy if exists "public insert flights" on public.flights;
drop policy if exists "public update flights" on public.flights;
drop policy if exists "public delete flights" on public.flights;
create policy "public read flights" on public.flights for select using (true);
create policy "public insert flights" on public.flights for insert with check (true);
create policy "public update flights" on public.flights for update using (true) with check (true);
create policy "public delete flights" on public.flights for delete using (true);

drop policy if exists "public read hotels" on public.hotels;
drop policy if exists "public insert hotels" on public.hotels;
drop policy if exists "public update hotels" on public.hotels;
drop policy if exists "public delete hotels" on public.hotels;
create policy "public read hotels" on public.hotels for select using (true);
create policy "public insert hotels" on public.hotels for insert with check (true);
create policy "public update hotels" on public.hotels for update using (true) with check (true);
create policy "public delete hotels" on public.hotels for delete using (true);

drop policy if exists "public read notes" on public.notes;
drop policy if exists "public insert notes" on public.notes;
drop policy if exists "public update notes" on public.notes;
drop policy if exists "public delete notes" on public.notes;
create policy "public read notes" on public.notes for select using (true);
create policy "public insert notes" on public.notes for insert with check (true);
create policy "public update notes" on public.notes for update using (true) with check (true);
create policy "public delete notes" on public.notes for delete using (true);

drop policy if exists "public read trip_members" on public.trip_members;
drop policy if exists "public insert trip_members" on public.trip_members;
drop policy if exists "public delete trip_members" on public.trip_members;
create policy "public read trip_members" on public.trip_members for select using (true);
create policy "public insert trip_members" on public.trip_members for insert with check (true);
create policy "public delete trip_members" on public.trip_members for delete using (true);
