import { RIDE_WITH_DRIVER_SELECT } from '@/services/rides';
import { supabase } from '@/services/supabase';
import type { Profile, RideStatus, RideWithDriver } from '@/types/models';

/**
 * Admin-only data layer. Every call here is gated server-side — RLS policies
 * and RPCs check profiles.role = 'admin' — so a non-admin reaching these
 * functions gets errors/empty results, not data. The /admin screens are the
 * only callers.
 */

/** Rollup returned by the admin_get_stats RPC. */
export interface AdminStats {
  total_users: number;
  total_drivers: number;
  verified_users: number;
  banned_users: number;
  rides_active: number;
  rides_completed: number;
  rides_cancelled: number;
  bookings_confirmed: number;
  bookings_cancelled: number;
  seats_sold: number;
  /** Sum of confirmed seats × price, in rupees. */
  booked_value: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const { data, error } = await supabase.rpc('admin_get_stats');
  if (error) throw error;
  // The RPC returns null instead of raising for non-admins.
  if (!data) throw new Error('Not authorized');
  return data as AdminStats;
}

/** All profiles, newest first, optionally filtered by name/phone substring. */
export async function listAllProfiles(search?: string): Promise<Profile[]> {
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (search) {
    // Strip PostgREST or-syntax delimiters so user input can't break the filter.
    const safe = search.replace(/[,()]/g, '').trim();
    if (safe) {
      query = query.or(`full_name.ilike.%${safe}%,phone_number.ilike.%${safe}%`);
    }
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Profile[];
}

/** A ride as the admin rides list shows it: driver info plus a bookings count. */
export interface AdminRide extends RideWithDriver {
  bookings: { count: number }[];
}

export async function listAllRides(status?: RideStatus): Promise<AdminRide[]> {
  let query = supabase
    .from('rides')
    .select(`${RIDE_WITH_DRIVER_SELECT}, bookings(count)`)
    .order('departure_time', { ascending: false })
    .limit(100);
  if (status) {
    query = query.eq('status', status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as AdminRide[];
}

/**
 * Bans or unbans a user. Banning also pulls them out of the marketplace:
 * the RPC cancels their active rides and confirmed bookings server-side.
 */
export async function setUserBanned(
  userId: string,
  banned: boolean,
): Promise<void> {
  const { error } = await supabase.rpc('admin_set_banned', {
    p_user_id: userId,
    p_banned: banned,
  });
  if (error) throw error;
}
