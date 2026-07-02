import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { formatDate, formatTime } from '@/lib/format';

interface TimeChipsProps {
  departureTime: string;
  /** Extra chips/pills rendered after the time and date (e.g. seats left). */
  children?: ReactNode;
}

/** Departure time + date as cream chips, wherever a ride's schedule shows. */
export function TimeChips({ departureTime, children }: TimeChipsProps) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="rounded-full bg-cream px-3 py-1">
        <Text className="font-body text-sm text-ink">{formatTime(departureTime)}</Text>
      </View>
      <View className="rounded-full bg-cream px-3 py-1">
        <Text className="font-body text-sm text-ink">{formatDate(departureTime)}</Text>
      </View>
      {children}
    </View>
  );
}
