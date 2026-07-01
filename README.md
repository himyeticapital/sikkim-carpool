# Sikkim Carpool

A carpooling app for Sikkim — riders search for and book seats on rides drivers
are already posting between hill towns; drivers post a route, date, seats, and
price per seat. Built with Expo Router, NativeWind, Supabase, and Google Places.

## Status

Actively in development. All core screens are implemented and typecheck
cleanly, but two backend pieces still need to be configured before the app
works end-to-end (see [Known gaps](#known-gaps) below):

| Screen | Status |
| --- | --- |
| Onboarding | ✅ |
| Auth (phone + OTP) | ✅ |
| Home / Search | ✅ |
| Offer a Ride | ✅ |
| Ride Details + Booking | ✅ |
| Profile | ✅ |
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

## Known gaps

These are backend/dashboard steps this repo can't verify or configure on its
own:

- **Supabase schema**: `profiles`, `rides`, and `bookings` tables (with RLS
  policies) must exist in your Supabase project — see the shapes in
  `src/types/models.ts` and the queries in `src/services/rides.ts`.
- **Phone auth provider**: Supabase's phone-OTP sign-in needs an SMS provider
  (Twilio, MSG91, etc.) configured under Authentication > Providers in the
  Supabase dashboard.

Until both are set up, the Auth, Home, Offer Ride, and Ride Details screens
render correctly but their Supabase calls will error.

## Project structure

```
app/                  Expo Router routes (file-based)
  onboarding/          First-run intro carousel
  auth/                Phone + OTP sign-in
  (tabs)/              Home, Offer a Ride, Profile
  ride/[id].tsx        Ride details + booking
  verify/              DigiLocker verification gate
src/
  components/          Shared UI (PlacesAutocomplete, RideCard, brand/*)
  config/              Env access, feature flags
  services/            Supabase-backed data layer (auth, rides, profiles, places)
  store/               Zustand app state (session, profile)
  types/               Domain models shared across screens/services
```

## License

MIT — see [LICENSE](./LICENSE).
