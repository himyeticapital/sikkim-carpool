-- Symmetric contact reveal: let a driver message their passengers.
--
-- get_driver_contact (privacy_hardening migration) lets a booked rider reach
-- the driver, but the driver had no way to reach a rider — profiles_public
-- deliberately omits phone numbers. Same gating idea, mirrored: the rider's
-- phone number is revealed only to the driver of the ride, and only while the
-- booking is confirmed.

create function public.get_rider_contact(p_booking_id uuid)
returns table (phone_number text)
language sql
security definer
set search_path = public
stable
as $$
  select p.phone_number
  from public.bookings b
  join public.rides r on r.id = b.ride_id
  join public.profiles p on p.id = b.rider_id
  where b.id = p_booking_id
    and b.status = 'confirmed'
    and r.driver_id = auth.uid();
$$;

revoke execute on function public.get_rider_contact(uuid) from anon, public;
