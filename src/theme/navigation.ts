import { palette } from '@/theme/colors';

/**
 * Header styling shared by every Stack in the app (root layout and nested
 * layouts like app/admin/_layout.tsx), so pushed screens all get the same
 * cream header with Baloo type. Screens opt in with `headerShown: true`.
 */
export const stackScreenOptions = {
  headerShown: false,
  headerStyle: { backgroundColor: palette.cream },
  headerTitleStyle: { fontFamily: 'Baloo2_600SemiBold', fontSize: 18 },
  headerTintColor: palette.ink,
} as const;
