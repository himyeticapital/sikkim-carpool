import { Text, View } from 'react-native';

import type { LatLng } from '@/types/models';

interface RideMapPreviewProps {
  source: LatLng;
  destination: LatLng;
  sourceLabel: string;
  destinationLabel: string;
  trip: { km: number; hours: number } | null;
}

/**
 * Web fallback — react-native-maps has no web implementation, and Metro's
 * platform resolution picks RideMapPreview.native.tsx for iOS/Android instead
 * of this file, so this only ever loads on web.
 */
export function RideMapPreview({
  sourceLabel,
  destinationLabel,
  trip,
}: RideMapPreviewProps) {
  return (
    <View className="h-40 w-full items-center justify-center gap-2 bg-mountain-mist px-6">
      <Text className="text-center font-heading text-base text-ink">
        {sourceLabel} → {destinationLabel}
      </Text>
      {trip ? (
        <Text className="font-body text-sm text-muted">
          {trip.km} km · ~{trip.hours} hrs
        </Text>
      ) : null}
      <Text className="text-center text-xs text-muted">
        Map preview available in the mobile app
      </Text>
    </View>
  );
}

export default RideMapPreview;
