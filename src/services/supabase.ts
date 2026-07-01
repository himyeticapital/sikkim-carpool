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
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
