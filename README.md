# Sikkim Carpool

A carpooling app for Sikkim — riders search for and book seats on rides drivers
are already posting between hill towns; drivers post a route, date, seats, and
price per seat. Built with Expo Router, NativeWind, Supabase, and Google Places.

## Status

Actively in development. All core screens are implemented and typecheck
cleanly. The Supabase project is created and its schema is live (see
[Backend](#backend) below); one manual dashboard step remains before Auth
works end-to-end (see [Known gaps](#known-gaps)):

| Screen | Status |
| --- | --- |
| Onboarding | ✅ |
| Auth (phone + OTP) | ✅ |
| Home / Search | ✅ |
| Offer a Ride | ✅ |
| Ride Details + Booking | ✅ |
| Profile | ✅ |
| My Rides (bookings + offered rides, cancel/complete) | ✅ |
| Admin dashboard (stats, user bans, ride moderation) | ✅ |
| DigiLocker verification | 🚧 placeholder |

## Tech stack

- [Expo](https://docs.expo.dev/versions/v57.0.0/) (React Native) + [Expo Router](https://docs.expo.dev/router/introduction/) — file-based navigation
- [NativeWind](https://www.nativewind.dev/) — Tailwind CSS for React Native
- [Supabase](https://supabase.com/) — auth (phone/OTP), Postgres, and row-level security
- [Zustand](https://github.com/pmndrs/zustand) — client state (session, profile)
- Google Places (legacy Autocomplete + Details + Geocoding APIs) — location search
- `react-native-maps` — route preview on Ride Details

## Getting started

### Prerequisites

- Node.js and npm
- [Expo Go](https://expo.dev/go) app, or an iOS/Android simulator
- A Supabase project
- A Google Maps Platform API key with Places API, Geocoding API, and Maps SDK enabled

### Install

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your own values:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Places Autocomplete/Details/Geocoding + native map SDK |
| `EXPO_PUBLIC_DIGILOCKER_CLIENT_ID` | DigiLocker OAuth client id (public; the secret stays server-side) |

### Run

```bash
npm start        # then press i / a / w, or scan the QR code with Expo Go
npm run ios
npm run android
npm run web
```

### Typecheck

```bash
npm run typecheck
```

## Backend

The Supabase project's schema lives in `supabase/migrations/` — tables, RLS
policies, and triggers that keep the interesting invariants server-side:
profile auto-creation on sign-up, atomic seat decrement/restore on
booking/cancellation, phone numbers revealed only across a confirmed booking
(`get_driver_contact` / `get_rider_contact`), ride lifecycle rules (terminal statuses,
completed-ride counters, booking cancellation cascade), and admin moderation
(role-gated visibility, ban/unban with marketplace withdrawal, ride
cancellation). Apply it to a project with the
[Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

## Known gaps

- **Real SMS delivery**: phone-OTP sign-in is enabled with **test numbers**
  (`+91 99999 00001`, `+91 99999 00002`, and `+91 99999 00003`, all accepting
  OTP `123456`, valid until 2027-07-02) so the app works end-to-end in
  development. `00003` is seeded as an **admin** account (Profile > Admin
  Dashboard). Real phone numbers still need an SMS provider (Twilio, MSG91,
  etc.) configured under Authentication > Providers in the Supabase
  dashboard — that needs a separate SMS-provider account and can't be
  scripted from this repo. To seed more admins, set `role = 'admin'` on
  their `profiles` row from the SQL editor.

## Project structure

```
app/                  Expo Router routes (file-based) — routes are the screens
  onboarding/          First-run intro carousel
  auth/                Phone + OTP sign-in
  (tabs)/              Home, Offer a Ride, Profile
  ride/[id].tsx        Ride details + booking
  my-rides.tsx         Bookings + offered rides, lifecycle actions
  admin/               Role-gated admin dashboard
  verify/              DigiLocker verification gate
src/
  components/          Shared UI (Pill, Avatar, RideCard, brand/*, …)
  config/              Env access, feature flags
  lib/                 Pure helpers (format, geo, confirm, whatsapp, …)
  services/            Supabase-backed data layer (auth, rides, profiles, admin, places)
  store/               Zustand app state (session, profile)
  theme/               Color palette (single source) + shared nav options
  types/               Domain models shared across screens/services
docs/                 ARCHITECTURE.md — conventions, DB invariants, decisions
```

Design detail — conventions, database invariants, the privacy model, and the
decision log — lives in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## License

MIT — see [LICENSE](./LICENSE).
