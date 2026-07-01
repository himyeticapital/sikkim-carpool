import { Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import type { LatLng } from '@/types/models';

interface RideMapPreviewProps {
  source: LatLng;
  destination: LatLng;
  sourceLabel: string;
  destinationLabel: string;
  trip: { km: number; hours: number } | null;
}

/** Route preview for Ride Details — iOS/Android only (see the .tsx sibling for web). */
export function RideMapPreview({
  source,
  destination,
  sourceLabel,
  destinationLabel,
  trip,
}: RideMapPreviewProps) {
  return (
    <View className="h-56 w-full overflow-hidden">
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: (source.lat + destination.lat) / 2,
          longitude: (source.lng + destination.lng) / 2,
          latitudeDelta: Math.max(Math.abs(source.lat - destination.lat) * 1.6, 0.05),
          longitudeDelta: Math.max(
            Math.abs(source.lng - destination.lng) * 1.6,
            0.05,
          ),
        }}
      >
        <Marker
          coordinate={{ latitude: source.lat, longitude: source.lng }}
          title={sourceLabel}
          pinColor="#3C8F86"
        />
        <Marker
          coordinate={{ latitude: destination.lat, longitude: destination.lng }}
          title={destinationLabel}
          pinColor="#3A5273"
        />
        <Polyline
          coordinates={[
            { latitude: source.lat, longitude: source.lng },
            { latitude: destination.lat, longitude: destination.lng },
          ]}
          strokeColor="#3C8F86"
          strokeWidth={3}
        />
      </MapView>
      {trip ? (
        <View className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1.5">
          <Text className="font-heading text-sm text-ink">
            {trip.km} km · ~{trip.hours} hrs
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default RideMapPreview;
