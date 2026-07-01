import { Pressable, Text, View } from 'react-native';

import { avatarColorFor, initialsFor } from '@/lib/avatar';
import { formatDate, formatTime } from '@/lib/format';
import type { RideWithDriver } from '@/types/models';

interface RideCardProps {
  ride: RideWithDriver;
  onPress: () => void;
}

/** A single ride result on Home — driver, price, route, and seats-left. */
export function RideCard({ ride, onPress }: RideCardProps) {
  const driverName = ride.driver.full_name ?? 'Driver';
  const lowSeats = ride.seats_available <= 1;

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-mountain-mist bg-white p-4 active:bg-brand-light"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-3">
          <View
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: avatarColorFor(driverName) }}
          >
            <Text className="font-heading text-base text-cream">
              {initialsFor(driverName)}
            </Text>
          </View>
          <View className="flex-1">
            <Text
              className="font-heading text-base text-ink"
              numberOfLines={1}
            >
              {driverName}
            </Text>
            <Text className="font-body-regular text-sm text-muted">
              ★ {ride.driver.rating.toFixed(1)} ({ride.driver.completed_rides_count}{' '}
              rides)
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="font-heading text-lg text-brand-dark">
            ₹{ride.price_per_seat}
          </Text>
          <Text className="font-body-regular text-xs text-muted">
            per seat
          </Text>
        </View>
      </View>

      <View className="mt-3 gap-1.5 pl-1">
        <View className="flex-row items-center gap-2">
          <View className="h-2.5 w-2.5 rounded-full bg-brand" />
          <Text className="font-body-regular text-base text-ink" numberOfLines={1}>
            {ride.source_text}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="h-2.5 w-2.5 bg-mountain-deep" />
          <Text className="font-body-regular text-base text-ink" numberOfLines={1}>
            {ride.destination_text}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row gap-2">
          <View className="rounded-full bg-cream px-3 py-1">
            <Text className="font-body text-sm text-ink">
              {formatTime(ride.departure_time)}
            </Text>
          </View>
          <View className="rounded-full bg-cream px-3 py-1">
            <Text className="font-body text-sm text-ink">
              {formatDate(ride.departure_time)}
            </Text>
          </View>
        </View>
        <View
          className={`rounded-full px-3 py-1 ${
            lowSeats ? 'bg-sunset/20' : 'bg-brand-light'
          }`}
        >
          <Text
            className={`font-body text-sm ${
              lowSeats ? 'text-sunset' : 'text-brand-dark'
            }`}
          >
            {ride.seats_available} seat{ride.seats_available === 1 ? '' : 's'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default RideCard;
