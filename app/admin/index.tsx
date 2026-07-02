import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { getAdminStats, type AdminStats } from '@/services/admin';
import { useAppStore } from '@/store/useAppStore';

/**
 * One headline number. Per the stat-tile contract: sentence-case muted label,
 * value in the ink text token (identity/state never rides on the value's
 * color), semibold sans.
 */
function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[45%] flex-1 gap-0.5 rounded-2xl border border-mountain-mist bg-white p-4">
      <Text className="font-body-regular text-sm text-muted">{label}</Text>
      <Text className="font-heading text-2xl text-ink">{value}</Text>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text className="mt-2 font-heading text-base text-ink">{children}</Text>;
}

/** Admin overview: KPI tiles plus entry points to the moderation screens. */
export default function AdminOverviewScreen() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const initializing = useAppStore((s) => s.initializing);

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

  // Server-side RLS is the real gate; this just keeps non-admins out of a
  // screen that would only show them errors.
  if (!initializing && profile?.role !== 'admin') {
    return <Redirect href="/home" />;
  }

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
          tintColor="#3C8F86"
        />
      }
    >
      {!stats && !error ? (
        <ActivityIndicator color="#3C8F86" style={{ paddingVertical: 40 }} />
      ) : error ? (
        <Text className="py-6 text-center text-base text-prayer-red">{error}</Text>
      ) : stats ? (
        <>
          <SectionLabel>Community</SectionLabel>
          <View className="flex-row flex-wrap gap-3">
            <StatTile label="Users" value={String(stats.total_users)} />
            <StatTile label="Drivers" value={String(stats.total_drivers)} />
            <StatTile label="Verified" value={String(stats.verified_users)} />
            <StatTile label="Banned" value={String(stats.banned_users)} />
          </View>

          <SectionLabel>Rides</SectionLabel>
          <View className="flex-row flex-wrap gap-3">
            <StatTile label="Active" value={String(stats.rides_active)} />
            <StatTile label="Completed" value={String(stats.rides_completed)} />
            <StatTile label="Cancelled" value={String(stats.rides_cancelled)} />
          </View>

          <SectionLabel>Bookings</SectionLabel>
          <View className="flex-row flex-wrap gap-3">
            <StatTile label="Confirmed" value={String(stats.bookings_confirmed)} />
            <StatTile label="Cancelled" value={String(stats.bookings_cancelled)} />
            <StatTile label="Seats sold" value={String(stats.seats_sold)} />
            <StatTile
              label="Booked value"
              value={`₹${stats.booked_value.toLocaleString('en-IN')}`}
            />
          </View>
        </>
      ) : null}

      <SectionLabel>Manage</SectionLabel>
      <Pressable
        onPress={() => router.push('/admin/users')}
        className="flex-row items-center justify-between rounded-2xl border border-mountain-mist bg-white px-4 py-4 active:bg-brand-light"
      >
        <View>
          <Text className="font-heading text-base text-ink">Users</Text>
          <Text className="font-body-regular text-sm text-muted">
            Search, review, ban or unban
          </Text>
        </View>
        <Text className="text-lg text-muted">›</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/admin/rides')}
        className="flex-row items-center justify-between rounded-2xl border border-mountain-mist bg-white px-4 py-4 active:bg-brand-light"
      >
        <View>
          <Text className="font-heading text-base text-ink">Rides</Text>
          <Text className="font-body-regular text-sm text-muted">
            All rides by status, with moderation
          </Text>
        </View>
        <Text className="text-lg text-muted">›</Text>
      </Pressable>
    </ScrollView>
  );
}
