import { Text, View } from 'react-native';

import { avatarColorFor, initialsFor } from '@/lib/avatar';

const SIZES = {
  sm: { circle: 'h-11 w-11', text: 'text-base' },
  md: { circle: 'h-14 w-14', text: 'text-lg' },
  lg: { circle: 'h-20 w-20', text: 'text-2xl' },
} as const;

interface AvatarProps {
  /** Display name; drives both the initials and the background color. */
  name: string;
  size?: keyof typeof SIZES;
}

/** Initials on a color derived from the name — the app has no photo uploads. */
export function Avatar({ name, size = 'sm' }: AvatarProps) {
  const s = SIZES[size];
  return (
    <View
      className={`items-center justify-center rounded-full ${s.circle}`}
      style={{ backgroundColor: avatarColorFor(name) }}
    >
      <Text className={`font-heading text-cream ${s.text}`}>
        {initialsFor(name)}
      </Text>
    </View>
  );
}
