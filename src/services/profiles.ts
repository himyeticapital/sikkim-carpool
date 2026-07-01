import { supabase } from '@/services/supabase';
import type { Profile } from '@/types/models';

export async function updateIsDriver(
  userId: string,
  isDriver: boolean,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_driver: isDriver })
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Profile;
}
