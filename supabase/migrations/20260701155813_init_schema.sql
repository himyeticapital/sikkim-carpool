-- Initial schema for Sikkim Carpool: profiles, rides, bookings.
-- Mirrors src/types/models.ts — keep the two in sync when either changes.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone_number text not null,
  is_driver boolean not null default false,
  rating numeric not null default 0,
  completed_rides_count integer not null default 0,
  kyc_status text not null default 'unverified'
    check (kyc_status in ('unverified', 'pending', 'verified')),
  digilocker_ref_id text,
  verified_at timestamptz,
  vehicle_make text,
  vehicle_color text,
  vehicle_plate text,
  created_at timestamptz not null default now()
);

create table public.rides (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles (id) on delete cascade,
  source_text text not null,
  destination_text text not null,
  -- {lat, lng} jsonb rather than PostGIS geography — no radius/geospatial
  -- queries yet (search matches on destination_text + departure day; see
  -- src/services/rides.ts), so the simpler shape is enough for MVP.
  source_coords jsonb,
  destination_coords jsonb,
  departure_time timestamptz not null,
  seats_total integer not null check (seats_total > 0),
  seats_available integer not null check (seats_available >= 0),
  price_per_seat numeric not null check (price_per_seat > 0),
  status text not null default 'active'
    check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides (id) on delete cascade,
  rider_id uuid not null references public.profiles (id) on delete cascade,
  seats_booked integer not null check (seats_booked > 0),
  status text not null default 'confirmed'
    check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index rides_status_departure_idx on public.rides (status, departure_time);
create index bookings_ride_id_idx on public.bookings (ride_id);
create index bookings_rider_id_idx on public.bookings (rider_id);

-- Auto-create a profile row on first sign-in, so the app never has to race
-- its own client-side upsert (src/services/auth.ts's fetchOrCreateProfile)
-- against a not-yet-existing row. That client call still runs on every
-- sign-in; it just finds the row already here and skips the insert.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone_number)
  values (new.id, coalesce(new.phone, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomically decrement seats_available when a booking is created, so two
-- riders can't both book the last seat (src/services/rides.ts's
-- createBooking flagged this as required here, not client-side).
create function public.handle_new_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  available int;
begin
  select seats_available into available
  from public.rides
  where id = new.ride_id
  for update;

  if available is null then
    raise exception 'Ride not found';
  end if;

  if available < new.seats_booked then
    raise exception 'Not enough seats available';
  end if;

  update public.rides
  set seats_available = seats_available - new.seats_booked
  where id = new.ride_id;

  return new;
end;
$$;

create trigger on_booking_created
  before insert on public.bookings
  for each row execute function public.handle_new_booking();

-- RLS

alter table public.profiles enable row level security;
alter table public.rides enable row level security;
alter table public.bookings enable row level security;

-- Profiles: names/ratings/vehicle info are meant to be seen by the other
-- party in a ride, so any signed-in user can read any profile; writes are
-- restricted to the owner.
create policy "profiles are readable by any signed-in user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Rides: browsable by any signed-in user (Home search); only the driver can
-- create or modify their own.
create policy "rides are readable by any signed-in user"
  on public.rides for select
  to authenticated
  using (true);

create policy "drivers can create their own rides"
  on public.rides for insert
  to authenticated
  with check (auth.uid() = driver_id);

create policy "drivers can update their own rides"
  on public.rides for update
  to authenticated
  using (auth.uid() = driver_id)
  with check (auth.uid() = driver_id);

-- Bookings: visible to the rider who made it and the driver of that ride;
-- only the rider can create or cancel their own.
create policy "bookings are readable by the rider or the ride's driver"
  on public.bookings for select
  to authenticated
  using (
    auth.uid() = rider_id
    or auth.uid() = (select driver_id from public.rides where id = ride_id)
  );

create policy "riders can create their own bookings"
  on public.bookings for insert
  to authenticated
  with check (auth.uid() = rider_id);

create policy "riders can update their own bookings"
  on public.bookings for update
  to authenticated
  using (auth.uid() = rider_id)
  with check (auth.uid() = rider_id);
