import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Pill } from '@/components/Pill';
import { RouteLines } from '@/components/RouteLines';
import { TimeChips } from '@/components/TimeChips';
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
          <Avatar name={driverName} />
          <View className="flex-1">
            <Text className="font-heading text-base text-ink" numberOfLines={1}>
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
          <Text className="font-body-regular text-xs text-muted">per seat</Text>
        </View>
      </View>

      <View className="mt-3 pl-1">
        <RouteLines source={ride.source_text} destination={ride.destination_text} />
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <TimeChips departureTime={ride.departure_time} />
        <Pill
          label={`${ride.seats_available} seat${ride.seats_available === 1 ? '' : 's'}`}
          tone={lowSeats ? 'warning' : 'positive'}
        />
      </View>
    </Pressable>
  );
}

export default RideCard;
