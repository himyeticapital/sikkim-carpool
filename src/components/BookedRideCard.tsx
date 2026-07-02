import { Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { PressableCard } from '@/components/Card';
import { Pill, type PillTone } from '@/components/Pill';
import { PressableScale } from '@/components/PressableScale';
import { RouteLines } from '@/components/RouteLines';
import { TimeChips } from '@/components/TimeChips';
import type { BookingWithRide } from '@/types/models';

interface BookedRideCardProps {
  booking: BookingWithRide;
  mutating: boolean;
  onPress: () => void;
  onMessageDriver: () => void;
  onCancel: () => void;
}

/** The booking's pill: the ride's fate wins over the booking's own status. */
function bookingPill(booking: BookingWithRide): { label: string; tone: PillTone } {
  if (booking.status === 'cancelled') return { label: 'Cancelled', tone: 'danger' };
  if (booking.ride.status === 'completed') return { label: 'Completed', tone: 'neutral' };
  return { label: 'Confirmed', tone: 'positive' };
}

/** One booking on My Rides' Booked tab: ride summary + rider-side actions. */
export function BookedRideCard({
  booking,
  mutating,
  onPress,
  onMessageDriver,
  onCancel,
}: BookedRideCardProps) {
  const driverName = booking.ride.driver.full_name ?? 'Driver';
  const pill = bookingPill(booking);
  const cancellable =
    booking.status === 'confirmed' && booking.ride.status === 'active';

  return (
    <PressableCard onPress={onPress} className="gap-3 p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-3">
          <Avatar name={driverName} />
          <View className="flex-1">
            <Text className="font-heading text-base text-ink" numberOfLines={1}>
              {driverName}
            </Text>
            <Text className="font-body-regular text-sm text-muted">
              {booking.seats_booked} seat{booking.seats_booked === 1 ? '' : 's'} · ₹
              {booking.ride.price_per_seat} each
            </Text>
          </View>
        </View>
        <Pill label={pill.label} tone={pill.tone} />
      </View>

      <RouteLines
        source={booking.ride.source_text}
        destination={booking.ride.destination_text}
      />
      <TimeChips departureTime={booking.ride.departure_time} />

      {booking.status === 'confirmed' ? (
        <View className="flex-row gap-2">
          <PressableScale
            onPress={onMessageDriver}
            className="flex-1 items-center rounded-full bg-prayer-green px-4 py-2.5"
          >
            <Text className="font-heading text-sm text-cream">Message driver</Text>
          </PressableScale>
          {cancellable ? (
            <PressableScale
              onPress={onCancel}
              disabled={mutating}
              className="flex-1 items-center rounded-full bg-prayer-red/10 px-4 py-2.5"
            >
              <Text className="font-heading text-sm text-prayer-red">
                {mutating ? 'Cancelling…' : 'Cancel booking'}
              </Text>
            </PressableScale>
          ) : null}
        </View>
      ) : null}
    </PressableCard>
  );
}
