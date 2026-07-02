import { Pressable, Text, View } from 'react-native';

import { Pill, type PillTone } from '@/components/Pill';
import { RouteLines } from '@/components/RouteLines';
import { TimeChips } from '@/components/TimeChips';
import type { BookingWithRider, RideStatus, RideWithBookings } from '@/types/models';

interface OfferedRideCardProps {
  ride: RideWithBookings;
  mutating: boolean;
  onMessagePassenger: (booking: BookingWithRider) => void;
  onComplete: () => void;
  onCancel: () => void;
}

const RIDE_PILL: Record<RideStatus, { label: string; tone: PillTone }> = {
  active: { label: 'Active', tone: 'positive' },
  completed: { label: 'Completed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

/** One posted ride on My Rides' Offered tab: passengers + driver-side actions. */
export function OfferedRideCard({
  ride,
  mutating,
  onMessagePassenger,
  onComplete,
  onCancel,
}: OfferedRideCardProps) {
  const pill = RIDE_PILL[ride.status];
  const passengers = ride.bookings.filter((b) => b.status === 'confirmed');
  const seatsBooked = ride.seats_total - ride.seats_available;

  return (
    <View className="gap-3 rounded-2xl border border-mountain-mist bg-white p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-heading text-lg text-brand-dark">
          ₹{ride.price_per_seat}{' '}
          <Text className="font-body-regular text-xs text-muted">per seat</Text>
        </Text>
        <Pill label={pill.label} tone={pill.tone} />
      </View>

      <RouteLines source={ride.source_text} destination={ride.destination_text} />

      <View className="flex-row items-center justify-between">
        <TimeChips departureTime={ride.departure_time} />
        <Text className="font-body text-sm text-muted">
          {seatsBooked}/{ride.seats_total} booked
        </Text>
      </View>

      <View className="gap-1 rounded-xl bg-cream p-3">
        <Text className="font-body text-sm text-ink">Passengers</Text>
        {passengers.length === 0 ? (
          <Text className="font-body-regular text-sm text-muted">
            No bookings yet.
          </Text>
        ) : (
          passengers.map((b) => (
            <View key={b.id} className="flex-row items-center justify-between">
              <Text
                className="flex-1 font-body-regular text-sm text-ink"
                numberOfLines={1}
              >
                {b.rider.full_name ?? 'Rider'} · {b.seats_booked} seat
                {b.seats_booked === 1 ? '' : 's'}
              </Text>
              <Pressable
                onPress={() => onMessagePassenger(b)}
                className="rounded-full bg-prayer-green px-3 py-1"
              >
                <Text className="font-heading text-xs text-cream">Message</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      {ride.status === 'active' ? (
        <View className="flex-row gap-2">
          <Pressable
            onPress={onComplete}
            disabled={mutating}
            className="flex-1 items-center rounded-full bg-brand px-4 py-2.5"
          >
            <Text className="font-heading text-sm text-cream">Mark completed</Text>
          </Pressable>
          <Pressable
            onPress={onCancel}
            disabled={mutating}
            className="flex-1 items-center rounded-full bg-prayer-red/10 px-4 py-2.5"
          >
            <Text className="font-heading text-sm text-prayer-red">Cancel ride</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
