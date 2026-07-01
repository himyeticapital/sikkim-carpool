import { supabase } from '@/services/supabase';
import type { Profile } from '@/types/models';

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
