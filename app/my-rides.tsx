import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text } from 'react-native';

import { BookedRideCard } from '@/components/BookedRideCard';
import { EmptyState } from '@/components/EmptyState';
import { OfferedRideCard } from '@/components/OfferedRideCard';
import { SegmentedControl } from '@/components/SegmentedControl';
import { confirmAction } from '@/lib/confirm';
import { openWhatsAppChat } from '@/lib/whatsapp';
import {
  cancelBooking,
  getDriverContact,
  getRiderContact,
  listMyBookings,
  listMyRides,
  updateRideStatus,
} from '@/services/rides';
import { useAppStore } from '@/store/useAppStore';
import { palette } from '@/theme/colors';
import type { BookingWithRide, BookingWithRider, RideWithBookings } from '@/types/models';

const SEGMENTS = [
  { key: 'booked', label: 'Booked' },
  { key: 'offered', label: 'Offered' },
] as const;
type Segment = (typeof SEGMENTS)[number]['key'];

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

  /** Runs a mutation with per-card busy state, then reloads both lists. */
  const runMutation = useCallback(
    async (id: string, mutate: () => Promise<unknown>, failTitle: string) => {
      setMutatingId(id);
      try {
        await mutate();
        await load();
      } catch {
        Alert.alert(failTitle, 'Please try again.');
      } finally {
        setMutatingId(null);
      }
    },
    [load],
  );

  const handleMessageDriver = useCallback(async (booking: BookingWithRide) => {
    try {
      const contact = await getDriverContact(booking.ride_id);
      if (!contact) throw new Error('no contact');
      openWhatsAppChat(contact.phone_number);
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
      openWhatsAppChat(contact.phone_number);
    } catch {
      Alert.alert(
        "Couldn't reach this passenger",
        'Their contact details are unavailable right now. Please try again.',
      );
    }
  }, []);

  const handleCancelBooking = useCallback(
    (booking: BookingWithRide) =>
      confirmAction({
        title: 'Cancel this booking?',
        message: 'Your seat will be released to other riders.',
        confirmLabel: 'Cancel booking',
        cancelLabel: 'Keep it',
        destructive: true,
        onConfirm: () =>
          runMutation(booking.id, () => cancelBooking(booking.id), "Couldn't cancel"),
      }),
    [runMutation],
  );

  const handleCompleteRide = useCallback(
    (ride: RideWithBookings) =>
      confirmAction({
        title: 'Mark this ride as completed?',
        message: 'This finishes the ride for you and your passengers.',
        confirmLabel: 'Mark completed',
        onConfirm: () =>
          runMutation(
            ride.id,
            () => updateRideStatus(ride.id, 'completed'),
            "Couldn't update the ride",
          ),
      }),
    [runMutation],
  );

  const handleCancelRide = useCallback(
    (ride: RideWithBookings) =>
      confirmAction({
        title: 'Cancel this ride?',
        message: "All passengers' bookings will be cancelled too.",
        confirmLabel: 'Cancel ride',
        destructive: true,
        onConfirm: () =>
          runMutation(
            ride.id,
            () => updateRideStatus(ride.id, 'cancelled'),
            "Couldn't update the ride",
          ),
      }),
    [runMutation],
  );

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="gap-3 p-5 pb-8">
      <SegmentedControl options={SEGMENTS} value={segment} onChange={setSegment} />

      {loading ? (
        <ActivityIndicator color={palette.brand} style={{ paddingVertical: 40 }} />
      ) : error ? (
        <Text className="py-6 text-center text-base text-prayer-red">{error}</Text>
      ) : segment === 'booked' ? (
        bookings.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            body="Find a ride on Home and your bookings will show up here."
          />
        ) : (
          bookings.map((booking) => (
            <BookedRideCard
              key={booking.id}
              booking={booking}
              mutating={mutatingId === booking.id}
              onPress={() => router.push(`/ride/${booking.ride_id}`)}
              onMessageDriver={() => handleMessageDriver(booking)}
              onCancel={() => handleCancelBooking(booking)}
            />
          ))
        )
      ) : rides.length === 0 ? (
        <EmptyState
          title="No rides offered yet"
          body="Post a ride from the Offer tab and manage it here."
        />
      ) : (
        rides.map((ride) => (
          <OfferedRideCard
            key={ride.id}
            ride={ride}
            mutating={mutatingId === ride.id}
            onMessagePassenger={handleMessagePassenger}
            onComplete={() => handleCompleteRide(ride)}
            onCancel={() => handleCancelRide(ride)}
          />
        ))
      )}
    </ScrollView>
  );
}
