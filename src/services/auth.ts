import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase';
import type { Profile } from '@/types/models';

/** The current session, if any (cold-start bootstrap). */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Subscribes to session changes (token refresh, sign-out elsewhere, …).
 * Returns the unsubscribe function.
 */
export function onSessionChange(
  callback: (session: Session | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => subscription.unsubscribe();
}

/** Sends (or resends) a phone-OTP code via Supabase's phone auth provider. */
export async function requestOtp(phone: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
}

/** Verifies the SMS code and returns the resulting session + user. */
export async function verifyOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  if (error) throw error;
  if (!data.session || !data.user) {
    throw new Error('Verification succeeded but no session was returned.');
  }
  return { session: data.session, user: data.user };
}

/** Ends the Supabase session; callers still reset local store state. */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Looks up the signed-in user's profile row, creating one on first sign-in.
 * `profiles.id` mirrors `auth.users.id` (Supabase convention), so this is a
 * simple lookup-or-insert rather than a generated ID.
 */
export async function fetchOrCreateProfile(
  userId: string,
  phone: string,
): Promise<Profile> {
  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (existing) return existing as Profile;

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({ id: userId, phone_number: phone })
    .select('*')
    .single();
  if (insertError) throw insertError;
  return created as Profile;
}
