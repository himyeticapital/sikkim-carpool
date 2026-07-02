import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Pill } from '@/components/Pill';
import { PressableScale } from '@/components/PressableScale';
import { confirmAction } from '@/lib/confirm';
import { listAllProfiles, setUserBanned } from '@/services/admin';
import { useAppStore } from '@/store/useAppStore';
import { palette } from '@/theme/colors';
import type { Profile } from '@/types/models';

/** Admin user management: search all profiles, ban or unban. */
export default function AdminUsersScreen() {
  const profile = useAppStore((s) => s.profile);

  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const load = useCallback(async (query: string) => {
    setError(null);
    try {
      setUsers(await listAllProfiles(query || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce keystrokes so we don't query per character.
  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
  }, [search, load]);

  const handleToggleBan = useCallback(
    (user: Profile) => {
      const banning = !user.is_banned;
      const name = user.full_name ?? user.phone_number;
      confirmAction({
        title: banning ? `Ban ${name}?` : `Unban ${name}?`,
        message: banning
          ? 'Their active rides and bookings will be cancelled, and they will no longer be able to post rides or book seats.'
          : 'They will be able to post rides and book seats again.',
        confirmLabel: banning ? 'Ban user' : 'Unban user',
        destructive: banning,
        onConfirm: async () => {
          setMutatingId(user.id);
          try {
            await setUserBanned(user.id, banning);
            await load(search);
          } catch (err) {
            Alert.alert(
              "Couldn't update this user",
              err instanceof Error ? err.message : 'Please try again.',
            );
          } finally {
            setMutatingId(null);
          }
        },
      });
    },
    [load, search],
  );

  return (
    <View className="flex-1 bg-cream">
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        contentContainerClassName="gap-3 p-5 pb-8"
        ListHeaderComponent={
          <View className="gap-3 pb-1">
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or phone…"
              placeholderTextColor={palette.muted}
              className="rounded-2xl border border-mountain-mist bg-white px-4 py-3 font-body-regular text-base text-ink"
            />
            {loading ? <ActivityIndicator color={palette.brand} /> : null}
            {error ? (
              <Text className="text-center text-base text-prayer-red">{error}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <Text className="py-10 text-center font-body-regular text-base text-muted">
              No users match this search.
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const name = item.full_name ?? 'Unnamed user';
          const bannable = item.id !== profile?.id && item.role !== 'admin';
          return (
            <Card className="gap-3 p-4">
              <View className="flex-row items-center gap-3">
                <Avatar name={name} />
                <View className="flex-1">
                  <Text className="font-heading text-base text-ink" numberOfLines={1}>
                    {name}
                  </Text>
                  <Text className="font-body-regular text-sm text-muted">
                    {item.phone_number} · ★ {item.rating.toFixed(1)}
                  </Text>
                </View>
              </View>

              <View className="flex-row flex-wrap items-center gap-1.5">
                {item.role === 'admin' ? <Pill small label="Admin" tone="positive" /> : null}
                {item.is_driver ? <Pill small label="Driver" tone="positive" /> : null}
                <Pill
                  small
                  label={item.kyc_status === 'verified' ? 'Verified' : 'Not verified'}
                  tone={item.kyc_status === 'verified' ? 'positive' : 'neutral'}
                />
                {item.is_banned ? <Pill small label="Banned" tone="danger" /> : null}
              </View>

              {bannable ? (
                <PressableScale
                  onPress={() => handleToggleBan(item)}
                  disabled={mutatingId === item.id}
                  className={`items-center rounded-full px-4 py-2.5 ${
                    item.is_banned ? 'bg-brand' : 'bg-prayer-red/10'
                  }`}
                >
                  <Text
                    className={`font-heading text-sm ${
                      item.is_banned ? 'text-cream' : 'text-prayer-red'
                    }`}
                  >
                    {mutatingId === item.id
                      ? 'Updating…'
                      : item.is_banned
                        ? 'Unban user'
                        : 'Ban user'}
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
