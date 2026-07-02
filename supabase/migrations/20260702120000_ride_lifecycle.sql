-- Ride lifecycle: make `rides.status` transitions real.
--
-- Before this migration the status column existed but nothing enforced or
-- reacted to it: completed_rides_count never incremented, a cancelled ride
-- left its confirmed bookings dangling, and a non-active ride could still
-- accept new bookings via the API.
--
-- After it:
--   * completed/cancelled are terminal — only an 'active' ride may change status;
--   * completing a ride bumps completed_rides_count for the driver and every
--     rider with a confirmed booking;
--   * cancelling a ride cancels its confirmed bookings;
--   * booking a non-active ride is rejected;
--   * cancelling a booking restores seats only while the ride is active.

-- 1. Terminal statuses. BEFORE trigger so the write is rejected outright.
create function public.handle_ride_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> old.status and old.status <> 'active' then
    raise exception 'A % ride can no longer change status', old.status;
  end if;
  return new;
end;
$$;

create trigger on_ride_updated
  before update on public.rides
  for each row execute function public.handle_ride_updated();

-- 2. React to a ride leaving 'active'. AFTER trigger: the cascade below
--    re-enters public.bookings, whose own update trigger reads the ride's
--    (by then committed-to-the-row) status to decide about seat restoration.
create function public.handle_ride_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' then
    update public.profiles
    set completed_rides_count = completed_rides_count + 1
    where id = new.driver_id
       or id in (
         select rider_id from public.bookings
         where ride_id = new.id and status = 'confirmed'
       );
  elsif new.status = 'cancelled' then
    update public.bookings
    set status = 'cancelled'
    where ride_id = new.id and status = 'confirmed';
  end if;
  return null;
end;
$$;

-- `update of status` + the WHEN clause keep this from firing on the frequent
-- seats_available updates the booking triggers make.
create trigger on_ride_status_changed
  after update of status on public.rides
  for each row
  when (old.status is distinct from new.status)
  execute function public.handle_ride_status_changed();

-- 3. Reject bookings on rides that are no longer active.
create or replace function public.handle_new_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  available int;
  ride_driver uuid;
  ride_status text;
begin
  select seats_available, driver_id, status
  into available, ride_driver, ride_status
  from public.rides
  where id = new.ride_id
  for update;

  if available is null then
    raise exception 'Ride not found';
  end if;

  if ride_status <> 'active' then
    raise exception 'This ride is no longer accepting bookings';
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

-- 4. Seat restoration on cancellation only applies to a ride that is still
--    taking bookings. For a completed ride the seats are moot, and for a
--    cancelled ride the cascade in handle_ride_status_changed lands here with
--    the ride already 'cancelled' — restoring would be a pointless write.
create or replace function public.handle_booking_updated()
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
    where id = old.ride_id and status = 'active';
  elsif old.status = 'cancelled' and new.status = 'confirmed' then
    raise exception 'A cancelled booking cannot be reconfirmed — book the ride again';
  end if;

  return new;
end;
$$;
