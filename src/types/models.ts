/**
 * Domain models mirroring the Supabase schema (see supabase/migrations/).
 * Kept in one place so screens, services, and the store agree on shapes.
 * These will be the source of truth until we generate types from Supabase.
 */

export type KycStatus = 'unverified' | 'pending' | 'verified';
export type RideStatus = 'active' | 'completed' | 'cancelled';
export type BookingStatus = 'confirmed' | 'cancelled';

export interface Profile {
  id: string;
  full_name: string | null;
  phone_number: string;
  is_driver: boolean;
  rating: number;
  /** Denormalized count of completed rides, shown next to the rating badge. */
  completed_rides_count: number;
  kyc_status: KycStatus;
  digilocker_ref_id: string | null;
  verified_at: string | null;
  created_at: string;
  /** Vehicle details, set once a driver posts their first ride. */
  vehicle_make: string | null;
  vehicle_color: string | null;
  vehicle_plate: string | null;
}

/** A geographic point as we pass it around the app (stored as jsonb, not PostGIS — no geospatial queries yet). */
export interface LatLng {
  lat: number;
  lng: number;
}

export interface Ride {
  id: string;
  driver_id: string;
  source_text: string;
  destination_text: string;
  source_coords: LatLng | null;
  destination_coords: LatLng | null;
  departure_time: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: RideStatus;
  created_at: string;
}

/**
 * A ride joined with the public-safe subset of its driver's profile (the
 * profiles_public view). Phone number and plate are deliberately absent —
 * they're only obtainable via get_driver_contact after a confirmed booking.
 */
export interface RideWithDriver extends Ride {
  driver: Pick<
    Profile,
    | 'id'
    | 'full_name'
    | 'rating'
    | 'completed_rides_count'
    | 'vehicle_make'
    | 'vehicle_color'
  >;
}

/** Driver contact details revealed by the get_driver_contact RPC after booking. */
export interface DriverContact {
  phone_number: string;
  vehicle_plate: string | null;
}

/** Rider contact details revealed by the get_rider_contact RPC to the ride's driver. */
export interface RiderContact {
  phone_number: string;
}

export interface Booking {
  id: string;
  ride_id: string;
  rider_id: string;
  seats_booked: number;
  status: BookingStatus;
  created_at: string;
}

/** A booking joined with its ride (and that ride's driver) — the rider's "Booked" list. */
export interface BookingWithRide extends Booking {
  ride: RideWithDriver;
}

/** A booking joined with the rider's public profile — a driver's passenger list. */
export interface BookingWithRider extends Booking {
  rider: Pick<Profile, 'id' | 'full_name' | 'rating'>;
}

/** A driver's own ride with its bookings — the "Offered" list on My Rides. */
export interface RideWithBookings extends Ride {
  bookings: BookingWithRider[];
}

/** Shape returned by the Places Autocomplete component on selection. */
export interface PlaceSelection {
  description: string;
  placeId: string;
  lat: number;
  lng: number;
}
