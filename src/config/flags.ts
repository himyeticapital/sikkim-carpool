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
