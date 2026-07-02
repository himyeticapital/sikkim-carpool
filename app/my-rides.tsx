import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { avatarColorFor, initialsFor } from '@/lib/avatar';
import { formatDate, formatTime } from '@/lib/format';
import {
  cancelBooking,
  getDriverContact,
  getRiderContact,
  listMyBookings,
  listMyRides,
  updateRideStatus,
} from '@/services/rides';
import { useAppStore } from '@/store/useAppStore';
import type {
  BookingWithRide,
  BookingWithRider,
  RideWithBookings,
} from '@/types/models';

type Segment = 'booked' | 'offered';

const PILL_STYLES = {
  green: { bg: 'bg-brand-light', text: 'text-brand-dark' },
  muted: { bg: 'bg-mountain-mist', text: 'text-muted' },
  red: { bg: 'bg-prayer-red/10', text: 'text-prayer-red' },
};

function StatusPill({ label, tone }: { label: string; tone: keyof typeof PILL_STYLES }) {
  const style = PILL_STYLES[tone];
  return (
    <View className={`rounded-full px-3 py-1 ${style.bg}`}>
      <Text className={`font-body text-sm ${style.text}`}>{label}</Text>
    </View>
  );
}

function RouteLines({ source, destination }: { source: string; destination: string }) {
  return (
    <View className="gap-1.5">
      <View className="flex-row items-center gap-2">
        <View className="h-2.5 w-2.5 rounded-full bg-brand" />
        <Text className="flex-1 font-body-regular text-base text-ink" numberOfLines={1}>
          {source}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <View className="h-2.5 w-2.5 bg-mountain-deep" />
        <Text className="flex-1 font-body-regular text-base text-ink" numberOfLines={1}>
          {destination}
        </Text>
      </View>
    </View>
  );
}

function TimeChips({ departureTime }: { departureTime: string }) {
  return (
    <View className="flex-row gap-2">
      <View className="rounded-full bg-cream px-3 py-1">
        <Text className="font-body text-sm text-ink">{formatTime(departureTime)}</Text>
      </View>
      <View className="rounded-full bg-cream px-3 py-1">
        <Text className="font-body text-sm text-ink">{formatDate(departureTime)}</Text>
      </View>
    </View>
  );
}

/** A booking's pill: the ride's fate wins over the booking's own status. */
function bookingPill(booking: BookingWithRide): { label: string; tone: keyof typeof PILL_STYLES } {
  if (booking.status === 'cancelled') return { label: 'Cancelled', tone: 'red' };
  if (booking.ride.status === 'completed') return { label: 'Completed', tone: 'muted' };
  return { label: 'Confirmed', tone: 'green' };
}

function ridePill(status: RideWithBookings['status']): { label: string; tone: keyof typeof PILL_STYLES } {
  if (status === 'active') return { label: 'Active', tone: 'green' };
  if (status === 'completed') return { label: 'Completed', tone: 'muted' };
  return { label: 'Cancelled', tone: 'red' };
}

/**
 * My Rides: the user's bookings as a rider ("Booked") and their posted rides
 * as a driver ("Offered"), with the lifecycle actions each side owns —
 * cancel a booking; complete or cancel a ride. Reached from Profile.
 */
export default function MyRidesScreen() {
  const router = useRouter();
  const session = useAppStore((s) => s.session);

  const [segment, setSegment] = useState<Segment>('booked');
  const [bookings, setBookings] = useState<BookingWithRide[]>([]);
  const [rides, setRides] = useState<RideWithBookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setError(null);
    try {
      const [myBookings, myRides] = await Promise.all([
        listMyBookings(session.user.id),
        listMyRides(session.user.id),
      ]);
      setBookings(myBookings);
      setRides(myRides);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your rides.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMessageDriver = useCallback(async (booking: BookingWithRide) => {
    try {
      const contact = await getDriverContact(booking.ride_id);
      if (!contact) throw new Error('no contact');
      Linking.openURL(`https://wa.me/${contact.phone_number.replace('+', '')}`);
    } catch {
      Alert.alert(
        "Couldn't reach your driver",
        'Their contact details are unavailable right now. Please try again.',
      );
    }
  }, []);

  const handleMessagePassenger = useCallback(async (booking: BookingWithRider) => {
    try {
      const contact = await getRiderContact(booking.id);
      if (!contact) throw new Error('no contact');
      Linking.openURL(`https://wa.me/${contact.phone_number.replace('+', '')}`);
    } catch {
      Alert.alert(
        "Couldn't reach this passenger",
        'Their contact details are unavailable right now. Please try again.',
      );
    }
  }, []);

  const handleCancelBooking = useCallback(
    (booking: BookingWithRide) => {
      Alert.alert('Cancel this booking?', 'Your seat will be released to other riders.', [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: async () => {
            setMutatingId(booking.id);
            try {
              await cancelBooking(booking.id);
              await load();
            } catch {
              Alert.alert("Couldn't cancel", 'Please try again.');
            } finally {
              setMutatingId(null);
            }
          },
        },
      ]);
    },
    [load],
  );

  const handleRideAction = useCallback(
    (ride: RideWithBookings, status: 'completed' | 'cancelled') => {
      const prompts = {
        completed: {
          title: 'Mark this ride as completed?',
          message: 'This finishes the ride for you and your passengers.',
          confirm: 'Mark completed',
        },
        cancelled: {
          title: 'Cancel this ride?',
          message: "All passengers' bookings will be cancelled too.",
          confirm: 'Cancel ride',
        },
      } as const;
      const prompt = prompts[status];
      Alert.alert(prompt.title, prompt.message, [
        { text: 'Go back', style: 'cancel' },
        {
          text: prompt.confirm,
          style: status === 'cancelled' ? 'destructive' : 'default',
          onPress: async () => {
            setMutatingId(ride.id);
            try {
              await updateRideStatus(ride.id, status);
              await load();
            } catch {
              Alert.alert("Couldn't update the ride", 'Please try again.');
            } finally {
              setMutatingId(null);
            }
          },
        },
      ]);
    },
    [load],
  );

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="gap-3 p-5 pb-8">
      <View className="flex-row rounded-full bg-mountain-mist p-1">
        {(
          [
            { key: 'booked', label: 'Booked' },
            { key: 'offered', label: 'Offered' },
          ] as const
        ).map(({ key, label }) => (
          <Pressable
            key={key}
            onPress={() => setSegment(key)}
            className={`flex-1 items-center rounded-full py-2 ${
              segment === key ? 'bg-white' : ''
            }`}
          >
            <Text
              className={`font-heading text-base ${
                segment === key ? 'text-ink' : 'text-muted'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#3C8F86" style={{ paddingVertical: 40 }} />
      ) : error ? (
        <Text className="py-6 text-center text-base text-prayer-red">{error}</Text>
      ) : segment === 'booked' ? (
        bookings.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            body="Find a ride on Home and your bookings will show up here."
          />
        ) : (
          bookings.map((booking) => {
            const driverName = booking.ride.driver.full_name ?? 'Driver';
            const pill = bookingPill(booking);
            const cancellable =
              booking.status === 'confirmed' && booking.ride.status === 'active';
            return (
              <Pressable
                key={booking.id}
                onPress={() => router.push(`/ride/${booking.ride_id}`)}
                className="gap-3 rounded-2xl border border-mountain-mist bg-white p-4 active:bg-brand-light"
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
                      <Text className="font-heading text-base text-ink" numberOfLines={1}>
                        {driverName}
                      </Text>
                      <Text className="font-body-regular text-sm text-muted">
                        {booking.seats_booked} seat
                        {booking.seats_booked === 1 ? '' : 's'} · ₹
                        {booking.ride.price_per_seat} each
                      </Text>
                    </View>
                  </View>
                  <StatusPill label={pill.label} tone={pill.tone} />
                </View>

                <RouteLines
                  source={booking.ride.source_text}
                  destination={booking.ride.destination_text}
                />
                <TimeChips departureTime={booking.ride.departure_time} />

                {booking.status === 'confirmed' ? (
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => handleMessageDriver(booking)}
                      className="flex-1 items-center rounded-full bg-prayer-green px-4 py-2.5"
                    >
                      <Text className="font-heading text-sm text-cream">
                        Message driver
                      </Text>
                    </Pressable>
                    {cancellable ? (
                      <Pressable
                        onPress={() => handleCancelBooking(booking)}
                        disabled={mutatingId === booking.id}
                        className="flex-1 items-center rounded-full bg-prayer-red/10 px-4 py-2.5"
                      >
                        <Text className="font-heading text-sm text-prayer-red">
                          {mutatingId === booking.id ? 'Cancelling…' : 'Cancel booking'}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </Pressable>
            );
          })
        )
      ) : rides.length === 0 ? (
        <EmptyState
          title="No rides offered yet"
          body="Post a ride from the Offer tab and manage it here."
        />
      ) : (
        rides.map((ride) => {
          const pill = ridePill(ride.status);
          const passengers = ride.bookings.filter((b) => b.status === 'confirmed');
          const seatsBooked = ride.seats_total - ride.seats_available;
          return (
            <View
              key={ride.id}
              className="gap-3 rounded-2xl border border-mountain-mist bg-white p-4"
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-heading text-lg text-brand-dark">
                  ₹{ride.price_per_seat}{' '}
                  <Text className="font-body-regular text-xs text-muted">per seat</Text>
                </Text>
                <StatusPill label={pill.label} tone={pill.tone} />
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
                    <View
                      key={b.id}
                      className="flex-row items-center justify-between"
                    >
                      <Text
                        className="flex-1 font-body-regular text-sm text-ink"
                        numberOfLines={1}
                      >
                        {b.rider.full_name ?? 'Rider'} · {b.seats_booked} seat
                        {b.seats_booked === 1 ? '' : 's'}
                      </Text>
                      <Pressable
                        onPress={() => handleMessagePassenger(b)}
                        className="rounded-full bg-prayer-green px-3 py-1"
                      >
                        <Text className="font-heading text-xs text-cream">
                          Message
                        </Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </View>

              {ride.status === 'active' ? (
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handleRideAction(ride, 'completed')}
                    disabled={mutatingId === ride.id}
                    className="flex-1 items-center rounded-full bg-brand px-4 py-2.5"
                  >
                    <Text className="font-heading text-sm text-cream">Mark completed</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRideAction(ride, 'cancelled')}
                    disabled={mutatingId === ride.id}
                    className="flex-1 items-center rounded-full bg-prayer-red/10 px-4 py-2.5"
                  >
                    <Text className="font-heading text-sm text-prayer-red">Cancel ride</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View className="items-center gap-2 py-10">
      <Text className="font-heading text-lg text-ink">{title}</Text>
      <Text className="text-center font-body-regular text-base text-muted">{body}</Text>
    </View>
  );
}
