-- Privacy hardening + booking integrity.
--
-- Before this migration every signed-in user could read every profile row in
-- full — phone numbers, vehicle plates, DigiLocker reference ids. Ride search
-- responses embedded the driver's phone number before any booking existed.
-- Bookings could also be duplicated by a double-tap, created by the ride's
-- own driver, and cancelled without returning seats to the ride.
--
-- After it:
--   * the base `profiles` table is readable only by its owner;
--   * other users see a safe subset via the `profiles_public` view;
--   * a driver's phone number / plate are revealed only through the
--     `get_driver_contact` RPC, which requires a confirmed booking;
--   * one confirmed booking per rider per ride, no self-booking, and
--     cancellation restores the ride's seats.

-- 1. Profiles: owner-only on the base table.
drop policy "profiles are readable by any signed-in user" on public.profiles;

create policy "users can read their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- 2. Public-safe subset for showing other users (ride cards, ride details).
--    Intentionally a security-definer view (owned by postgres, which owns the
--    table and so bypasses the owner-only RLS above): that is what lets it
--    expose these columns while the base table stays locked down. It must
--    never include phone_number, vehicle_plate, digilocker_ref_id, or
--    verified_at.
create view public.profiles_public as
  select
    id,
    full_name,
    is_driver,
    rating,
    completed_rides_count,
    kyc_status,
    vehicle_make,
    vehicle_color,
    created_at
  from public.profiles;

revoke all on public.profiles_public from anon;
grant select on public.profiles_public to authenticated;

-- 3. Contact reveal: only a rider with a confirmed booking on the ride (or
--    the driver themselves) can resolve the driver's phone number and plate.
create function public.get_driver_contact(p_ride_id uuid)
returns table (phone_number text, vehicle_plate text)
language sql
security definer
set search_path = public
stable
as $$
  select p.phone_number, p.vehicle_plate
  from public.rides r
  join public.profiles p on p.id = r.driver_id
  where r.id = p_ride_id
    and (
      r.driver_id = auth.uid()
      or exists (
        select 1
        from public.bookings b
        where b.ride_id = r.id
          and b.rider_id = auth.uid()
          and b.status = 'confirmed'
      )
    );
$$;

revoke execute on function public.get_driver_contact(uuid) from anon, public;

-- 4. Booking integrity.

-- A double-tap (or a re-visit) must not create two live bookings for the
-- same rider on the same ride. Partial, so a cancelled booking doesn't block
-- booking the ride again.
create unique index bookings_one_confirmed_per_rider_idx
  on public.bookings (ride_id, rider_id)
  where status = 'confirmed';

-- Extend the seat-decrement trigger to also reject drivers booking a seat on
-- their own ride.
create or replace function public.handle_new_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  available int;
  ride_driver uuid;
begin
  select seats_available, driver_id into available, ride_driver
  from public.rides
  where id = new.ride_id
  for update;

  if available is null then
    raise exception 'Ride not found';
  end if;

  if ride_driver = new.rider_id then
    raise exception 'You cannot book a seat on your own ride';
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

-- The update RLS policy lets a rider touch their own booking row; constrain
-- that to a status change only, and make cancellation give the seats back
-- atomically. Reconfirming a cancelled booking is rejected rather than
-- re-decremented — the rider books again instead, which re-runs the
-- availability check above.
create function public.handle_booking_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.ride_id <> old.ride_id
     or new.rider_id <> old.rider_id
     or new.seats_booked <> old.seats_booked then
    raise exception 'Only a booking''s status may change';
  end if;

  if old.status = 'confirmed' and new.status = 'cancelled' then
    update public.rides
    set seats_available = seats_available + old.seats_booked
    where id = old.ride_id;
  elsif old.status = 'cancelled' and new.status = 'confirmed' then
    raise exception 'A cancelled booking cannot be reconfirmed — book the ride again';
  end if;

  return new;
end;
$$;

create trigger on_booking_updated
  before update on public.bookings
  for each row execute function public.handle_booking_updated();
