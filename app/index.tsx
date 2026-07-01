import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { hasSeenOnboarding } from '@/services/onboarding';
import { useAppStore } from '@/store/useAppStore';

/**
 * App entry. First launch → /onboarding (once). After that, branches on the
 * Supabase session bootstrapped in app/_layout.tsx: signed out → /auth,
 * signed in → /(tabs)/home.
 */
export default function Index() {
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);
  const session = useAppStore((s) => s.session);
  const initializing = useAppStore((s) => s.initializing);

  useEffect(() => {
    hasSeenOnboarding().then(setSeenOnboarding);
  }, []);

  if (seenOnboarding === null || initializing) {
    // Brief AsyncStorage/session read; renders after the splash screen
    // (app/_layout.tsx) has already hidden, so keep this in the app's
    // background color.
    return <View className="flex-1 bg-cream" />;
  }

  if (!seenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href={session ? '/(tabs)/home' : '/auth'} />;
}
