import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { env } from '@/config/env';

/**
 * Supabase client, shared across the app.
 *
 * - Auth sessions persist in AsyncStorage so the user stays logged in across
 *   app restarts (phone-OTP signup happens in the Auth phase).
 * - `detectSessionInUrl` is false: there's no browser URL to parse in a native
 *   app; OAuth-style redirects (e.g. DigiLocker) are handled via deep links in
 *   the verification phase, not here.
 * - `react-native-url-polyfill/auto` is imported first because supabase-js relies
 *   on the WHATWG URL API, which React Native does not fully implement natively.
 * - Falls back to a placeholder URL/key when `.env` isn't configured yet, so
 *   `createClient` doesn't throw at import time and crash the whole app before
 *   a single screen renders. Real calls will still fail (network/auth error,
 *   caught by each screen) until real credentials are set — see env.ts's
 *   console warning for which vars are missing.
 */
export const supabase = createClient(
  env.supabaseUrl || 'https://placeholder.supabase.co',
  env.supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
