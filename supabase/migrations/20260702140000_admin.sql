-- Admin: role + ban columns, admin visibility, and moderation actions.
--
-- Admins (profiles.role = 'admin') get read access to everything, a stats
-- rollup, and two moderation levers: ban/unban a user and cancel a ride.
-- Banned users keep read access but can no longer post rides or book seats.
-- All of it is enforced here — the app's /admin screens are just a client.

alter table public.profiles
  add column role text not null default 'user' check (role in ('user', 'admin')),
  add column is_banned boolean not null default false;

-- security definer so RLS policies on profiles can call it without recursing
-- into themselves.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Missing profile row counts as banned: no write access for half-created users.
create function public.is_caller_banned()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_banned from public.profiles where id = auth.uid()),
    true
  );
$$;

-- 1. Owners must not grant themselves admin or lift their own ban. The
--    "users can update their own profile" policy is column-blind, so guard
--    the sensitive columns in a trigger instead. auth.uid() is null outside
--    a user-authenticated request (SQL console, service-role backends) —
--    those trusted paths stay open, e.g. for seeding the first admin.
create function public.handle_profile_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role <> old.role or new.is_banned <> old.is_banned)
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin may change role or ban status';
  end if;
  return new;
end;
$$;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute function public.handle_profile_updated();

-- 2. Admin visibility: full profiles (the owner-only policy stays for
--    everyone else) and all bookings. Rides are already readable by all.
create policy "admins can read all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "admins can read all bookings"
  on public.bookings for select
  to authenticated
  using (public.is_admin());

-- 3. Moderation: admins may update rides (in practice: cancel them — the
--    lifecycle triggers still enforce terminal statuses and cascade the
--    cancellation to bookings).
create policy "admins can update any ride"
  on public.rides for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 4. Ban enforcement: recreate the insert policies with a ban check. Reads
--    stay open — a banned user can look, but can't post rides or book seats.
drop policy "drivers can create their own rides" on public.rides;
create policy "drivers can create their own rides"
  on public.rides for insert
  to authenticated
  with check (auth.uid() = driver_id and not public.is_caller_banned());

drop policy "riders can create their own bookings" on public.bookings;
create policy "riders can create their own bookings"
  on public.bookings for insert
  to authenticated
  with check (auth.uid() = rider_id and not public.is_caller_banned());

-- 5. Ban/unban. Banning also withdraws the user from the marketplace:
--    their active rides are cancelled (the lifecycle cascade cancels those
--    rides' bookings) and their confirmed bookings on other rides are
--    cancelled (the booking trigger restores those seats).
create function public.admin_set_banned(p_user_id uuid, p_banned boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin may ban or unban users';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot ban yourself';
  end if;

  update public.profiles set is_banned = p_banned where id = p_user_id;
  if not found then
    raise exception 'User not found';
  end if;

  if p_banned then
    update public.rides
    set status = 'cancelled'
    where driver_id = p_user_id and status = 'active';

    update public.bookings
    set status = 'cancelled'
    where rider_id = p_user_id and status = 'confirmed';
  end if;
end;
$$;

revoke execute on function public.admin_set_banned(uuid, boolean) from anon, public;

-- 6. Stats rollup for the admin overview.
create function public.admin_get_stats()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select case when not public.is_admin() then null else json_build_object(
    'total_users', (select count(*) from public.profiles),
    'total_drivers', (select count(*) from public.profiles where is_driver),
    'verified_users', (select count(*) from public.profiles where kyc_status = 'verified'),
    'banned_users', (select count(*) from public.profiles where is_banned),
    'rides_active', (select count(*) from public.rides where status = 'active'),
    'rides_completed', (select count(*) from public.rides where status = 'completed'),
    'rides_cancelled', (select count(*) from public.rides where status = 'cancelled'),
    'bookings_confirmed', (select count(*) from public.bookings where status = 'confirmed'),
    'bookings_cancelled', (select count(*) from public.bookings where status = 'cancelled'),
    'seats_sold', (select coalesce(sum(seats_booked), 0) from public.bookings where status = 'confirmed'),
    'booked_value', (
      select coalesce(sum(b.seats_booked * r.price_per_seat), 0)
      from public.bookings b join public.rides r on r.id = b.ride_id
      where b.status = 'confirmed'
    )
  ) end;
$$;

revoke execute on function public.admin_get_stats() from anon, public;
