import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';

import { AnimatedView } from '@/components/animated';
import { EmptyState } from '@/components/EmptyState';
import { PlacesAutocomplete } from '@/components/PlacesAutocomplete';
import { RideCard } from '@/components/RideCard';
import { RideCardSkeleton } from '@/components/Skeleton';
import { PrayerFlagGarland } from '@/components/brand/PrayerFlagGarland';
import { formatShortDate, isToday, toLocalDateKey } from '@/lib/format';
import { fetchReverseGeocode } from '@/services/places';
import { listRides } from '@/services/rides';
import { useAppStore } from '@/store/useAppStore';
import { palette } from '@/theme/colors';
import { staggerDelay } from '@/theme/motion';
import type { PlaceSelection, RideWithDriver } from '@/types/models';

/** "Good morning" / "Good afternoon" / "Good evening" by device clock. */
function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Home / Search: a search card (current location → destination + date) above
 * a list of matching rides. Matching is a simple destination-text +
 * calendar-day filter (see src/services/rides.ts) — no route-graph pathing,
 * carpool matches don't need it.
 */
export default function HomeScreen() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);

  const [origin, setOrigin] = useState<PlaceSelection | null>(null);
  const [originLoading, setOriginLoading] = useState(true);
  const [destination, setDestination] = useState<PlaceSelection | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [rides, setRides] = useState<RideWithDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const position = await Location.getCurrentPositionAsync({});
        const place = await fetchReverseGeocode(
          position.coords.latitude,
          position.coords.longitude,
        );
        setOrigin(place);
      } catch {
        // Leave origin unset — the search card still works without it.
      } finally {
        setOriginLoading(false);
      }
    })();
  }, []);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await listRides({
        destinationText: destination?.description,
        departureDate: toLocalDateKey(selectedDate),
      });
      setRides(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load rides.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [destination, selectedDate]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  const greetingName = profile?.full_name?.split(' ')[0] ?? 'there';
  const greeting = greetingFor(new Date().getHours());

  return (
    <View className="flex-1 bg-cream">
      <View className="px-5 pt-2">
        <PrayerFlagGarland flagCount={9} height={32} />
      </View>

      <FlatList
        data={loading ? [] : rides}
        keyExtractor={(r) => r.id}
        contentContainerClassName="gap-3 px-5 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              runSearch();
            }}
            tintColor={palette.brand}
          />
        }
        renderItem={({ item, index }) => (
          <AnimatedView entering={FadeInDown.duration(320).delay(staggerDelay(index))}>
            <RideCard
              ride={item}
              onPress={() => router.push(`/ride/${item.id}`)}
            />
          </AnimatedView>
        )}
        ListHeaderComponent={
          <View className="gap-4 pb-4 pt-2">
            <Text className="font-display text-2xl text-ink">
              {greeting}, {greetingName}
            </Text>

            <View className="gap-3 rounded-3xl bg-brand p-5">
              <Text className="font-heading text-lg text-cream">
                Where are you going?
              </Text>

              <View className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-3">
                <View className="flex-1 flex-row items-center gap-2">
                  <View className="h-2.5 w-2.5 rounded-full bg-brand" />
                  <Text
                    className="flex-1 font-body-regular text-base text-ink"
                    numberOfLines={1}
                  >
                    {originLoading
                      ? 'Finding your location…'
                      : (origin?.description ?? 'Set your starting point')}
                  </Text>
                </View>
                {origin ? (
                  <View className="rounded-full bg-brand-light px-2 py-0.5">
                    <Text className="font-body text-xs text-brand-dark">
                      Current
                    </Text>
                  </View>
                ) : null}
              </View>

              <PlacesAutocomplete
                value={destination?.description}
                onSelect={setDestination}
                onChangeText={(t) => {
                  if (!t) setDestination(null);
                }}
                placeholder="Enter destination…"
              />

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  className="rounded-full bg-white px-4 py-2"
                >
                  <Text className="font-body text-sm text-ink">
                    {isToday(selectedDate) ? 'Today' : formatShortDate(selectedDate)}
                  </Text>
                </Pressable>
                <View className="rounded-full bg-white px-4 py-2">
                  <Text className="font-body text-sm text-ink">Now</Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="font-heading text-lg text-ink">
                Available rides
              </Text>
              <View className="rounded-full bg-brand-light px-3 py-1">
                <Text className="font-body text-sm text-brand-dark">
                  {rides.length} found
                </Text>
              </View>
            </View>

            {loading ? (
              <View className="gap-3">
                <RideCardSkeleton />
                <RideCardSkeleton />
              </View>
            ) : null}
            {error ? (
              <Text className="text-base text-prayer-red">{error}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <EmptyState
              title="No rides yet on this route"
              body="Try a different date, or check back soon — new rides are posted throughout the day."
            />
          ) : null
        }
      />

      {showDatePicker ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          minimumDate={new Date()}
          onChange={(_event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      ) : null}
    </View>
  );
}
