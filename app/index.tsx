import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { hasSeenOnboarding } from '@/services/onboarding';

/**
 * App entry. First launch → /onboarding (once). After that, once the Auth
 * phase lands this will branch on the Supabase session (→ /auth when signed
 * out, → /(tabs)/home when signed in); for Phase 1 we send everyone straight
 * to Home so the tabs are reachable during review.
 */
export default function Index() {
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    hasSeenOnboarding().then(setSeenOnboarding);
  }, []);

  if (seenOnboarding === null) {
    // Brief AsyncStorage read; renders after the splash screen (app/_layout.tsx)
    // has already hidden, so keep this in the app's background color.
    return <View className="flex-1 bg-cream" />;
  }

  return <Redirect href={seenOnboarding ? '/(tabs)/home' : '/onboarding'} />;
}
