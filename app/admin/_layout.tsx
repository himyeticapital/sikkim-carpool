import { Redirect, Stack } from 'expo-router';

import { useAppStore } from '@/store/useAppStore';
import { stackScreenOptions } from '@/theme/navigation';

/**
 * Layout for the whole /admin section: one role gate for every screen under
 * it. Server-side RLS is the real gate; this just keeps non-admins out of
 * screens that would only show them errors.
 */
export default function AdminLayout() {
  const profile = useAppStore((s) => s.profile);
  const initializing = useAppStore((s) => s.initializing);

  if (!initializing && profile?.role !== 'admin') {
    return <Redirect href="/home" />;
  }

  return (
    <Stack screenOptions={{ ...stackScreenOptions, headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Admin' }} />
      <Stack.Screen name="users" options={{ title: 'Users' }} />
      <Stack.Screen name="rides" options={{ title: 'Rides' }} />
    </Stack>
  );
}
