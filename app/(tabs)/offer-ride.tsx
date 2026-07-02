import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PlacesAutocomplete } from '@/components/PlacesAutocomplete';
import { REQUIRE_DRIVER_KYC_BEFORE_POSTING } from '@/config/flags';
import { haversineKm } from '@/lib/geo';
import { fetchReverseGeocode } from '@/services/places';
import { createRide } from '@/services/rides';
import { selectIsVerified, useAppStore } from '@/store/useAppStore';
import { palette } from '@/theme/colors';
import type { PlaceSelection } from '@/types/models';

const SEAT_OPTIONS = [1, 2, 3, 4];
const SUGGESTED_RATE_PER_KM = 7;

/**
 * Driver-facing form to post a ride. Origin/destination reuse the shared
 * PlacesAutocomplete component; the "~₹/km" hint is a plain haversine
 * distance, not a routed-driving distance — good enough for a price nudge.
 */
export default function OfferRideScreen() {
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const isVerified = useAppStore(selectIsVerified);

  const [origin, setOrigin] = useState<PlaceSelection | null>(null);
  const [destination, setDestination] = useState<PlaceSelection | null>(null);
  const [departureAt, setDepartureAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [seats, setSeats] = useState(2);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSwap = useCallback(() => {
    setOrigin(destination);
    setDestination(origin);
  }, [destination, origin]);

  const handleUseCurrentLocationForOrigin = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const position = await Location.getCurrentPositionAsync({});
      const place = await fetchReverseGeocode(
        position.coords.latitude,
        position.coords.longitude,
      );
      setOrigin(place);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not resolve your location.',
      );
    }
  }, []);

  const suggestedRateHint = useMemo(() => {
    if (!origin || !destination) return null;
    const km = haversineKm(
      { lat: origin.lat, lng: origin.lng },
      { lat: destination.lat, lng: destination.lng },
    );
    return `~${Math.round(km)} km · ₹${SUGGESTED_RATE_PER_KM}/km ≈ ₹${Math.round(
      km * SUGGESTED_RATE_PER_KM,
    )}`;
  }, [origin, destination]);

  const canSubmit =
    Boolean(origin) &&
    Boolean(destination) &&
    Number(price) > 0 &&
    !loading &&
    Boolean(session);

  const needsKycFirst = REQUIRE_DRIVER_KYC_BEFORE_POSTING && !isVerified;

  const handleSubmit = useCallback(async () => {
    if (!origin || !destination || !session) return;
    setError(null);
    setLoading(true);
    try {
      const ride = await createRide({
        driver_id: session.user.id,
        source_text: origin.description,
        destination_text: destination.description,
        source_coords: { lat: origin.lat, lng: origin.lng },
        destination_coords: { lat: destination.lat, lng: destination.lng },
        departure_time: departureAt.toISOString(),
        seats_total: seats,
        price_per_seat: Number(price),
      });
      router.replace(`/ride/${ride.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not post this ride. Try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [departureAt, destination, origin, price, router, seats, session]);

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="gap-6 p-5">
      <View className="gap-3">
        <Text className="font-heading text-sm uppercase tracking-wide text-muted">
          Route
        </Text>
        <PlacesAutocomplete
          value={origin?.description}
          onSelect={setOrigin}
          onChangeText={(t) => {
            if (!t) setOrigin(null);
          }}
          onUseCurrentLocation={handleUseCurrentLocationForOrigin}
          placeholder="Pickup location"
        />
        <Pressable
          onPress={handleSwap}
          className="self-end rounded-full bg-brand-light px-4 py-2"
        >
          <Text className="font-heading text-sm text-brand-dark">⇅ Swap</Text>
        </Pressable>
        <PlacesAutocomplete
          value={destination?.description}
          onSelect={setDestination}
          onChangeText={(t) => {
            if (!t) setDestination(null);
          }}
          placeholder="Drop-off location"
        />
      </View>

      <View className="gap-3">
        <Text className="font-heading text-sm uppercase tracking-wide text-muted">
          Date &amp; time
        </Text>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="flex-1 rounded-2xl border-2 border-brand-light bg-white px-4 py-4"
          >
            <Text className="font-body text-base text-ink">
              {departureAt.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowTimePicker(true)}
            className="flex-1 rounded-2xl border-2 border-brand-light bg-white px-4 py-4"
          >
            <Text className="font-body text-base text-ink">
              {departureAt.toLocaleTimeString('en-IN', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="gap-3">
        <Text className="font-heading text-sm uppercase tracking-wide text-muted">
          Available seats
        </Text>
        <View className="flex-row gap-3">
          {SEAT_OPTIONS.map((n) => (
            <Pressable
              key={n}
              onPress={() => setSeats(n)}
              className={`h-14 w-14 items-center justify-center rounded-2xl border-2 ${
                seats === n
                  ? 'border-brand bg-brand-light'
                  : 'border-brand-light bg-white'
              }`}
            >
              <Text className="font-heading text-lg text-ink">{n}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-3">
        <Text className="font-heading text-sm uppercase tracking-wide text-muted">
          Price per seat
        </Text>
        <View className="flex-row items-center gap-3 rounded-2xl border-2 border-brand-light bg-white px-4">
          <Text className="font-heading text-lg text-ink">₹</Text>
          <TextInput
            className="flex-1 py-4 text-lg text-ink"
            keyboardType="number-pad"
            value={price}
            onChangeText={(t) => setPrice(t.replace(/\D/g, ''))}
            placeholder="350"
            placeholderTextColor={palette.muted}
          />
          {suggestedRateHint ? (
            <Text className="text-sm text-muted">{suggestedRateHint}</Text>
          ) : null}
        </View>
      </View>

      {needsKycFirst ? (
        <Text className="text-center text-base text-prayer-red">
          Verify your ID before posting a ride —{' '}
          <Text
            className="font-heading text-brand-dark"
            onPress={() => router.push('/verify/digilocker')}
          >
            start verification
          </Text>
          .
        </Text>
      ) : null}

      {error ? (
        <Text className="text-center text-base text-prayer-red">{error}</Text>
      ) : null}

      <Pressable
        disabled={!canSubmit || needsKycFirst}
        onPress={handleSubmit}
        className={`items-center rounded-full px-8 py-4 ${
          canSubmit && !needsKycFirst ? 'bg-brand' : 'bg-mountain-mist'
        }`}
      >
        {loading ? (
          <ActivityIndicator color={palette.cream} />
        ) : (
          <Text className="font-heading text-lg text-cream">Post Ride</Text>
        )}
      </Pressable>

      {showDatePicker ? (
        <DateTimePicker
          value={departureAt}
          mode="date"
          minimumDate={new Date()}
          onChange={(_event, date) => {
            setShowDatePicker(false);
            if (date) {
              setDepartureAt(
                new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate(),
                  departureAt.getHours(),
                  departureAt.getMinutes(),
                ),
              );
            }
          }}
        />
      ) : null}

      {showTimePicker ? (
        <DateTimePicker
          value={departureAt}
          mode="time"
          onChange={(_event, time) => {
            setShowTimePicker(false);
            if (time) {
              setDepartureAt(
                new Date(
                  departureAt.getFullYear(),
                  departureAt.getMonth(),
                  departureAt.getDate(),
                  time.getHours(),
                  time.getMinutes(),
                ),
              );
            }
          }}
        />
      ) : null}
    </ScrollView>
  );
}
