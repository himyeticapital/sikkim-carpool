/**
 * App-wide feature flags.
 *
 * These are compile-time constants for the MVP. If any needs to become
 * remotely-togglable later, swap the value for a lookup without changing
 * call sites.
 */

/**
 * Whether a driver must complete DigiLocker/Aadhaar KYC *before* their offered
 * ride is posted, rather than only when they accept a rider.
 *
 * Default `false` per product decision: keep "offer a ride" as frictionless as
 * signup. Verification is gated at the point of commitment (rider books a seat
 * / driver accepts a rider). Flip to `true` to require drivers to verify up
 * front — no schema change is needed, the KYC state already lives on `profiles`.
 */
export const REQUIRE_DRIVER_KYC_BEFORE_POSTING = false;

/**
 * Whether a rider must complete DigiLocker/Aadhaar KYC before booking a seat.
 *
 * `false` until the real DigiLocker consent flow ships — the verify screens are
 * still placeholders, so gating on this today would dead-end every booking at
 * app/verify/digilocker.tsx with no way to ever become verified. Flip to `true`
 * once verification works end-to-end; the booking gate in app/ride/[id].tsx
 * already honours it.
 */
export const REQUIRE_RIDER_KYC_BEFORE_BOOKING = false;
