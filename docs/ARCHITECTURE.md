# Architecture

The living map of how Sikkim Carpool is built. Update it in the same commit as
any change that would make it lie. README.md covers setup; this covers design.

## System shape

One Expo (React Native) app talking directly to Supabase — no custom server.
Every invariant that matters (seat counts, contact privacy, bans, status
transitions) is enforced **in Postgres** via RLS policies, triggers, and
security-definer RPCs. The client is untrusted by design: screens can be
wrong, slow, or malicious and the data stays correct.

```
app (Expo Router screens)
  └── src/services/*  ← the only code that touches Supabase
        └── Supabase: Postgres (RLS + triggers + RPCs), phone-OTP auth
```

## Directory map

```
app/                    Routes = screens (Expo Router, file-based, typed routes)
  onboarding/            First-run carousel
  auth/                  Phone + OTP sign-in
  (tabs)/                Home/search · Offer a ride · Profile
  ride/[id].tsx          Ride details + booking
  my-rides.tsx           Rider bookings + driver's posted rides, lifecycle actions
  admin/                 Role-gated section; _layout.tsx holds the single guard
  verify/                DigiLocker placeholder (see Feature flags)
src/
  components/            Shared UI; brand/ holds decorative SVG artwork
  services/              Supabase data layer (auth, rides, profiles, places, admin)
  store/                 Zustand store: session + profile + initializing
  lib/                   Pure helpers (format, geo, avatar, whatsapp, confirm)
  theme/                 colors.js (single palette source), navigation.ts
  config/                env access, feature flags
  types/                 Domain models mirroring the DB schema
supabase/migrations/     The schema, in order; every DB change is a new file
docs/                    This file
```

## Client conventions

- **Screens live in `app/` route files.** No parallel "screens" directory.
  When a screen grows past ~200 lines, extract its cards/sections into
  `src/components/` (see `BookedRideCard`/`OfferedRideCard` from My Rides).
- **All Supabase access goes through `src/services/`.** Screens never import
  the Supabase client. Services own the select strings, RPC names, and cast
  the results to `src/types/models.ts` shapes.
- **`src/types/models.ts` mirrors the DB schema** — change them together, and
  say so in the migration comment.
- **Colors have one source: `src/theme/colors.js`.** Tailwind classNames come
  from it via tailwind.config.js; JS-side styling (ActivityIndicator,
  placeholderTextColor, SVG, navigation) imports `palette` from it. No hex
  literals in screens. (Exception: `src/components/brand/*` artwork may keep
  one-off decorative tints.)
- **Shared UI primitives** (use these, don't re-roll them):
  - `Pill` — every status/badge; state maps to a tone
    (positive/neutral/warning/danger), never ad-hoc colors.
  - `Avatar` — initials avatar (sm/md/lg); the app has no photo uploads.
  - `Card` / `PressableCard` — the one card surface (radius, hairline border,
    paper-lift shadow); no hand-rolled `rounded-2xl border …` strings.
  - `RouteLines` — origin dot + destination square, anywhere a ride shows.
  - `TimeChips` — departure time/date chips; extra chips via children.
  - `EmptyState`, `SegmentedControl` (animated thumb), `OtpCells`,
    `Skeleton`/`RideCardSkeleton`.
- **Every confirm-then-mutate flow uses `lib/confirm.ts`'s `confirmAction`**;
  WhatsApp deep links use `lib/whatsapp.ts`.

### Motion & interaction

The animation system is three springs (`src/theme/motion.ts`: press / gentle /
pop) plus a stagger helper — every animation draws from them so the app moves
with one personality. Rules:

- **Presses are physical, not painted**: interactive surfaces use
  `PressableScale` (spring scale + selection haptic) instead of `active:`
  color classes. Rows inside a card keep the painted active state; standalone
  buttons/cards scale.
- **Lists load as skeletons** (`RideCardSkeleton`), never a bare spinner, and
  **enter with a capped stagger** (`FadeInDown` + `staggerDelay`). Spinners
  remain only inside buttons.
- **Haptics vocabulary** (`lib/haptics.ts`): tap = acknowledged press,
  success = something completed, warning = destructive confirm or failure.
  Native-only; web stays silent. `confirmAction` fires warning automatically
  when `destructive`.
- **Animated components come from `src/components/animated.ts`**
  (`AnimatedView`, `AnimatedPressable`, pre-registered with NativeWind's
  `cssInterop`); don't call `createAnimatedComponent` per file.
- **Signature pieces**: `PrayerFlagGarland` flags flutter on a shared breeze
  clock (SVG animatedProps — works on native and web via Reanimated's web
  runtime). `MistOverlay` is a Skia fbm fragment shader on native
  (`.native.tsx`); the web sibling (`.tsx`) ports the same fbm noise/density
  math to a throttled Canvas2D loop (low-res buffer, upscaled with
  smoothing) instead of shipping Skia's CanvasKit WASM just for one effect —
  same look, no WASM cost. Keep both files' noise math in sync if you tune
  the shader.
- The booking success moment (ride details) is the one celebratory `pop`:
  ZoomIn card + mini garland + success haptic. Don't dilute it by reusing the
  pop spring for routine transitions.
- **State**: the Zustand store holds only session, profile, and the
  initializing flag. Screen data stays in screen state.
- **Typed routes are on** (`experiments.typedRoutes`). After adding/renaming a
  route, regenerate `.expo/types/router.d.ts` by briefly running
  `npx expo start` — typecheck fails on new paths until you do.
- **Dates**: ride search means "a calendar day where the user is". Build day
  bounds as local Dates, compare as ISO instants (`lib/format.ts`
  `toLocalDateKey`, `src/services/rides.ts` listRides). Never
  `toISOString().slice(0, 10)` for a local date.

## Data model & invariants

Tables: `profiles`, `rides`, `bookings` (see migrations for columns).
`profiles.id` = `auth.users.id`. Coordinates are `{lat,lng}` jsonb — no
PostGIS until search needs radius queries.

The invariants, and where they're enforced:

| Invariant | Enforced by |
| --- | --- |
| Profile row exists for every user | `on_auth_user_created` trigger |
| Seats decrement atomically; no overbooking; no self-booking; no booking non-active rides | `handle_new_booking` (before insert on bookings) |
| One confirmed booking per rider per ride | partial unique index |
| Booking updates may only change status; cancel restores seats (only while ride active); no re-confirming | `handle_booking_updated` |
| completed/cancelled rides are terminal | `handle_ride_updated` |
| Completing a ride bumps `completed_rides_count` (driver + confirmed riders); cancelling cascades to bookings | `handle_ride_status_changed` (after update) |
| Users can't change their own `role`/`is_banned` | `handle_profile_updated` (skipped when `auth.uid()` is null — trusted console/service paths) |
| Banned users can't post rides or book seats | insert policies + `is_caller_banned()` |

### Privacy model (who sees whose phone number)

The base `profiles` table is readable only by its owner (and admins). Everyone
else sees the `profiles_public` view — no phone, plate, or DigiLocker fields.
Contact is revealed only across a **confirmed booking**, in both directions:

| Caller | RPC | Gets |
| --- | --- | --- |
| Rider with confirmed booking (or the driver) | `get_driver_contact(ride_id)` | driver phone + plate |
| Driver of the booking's ride, booking confirmed | `get_rider_contact(booking_id)` | rider phone |
| Anyone else | either | empty |

Cancelling closes access again. If `profiles` gains sensitive columns, they
must NOT be added to `profiles_public`.

### Admin

`profiles.role = 'admin'` unlocks: read-all policies (profiles, bookings),
update-any-ride, `admin_get_stats()` (overview rollup; returns null for
non-admins), and `admin_set_banned(user, banned)` (ban also cancels the
user's active rides/bookings via the cascades above). The client gate is one
`Redirect` in `app/admin/_layout.tsx`; RLS is the real gate. Seed admins by
setting `role='admin'` on the profile row from a trusted path (SQL editor /
Management API).

## Feature flags (`src/config/flags.ts`)

`REQUIRE_DRIVER_KYC_BEFORE_POSTING` / `REQUIRE_RIDER_KYC_BEFORE_BOOKING` —
both `false` until the DigiLocker flow is real (the verify screens are
placeholders; gating now would dead-end users). The gates in offer-ride and
ride-details already honour them.

## Backend workflow

Schema changes: new file in `supabase/migrations/` (timestamp-named), then
`supabase db push` (project is linked). Never edit an applied migration —
except trivially, paired with manually syncing the remote, and only before
it's committed. Auth config (test OTPs etc.) isn't in migrations; it's set via
the Management API — the CLI's token (macOS keychain, "Supabase CLI") works
for `api.supabase.com/v1/projects/<ref>/config/auth` and `/database/query`.

## Dev accounts (test OTPs, no SMS provider needed)

| Phone | OTP | Role |
| --- | --- | --- |
| +91 99999 00001 | 123456 | rider test account |
| +91 99999 00002 | 123456 | driver test account |
| +91 99999 00003 | 123456 | admin |

Valid until 2027-07-02. Real SMS needs a provider account (Twilio/MSG91) —
the one thing that can't be scripted from here.

### Verifying end-to-end without a device

Sign in via REST (`POST {url}/auth/v1/otp` then `/auth/v1/verify` with the
test OTP), then hit `rest/v1/*` with the returned access token. The flows in
git history commit messages ("Verified live…") were exercised this way:
book → seats decrement → contact reveal → cancel → cascade; ban → withdrawal
→ RLS rejection.

## Decision log

- **No custom backend.** Supabase RLS/triggers/RPCs carry all invariants;
  revisit only if logic stops fitting in SQL (e.g. DigiLocker OAuth secret →
  edge function).
- **Admin lives in the app**, role-gated, not a separate web project — zero
  extra infra; extract later if the admin team outgrows it.
- **`profiles_public` is a security-definer view on purpose** — that's what
  lets it bypass the owner-only RLS while the base table stays locked.
- **jsonb coords over PostGIS** — search is destination-text + day; upgrade
  when radius search is wanted.
- **Search matching is `ilike` on destination text** — fine for MVP volumes.
- **Ratings are schema-only** (always 0) — no rating flow yet.
- **Payments**: none; `price_per_seat` is informational, cash/UPI settled
  off-app.
