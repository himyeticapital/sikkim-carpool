/**
 * Central, typed access to public environment variables.
 *
 * Only EXPO_PUBLIC_* vars are readable in the client bundle — these are NOT
 * secret (they ship in the JS). Server secrets (e.g. DigiLocker client secret)
 * live in Supabase Edge Functions, never here.
 *
 * We read via a helper rather than sprinkling `process.env.X` across the app so
 * a missing key surfaces one clear warning instead of a confusing runtime error
 * deep inside a network call.
 */

function readEnv(key: string): string {
  // process.env.EXPO_PUBLIC_* is statically inlined by the Expo bundler, so we
  // must reference each key literally below rather than dynamically.
  const value = ENV_MAP[key];
  if (!value || value.startsWith('YOUR-') || value.startsWith('your-')) {
    if (__DEV__) {
      console.warn(
        `[env] ${key} is not set (or still a placeholder). ` +
          `Copy .env.example to .env and fill in real values.`,
      );
    }
    return '';
  }
  return value;
}

// Literal references so the Expo bundler can inline them at build time.
const ENV_MAP: Record<string, string | undefined> = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  EXPO_PUBLIC_DIGILOCKER_CLIENT_ID: process.env.EXPO_PUBLIC_DIGILOCKER_CLIENT_ID,
};

export const env = {
  supabaseUrl: readEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  googleMapsApiKey: readEnv('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY'),
  digilockerClientId: readEnv('EXPO_PUBLIC_DIGILOCKER_CLIENT_ID'),
};
