import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Pill, type PillTone } from '@/components/Pill';
import { PressableScale } from '@/components/PressableScale';
import { RouteLines } from '@/components/RouteLines';
import { TimeChips } from '@/components/TimeChips';
import { confirmAction } from '@/lib/confirm';
import { listAllRides, type AdminRide } from '@/services/admin';
import { updateRideStatus } from '@/services/rides';
import { palette } from '@/theme/colors';
import type { RideStatus } from '@/types/models';

const FILTERS: { key: RideStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_PILL: Record<RideStatus, { label: string; tone: PillTone }> = {
  active: { label: 'Active', tone: 'positive' },
  completed: { label: 'Completed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

/** Admin rides list: every ride by status, with a moderation cancel. */
export default function AdminRidesScreen() {
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
    (ride: AdminRide) =>
      confirmAction({
        title: 'Cancel this ride?',
        message:
          "This is a moderation action: the driver's ride and all its confirmed bookings will be cancelled.",
        confirmLabel: 'Cancel ride',
        destructive: true,
        onConfirm: async () => {
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
      }),
    [load],
  );

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
            {loading ? <ActivityIndicator color={palette.brand} /> : null}
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
            <Card className="gap-3 p-4">
              <View className="flex-row items-center justify-between">
                <Text
                  className="flex-1 font-heading text-base text-ink"
                  numberOfLines={1}
                >
                  {item.driver.full_name ?? 'Driver'}
                </Text>
                <Pill label={pill.label} tone={pill.tone} />
              </View>

              <RouteLines source={item.source_text} destination={item.destination_text} />

              <View className="flex-row items-center justify-between">
                <TimeChips departureTime={item.departure_time} />
                <Text className="font-body text-sm text-muted">
                  ₹{item.price_per_seat} · {bookingsCount} booking
                  {bookingsCount === 1 ? '' : 's'}
                </Text>
              </View>

              {item.status === 'active' ? (
                <PressableScale
                  onPress={() => handleCancelRide(item)}
                  disabled={mutatingId === item.id}
                  className="items-center rounded-full bg-prayer-red/10 px-4 py-2.5"
                >
                  <Text className="font-heading text-sm text-prayer-red">
                    {mutatingId === item.id ? 'Cancelling…' : 'Cancel ride'}
                  </Text>
                </PressableScale>
              ) : null}
            </Card>
          );
        }}
      />
    </View>
  );
}
