import '../global.css';

import {
  Baloo2_400Regular,
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  useFonts,
} from '@expo-google-fonts/baloo-2';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  fetchOrCreateProfile,
  getSession,
  onSessionChange,
} from '@/services/auth';
import { useAppStore } from '@/store/useAppStore';
import { stackScreenOptions } from '@/theme/navigation';

// Keep the native splash up until Baloo 2 finishes loading, so headings never
// flash in the system font before swapping to the app's display face.
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Root layout. Wraps the whole app in the providers Expo Router / gesture
 * handling need, and declares the top-level navigation stack.
 *
 * The tab navigator, ride details, verification, and auth screens are all
 * pushed on top of this stack. The actual redirect to /auth when signed out
 * happens in app/index.tsx, driven by the session this layout bootstraps
 * below.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Baloo2_400Regular,
    Baloo2_500Medium,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
  });
  const setSession = useAppStore((s) => s.setSession);
  const setProfile = useAppStore((s) => s.setProfile);
  const setInitializing = useAppStore((s) => s.setInitializing);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Bootstrap the auth session on cold start, then keep it in sync (token
  // refresh, sign-out from another device, etc.) for as long as the app runs.
  useEffect(() => {
    getSession().then(async (session) => {
      setSession(session);
      if (session) {
        try {
          const profile = await fetchOrCreateProfile(
            session.user.id,
            session.user.phone ?? '',
          );
          setProfile(profile);
        } catch {
          // Profile lookup failed (e.g. offline) — session still stands, retry later.
        }
      }
      setInitializing(false);
    });

    return onSessionChange((session) => {
      setSession(session);
      if (!session) setProfile(null);
    });
  }, [setInitializing, setProfile, setSession]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={stackScreenOptions}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding/index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/index" options={{ presentation: 'modal' }} />
          <Stack.Screen
            name="ride/[id]"
            options={{ headerShown: true, title: 'Ride details' }}
          />
          <Stack.Screen
            name="my-rides"
            options={{ headerShown: true, title: 'My Rides' }}
          />
          {/* Screens and role gate live in app/admin/_layout.tsx. */}
          <Stack.Screen name="admin" />
          <Stack.Screen
            name="verify/digilocker"
            options={{ headerShown: true, title: 'Verify your identity' }}
          />
          <Stack.Screen
            name="verify/pending"
            options={{ headerShown: true, title: 'Verifying…' }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
