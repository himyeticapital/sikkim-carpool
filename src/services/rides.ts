import { supabase } from '@/services/supabase';
import type {
  Booking,
  BookingWithRide,
  DriverContact,
  Ride,
  RideWithBookings,
  RideWithDriver,
  RiderContact,
} from '@/types/models';

/**
 * Data layer for rides/bookings. Requires `rides`, `bookings`, and `profiles`
 * tables (with matching RLS policies) to exist in the Supabase project —
 * that schema lives outside this repo, so these calls will error until it's
 * set up.
 */

// Driver info comes from the profiles_public view, never the base table:
// phone_number and vehicle_plate are gated behind get_driver_contact (a
// confirmed booking) and must not appear in search/detail payloads.
const RIDE_WITH_DRIVER_SELECT =
  '*, driver:profiles_public!rides_driver_id_fkey(id, full_name, rating, completed_rides_count, vehicle_make, vehicle_color)';

export interface RideFilters {
  destinationText?: string;
  /** ISO calendar date (YYYY-MM-DD); matches rides departing on that day. */
  departureDate?: string;
}

export async function listRides(
  filters: RideFilters = {},
): Promise<RideWithDriver[]> {
  let query = supabase
    .from('rides')
    .select(RIDE_WITH_DRIVER_SELECT)
    .eq('status', 'active')
    .gt('seats_available', 0)
    // Rides that already departed are stale even if still 'active'.
    .gte('departure_time', new Date().toISOString())
    .order('departure_time', { ascending: true });

  if (filters.destinationText) {
    query = query.ilike('destination_text', `%${filters.destinationText}%`);
  }
  if (filters.departureDate) {
    // The date means a calendar day in the device's timezone, so build the
    // day's bounds as local Dates and compare as absolute instants —
    // timezone-naive strings would be read as UTC by Postgres and shift the
    // whole day by the UTC offset (5h30m for IST).
    const dayStart = new Date(`${filters.departureDate}T00:00:00`);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    query = query
      .gte('departure_time', dayStart.toISOString())
      .lt('departure_time', dayEnd.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as RideWithDriver[];
}

export async function getRideById(id: string): Promise<RideWithDriver | null> {
  const { data, error } = await supabase
    .from('rides')
    .select(RIDE_WITH_DRIVER_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as RideWithDriver | null;
}

export interface CreateRideInput {
  driver_id: string;
  source_text: string;
  destination_text: string;
  source_coords: Ride['source_coords'];
  destination_coords: Ride['destination_coords'];
  departure_time: string;
  seats_total: number;
  price_per_seat: number;
}

export async function createRide(input: CreateRideInput): Promise<Ride> {
  const { data, error } = await supabase
    .from('rides')
    .insert({ ...input, seats_available: input.seats_total, status: 'active' })
    .select('*')
    .single();
  if (error) throw error;
  return data as Ride;
}

/**
 * Creates a booking. Decrementing the ride's `seats_available` must happen
 * atomically alongside this insert (a Postgres function/trigger keyed off
 * `bookings`), not as a separate client-side read-then-write — that's part
 * of the Supabase-side schema this repo doesn't own.
 */
export async function createBooking(
  rideId: string,
  riderId: string,
  seats: number,
): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      ride_id: rideId,
      rider_id: riderId,
      seats_booked: seats,
      status: 'confirmed',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Booking;
}

/** The rider's own bookings, newest first, each with its ride and driver. */
export async function listMyBookings(
  riderId: string,
): Promise<BookingWithRide[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`*, ride:rides!bookings_ride_id_fkey(${RIDE_WITH_DRIVER_SELECT})`)
    .eq('rider_id', riderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as BookingWithRide[];
}

/**
 * Cancels a booking. Seat restoration happens in the on_booking_updated
 * trigger, atomically with this status change — never client-side.
 */
export async function cancelBooking(bookingId: string): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Booking;
}

/**
 * The driver's own rides, newest departure first, each with its bookings and
 * riders' public profiles. RLS lets a driver read bookings on their rides.
 */
export async function listMyRides(
  driverId: string,
): Promise<RideWithBookings[]> {
  const { data, error } = await supabase
    .from('rides')
    .select(
      '*, bookings(*, rider:profiles_public!bookings_rider_id_fkey(id, full_name, rating))',
    )
    .eq('driver_id', driverId)
    .order('departure_time', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as RideWithBookings[];
}

/**
 * Marks a ride completed or cancelled. Side effects (completed-rides counters,
 * cancelling the ride's bookings) run in the on_ride_status_changed trigger;
 * both statuses are terminal, so the server rejects any later change.
 */
export async function updateRideStatus(
  rideId: string,
  status: 'completed' | 'cancelled',
): Promise<Ride> {
  const { data, error } = await supabase
    .from('rides')
    .update({ status })
    .eq('id', rideId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Ride;
}

/**
 * Resolves the driver's phone number and vehicle plate for a ride. Gated
 * server-side (get_driver_contact RPC): returns null unless the caller has a
 * confirmed booking on the ride or is its driver.
 */
export async function getDriverContact(
  rideId: string,
): Promise<DriverContact | null> {
  const { data, error } = await supabase.rpc('get_driver_contact', {
    p_ride_id: rideId,
  });
  if (error) throw error;
  const [contact] = (data ?? []) as DriverContact[];
  return contact ?? null;
}

/**
 * The mirror of getDriverContact: resolves a passenger's phone number for the
 * ride's driver. Gated server-side (get_rider_contact RPC): returns null
 * unless the caller drives the booking's ride and the booking is confirmed.
 */
export async function getRiderContact(
  bookingId: string,
): Promise<RiderContact | null> {
  const { data, error } = await supabase.rpc('get_rider_contact', {
    p_booking_id: bookingId,
  });
  if (error) throw error;
  const [contact] = (data ?? []) as RiderContact[];
  return contact ?? null;
}
