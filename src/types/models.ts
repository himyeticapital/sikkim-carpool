/**
 * Domain models mirroring the Supabase schema (see spec section 3).
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
  kyc_status: KycStatus;
  digilocker_ref_id: string | null;
  verified_at: string | null;
  created_at: string;
}

/** A geographic point as we pass it around the app (Postgres stores geometry). */
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

export interface Booking {
  id: string;
  ride_id: string;
  rider_id: string;
  seats_booked: number;
  status: BookingStatus;
  created_at: string;
}

/** Shape returned by the Places Autocomplete component on selection. */
export interface PlaceSelection {
  description: string;
  placeId: string;
  lat: number;
  lng: number;
}
