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

import { fetchOrCreateProfile } from '@/services/auth';
import { supabase } from '@/services/supabase';
import { useAppStore } from '@/store/useAppStore';

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
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        try {
          const profile = await fetchOrCreateProfile(
            data.session.user.id,
            data.session.user.phone ?? '',
          );
          setProfile(profile);
        } catch {
          // Profile lookup failed (e.g. offline) — session still stands, retry later.
        }
      }
      setInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [setInitializing, setProfile, setSession]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: '#FBF6EC' },
            headerTitleStyle: { fontFamily: 'Baloo2_600SemiBold', fontSize: 18 },
            headerTintColor: '#3B2E2A',
          }}
        >
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
