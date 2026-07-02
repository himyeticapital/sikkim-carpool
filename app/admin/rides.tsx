import { Redirect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';

import { formatDate, formatTime } from '@/lib/format';
import { listAllRides, type AdminRide } from '@/services/admin';
import { updateRideStatus } from '@/services/rides';
import { useAppStore } from '@/store/useAppStore';
import type { RideStatus } from '@/types/models';

const FILTERS: { key: RideStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_PILL: Record<RideStatus, { label: string; bg: string; text: string }> = {
  active: { label: 'Active', bg: 'bg-brand-light', text: 'text-brand-dark' },
  completed: { label: 'Completed', bg: 'bg-mountain-mist', text: 'text-muted' },
  cancelled: { label: 'Cancelled', bg: 'bg-prayer-red/10', text: 'text-prayer-red' },
};

/** Admin rides list: every ride by status, with a moderation cancel. */
export default function AdminRidesScreen() {
  const profile = useAppStore((s) => s.profile);
  const initializing = useAppStore((s) => s.initializing);

  const [filter, setFilter] = useState<RideStatus | 'all'>('all');
  const [rides, setRides] = useState<AdminRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRides(await listAllRides(filter === 'all' ? undefined : filter));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load rides.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const handleCancelRide = useCallback(
    (ride: AdminRide) => {
      Alert.alert(
        'Cancel this ride?',
        "This is a moderation action: the driver's ride and all its confirmed bookings will be cancelled.",
        [
          { text: 'Go back', style: 'cancel' },
          {
            text: 'Cancel ride',
            style: 'destructive',
            onPress: async () => {
              setMutatingId(ride.id);
              try {
                await updateRideStatus(ride.id, 'cancelled');
                await load();
              } catch (err) {
                Alert.alert(
                  "Couldn't cancel the ride",
                  err instanceof Error ? err.message : 'Please try again.',
                );
              } finally {
                setMutatingId(null);
              }
            },
          },
        ],
      );
    },
    [load],
  );

  if (!initializing && profile?.role !== 'admin') {
    return <Redirect href="/home" />;
  }

  return (
    <View className="flex-1 bg-cream">
      <FlatList
        data={rides}
        keyExtractor={(r) => r.id}
        contentContainerClassName="gap-3 p-5 pb-8"
        ListHeaderComponent={
          <View className="gap-3 pb-1">
            <View className="flex-row gap-2">
              {FILTERS.map(({ key, label }) => (
                <Pressable
                  key={key}
                  onPress={() => setFilter(key)}
                  className={`rounded-full px-4 py-2 ${
                    filter === key ? 'bg-brand' : 'bg-white'
                  }`}
                >
                  <Text
                    className={`font-body text-sm ${
                      filter === key ? 'text-cream' : 'text-ink'
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {loading ? <ActivityIndicator color="#3C8F86" /> : null}
            {error ? (
              <Text className="text-center text-base text-prayer-red">{error}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <Text className="py-10 text-center font-body-regular text-base text-muted">
              No rides with this status.
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const pill = STATUS_PILL[item.status];
          const bookingsCount = item.bookings[0]?.count ?? 0;
          return (
            <View className="gap-3 rounded-2xl border border-mountain-mist bg-white p-4">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 font-heading text-base text-ink" numberOfLines={1}>
                  {item.driver.full_name ?? 'Driver'}
                </Text>
                <View className={`rounded-full px-3 py-1 ${pill.bg}`}>
                  <Text className={`font-body text-sm ${pill.text}`}>{pill.label}</Text>
                </View>
              </View>

              <View className="gap-1.5">
                <View className="flex-row items-center gap-2">
                  <View className="h-2.5 w-2.5 rounded-full bg-brand" />
                  <Text className="flex-1 font-body-regular text-base text-ink" numberOfLines={1}>
                    {item.source_text}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="h-2.5 w-2.5 bg-mountain-deep" />
                  <Text className="flex-1 font-body-regular text-base text-ink" numberOfLines={1}>
                    {item.destination_text}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row gap-2">
                  <View className="rounded-full bg-cream px-3 py-1">
                    <Text className="font-body text-sm text-ink">
                      {formatTime(item.departure_time)}
                    </Text>
                  </View>
                  <View className="rounded-full bg-cream px-3 py-1">
                    <Text className="font-body text-sm text-ink">
                      {formatDate(item.departure_time)}
                    </Text>
                  </View>
                </View>
                <Text className="font-body text-sm text-muted">
                  ₹{item.price_per_seat} · {bookingsCount} booking
                  {bookingsCount === 1 ? '' : 's'}
                </Text>
              </View>

              {item.status === 'active' ? (
                <Pressable
                  onPress={() => handleCancelRide(item)}
                  disabled={mutatingId === item.id}
                  className="items-center rounded-full bg-prayer-red/10 px-4 py-2.5"
                >
                  <Text className="font-heading text-sm text-prayer-red">
                    {mutatingId === item.id ? 'Cancelling…' : 'Cancel ride'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
}
