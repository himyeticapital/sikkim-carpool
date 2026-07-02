import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Pill } from '@/components/Pill';
import { RideMapPreview } from '@/components/RideMapPreview';
import { RouteLines } from '@/components/RouteLines';
import { TimeChips } from '@/components/TimeChips';
import { REQUIRE_RIDER_KYC_BEFORE_BOOKING } from '@/config/flags';
import { haversineKm } from '@/lib/geo';
import { openWhatsAppChat } from '@/lib/whatsapp';
import { createBooking, getDriverContact, getRideById } from '@/services/rides';
import { selectIsVerified, useAppStore } from '@/store/useAppStore';
import { palette } from '@/theme/colors';
import type { DriverContact, RideWithDriver } from '@/types/models';

const ASSUMED_SPEED_KMH = 30;

export default function RideDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const isVerified = useAppStore(selectIsVerified);

  const [ride, setRide] = useState<RideWithDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  // Kept separate from `error`: that one swaps the whole screen for the
  // could-not-load state, which must not happen on a failed booking attempt.
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [contact, setContact] = useState<DriverContact | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getRideById(id);
        setRide(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load this ride.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const trip = useMemo(() => {
    if (!ride?.source_coords || !ride?.destination_coords) return null;
    const km = haversineKm(ride.source_coords, ride.destination_coords);
    const hours = Math.max(1, Math.round(km / ASSUMED_SPEED_KMH));
    return { km: Math.round(km), hours };
  }, [ride]);

  const handleBook = useCallback(async () => {
    if (!ride || !session) return;
    if (REQUIRE_RIDER_KYC_BEFORE_BOOKING && !isVerified) {
      router.push('/verify/digilocker');
      return;
    }
    setBooking(true);
    setBookingError(null);
    try {
      await createBooking(ride.id, session.user.id, 1);
      setBooked(true);
      try {
        setContact(await getDriverContact(ride.id));
      } catch {
        // The seat is booked either way — the screen just omits the WhatsApp
        // button if the contact lookup fails.
      }
    } catch (err) {
      setBookingError(
        err instanceof Error ? err.message : 'Could not book this seat.',
      );
    } finally {
      setBooking(false);
    }
  }, [isVerified, ride, router, session]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color={palette.brand} />
      </View>
    );
  }

  if (error || !ride) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-cream px-8">
        <Text className="font-heading text-lg text-ink">
          {error ?? "This ride isn't available anymore."}
        </Text>
      </View>
    );
  }

  const driverName = ride.driver.full_name ?? 'Driver';
  const vehicleDesc = [ride.driver.vehicle_color, ride.driver.vehicle_make]
    .filter(Boolean)
    .join(' ');
  // The plate is only known post-booking (get_driver_contact).
  const vehicleLine = vehicleDesc
    ? vehicleDesc + (contact?.vehicle_plate ? ` · ${contact.vehicle_plate}` : '')
    : 'Vehicle details not added yet';

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="gap-4 pb-8">
      {ride.source_coords && ride.destination_coords ? (
        <RideMapPreview
          source={ride.source_coords}
          destination={ride.destination_coords}
          sourceLabel={ride.source_text}
          destinationLabel={ride.destination_text}
          trip={trip}
        />
      ) : null}

      <View className="gap-4 px-5">
        <View className="flex-row items-center gap-3 rounded-2xl border border-mountain-mist bg-white p-4">
          <Avatar name={driverName} size="md" />
          <View className="flex-1">
            <Text className="font-heading text-base text-ink">{driverName}</Text>
            <Text className="font-body-regular text-sm text-muted">
              ★ {ride.driver.rating.toFixed(1)} ·{' '}
              {ride.driver.completed_rides_count} rides completed
            </Text>
            <Text className="font-body-regular text-sm text-muted">
              {vehicleLine}
            </Text>
          </View>
          {booked && contact ? (
            <Pressable
              onPress={() => openWhatsAppChat(contact.phone_number)}
              className="h-11 w-11 items-center justify-center rounded-full bg-prayer-green"
            >
              <Text className="text-lg">💬</Text>
            </Pressable>
          ) : null}
        </View>

        <View className="gap-2 rounded-2xl border border-mountain-mist bg-white p-4">
          <Text className="font-heading text-sm uppercase tracking-wide text-muted">
            Trip details
          </Text>
          <RouteLines source={ride.source_text} destination={ride.destination_text} />
          <View className="mt-2">
            <TimeChips departureTime={ride.departure_time}>
              <Pill label={`${ride.seats_available} left`} tone="positive" />
            </TimeChips>
          </View>
        </View>

        {bookingError ? (
          <Text className="text-center text-base text-prayer-red">
            {bookingError}
          </Text>
        ) : null}

        {booked ? (
          <View className="items-center gap-1 rounded-2xl bg-brand-light p-4">
            <Text className="font-heading text-lg text-brand-dark">
              Seat booked!
            </Text>
            <Text className="text-center font-body-regular text-base text-brand-dark">
              {contact
                ? 'Message your driver on WhatsApp above to confirm pickup details.'
                : 'Your seat is confirmed.'}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center justify-between rounded-2xl border border-mountain-mist bg-white p-4">
            <View>
              <Text className="font-body-regular text-sm text-muted">
                Total for 1 seat
              </Text>
              <Text className="font-heading text-xl text-brand-dark">
                ₹{ride.price_per_seat}
              </Text>
            </View>
            <Pressable
              disabled={booking || ride.seats_available < 1}
              onPress={handleBook}
              className={`items-center rounded-full px-8 py-4 ${
                booking || ride.seats_available < 1 ? 'bg-mountain-mist' : 'bg-brand'
              }`}
            >
              {booking ? (
                <ActivityIndicator color={palette.cream} />
              ) : (
                <Text className="font-heading text-lg text-cream">Book Seat</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
