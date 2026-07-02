import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';

import { AnimatedView } from '@/components/animated';
import { Card, PressableCard } from '@/components/Card';
import { getAdminStats, type AdminStats } from '@/services/admin';
import { palette } from '@/theme/colors';
import { staggerDelay } from '@/theme/motion';

/**
 * One headline number. Per the stat-tile contract: sentence-case muted label,
 * value in the ink text token (identity/state never rides on the value's
 * color), semibold sans. `index` cascades the entrance across the grid.
 */
function StatTile({ label, value, index }: { label: string; value: string; index: number }) {
  return (
    <AnimatedView
      className="min-w-[45%] flex-1"
      entering={FadeInDown.duration(300).delay(staggerDelay(index, 45))}
    >
      <Card className="gap-0.5 p-4">
        <Text className="font-body-regular text-sm text-muted">{label}</Text>
        <Text className="font-heading text-2xl text-ink">{value}</Text>
      </Card>
    </AnimatedView>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text className="mt-2 font-heading text-base text-ink">{children}</Text>;
}

function ManageLink({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <PressableCard
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-4"
    >
      <View>
        <Text className="font-heading text-base text-ink">{title}</Text>
        <Text className="font-body-regular text-sm text-muted">{subtitle}</Text>
      </View>
      <Text className="text-lg text-muted">›</Text>
    </PressableCard>
  );
}

/** Admin overview: KPI tiles plus entry points to the moderation screens. */
export default function AdminOverviewScreen() {
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setStats(await getAdminStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load stats.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerClassName="gap-3 p-5 pb-8"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={palette.brand}
        />
      }
    >
      {!stats && !error ? (
        <ActivityIndicator color={palette.brand} style={{ paddingVertical: 40 }} />
      ) : error ? (
        <Text className="py-6 text-center text-base text-prayer-red">{error}</Text>
      ) : stats ? (
        <>
          <SectionLabel>Community</SectionLabel>
          <View className="flex-row flex-wrap gap-3">
            <StatTile index={0} label="Users" value={String(stats.total_users)} />
            <StatTile index={1} label="Drivers" value={String(stats.total_drivers)} />
            <StatTile index={2} label="Verified" value={String(stats.verified_users)} />
            <StatTile index={3} label="Banned" value={String(stats.banned_users)} />
          </View>

          <SectionLabel>Rides</SectionLabel>
          <View className="flex-row flex-wrap gap-3">
            <StatTile index={4} label="Active" value={String(stats.rides_active)} />
            <StatTile index={5} label="Completed" value={String(stats.rides_completed)} />
            <StatTile index={6} label="Cancelled" value={String(stats.rides_cancelled)} />
          </View>

          <SectionLabel>Bookings</SectionLabel>
          <View className="flex-row flex-wrap gap-3">
            <StatTile index={7} label="Confirmed" value={String(stats.bookings_confirmed)} />
            <StatTile index={8} label="Cancelled" value={String(stats.bookings_cancelled)} />
            <StatTile index={9} label="Seats sold" value={String(stats.seats_sold)} />
            <StatTile
              index={10}
              label="Booked value"
              value={`₹${stats.booked_value.toLocaleString('en-IN')}`}
            />
          </View>
        </>
      ) : null}

      <SectionLabel>Manage</SectionLabel>
      <ManageLink
        title="Users"
        subtitle="Search, review, ban or unban"
        onPress={() => router.push('/admin/users')}
      />
      <ManageLink
        title="Rides"
        subtitle="All rides by status, with moderation"
        onPress={() => router.push('/admin/rides')}
      />
    </ScrollView>
  );
}
