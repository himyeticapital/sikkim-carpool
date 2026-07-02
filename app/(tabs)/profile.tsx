import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Pill, type PillTone } from '@/components/Pill';
import { signOut } from '@/services/auth';
import { updateIsDriver } from '@/services/profiles';
import { useAppStore } from '@/store/useAppStore';
import { palette } from '@/theme/colors';
import type { KycStatus } from '@/types/models';

const MENU_ITEMS = ['My Rides', 'Payment Methods', 'Help & Support', 'About'];

const KYC_BADGE: Record<KycStatus, { label: string; tone: PillTone }> = {
  verified: { label: 'Verified', tone: 'positive' },
  pending: { label: 'Verification pending', tone: 'warning' },
  unverified: { label: 'Not verified', tone: 'neutral' },
};

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const reset = useAppStore((s) => s.reset);
  const [updatingDriverMode, setUpdatingDriverMode] = useState(false);

  const handleToggleDriverMode = useCallback(
    async (value: boolean) => {
      if (!profile) return;
      setUpdatingDriverMode(true);
      try {
        const updated = await updateIsDriver(profile.id, value);
        setProfile(updated);
      } catch {
        Alert.alert("Couldn't update driver mode", 'Please try again.');
      } finally {
        setUpdatingDriverMode(false);
      }
    },
    [profile, setProfile],
  );

  const handleLogout = useCallback(async () => {
    await signOut();
    reset();
    router.replace('/auth');
  }, [reset, router]);

  const name = profile?.full_name ?? 'Your name';
  const kyc = KYC_BADGE[profile?.kyc_status ?? 'unverified'];

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerClassName="gap-4 p-5">
      <View className="items-center gap-2 rounded-2xl border border-mountain-mist bg-white p-6">
        <Avatar name={name} size="lg" />
        <Text className="font-heading text-xl text-ink">{name}</Text>
        <Text className="font-body-regular text-base text-muted">
          {profile?.phone_number ?? ''}
        </Text>
        <View className="flex-row items-center gap-3">
          <Text className="font-body text-base text-ink">
            ★ {(profile?.rating ?? 0).toFixed(1)}
          </Text>
          <Pill label={kyc.label} tone={kyc.tone} />
        </View>
      </View>

      <View className="flex-row items-center justify-between rounded-2xl border border-mountain-mist bg-white p-4">
        <View className="flex-1">
          <Text className="font-heading text-base text-ink">Driver Mode</Text>
          <Text className="font-body-regular text-sm text-muted">
            Offer rides to passengers
          </Text>
        </View>
        <Switch
          value={profile?.is_driver ?? false}
          onValueChange={handleToggleDriverMode}
          disabled={updatingDriverMode}
          trackColor={{ true: palette.brand, false: palette.mountainMist }}
          thumbColor={palette.prayerWhite}
        />
      </View>

      <View className="overflow-hidden rounded-2xl border border-mountain-mist bg-white">
        {(profile?.role === 'admin'
          ? ['Admin Dashboard', ...MENU_ITEMS]
          : MENU_ITEMS
        ).map((label, i) => (
          <Pressable
            key={label}
            onPress={() =>
              label === 'My Rides'
                ? router.push('/my-rides')
                : label === 'Admin Dashboard'
                  ? router.push('/admin')
                  : Alert.alert(label, 'Coming soon.')
            }
            className={`flex-row items-center justify-between px-4 py-4 active:bg-brand-light ${
              i > 0 ? 'border-t border-mountain-mist' : ''
            }`}
          >
            <Text className="font-body text-base text-ink">{label}</Text>
            <Text className="text-lg text-muted">›</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleLogout}
        className="items-center rounded-full bg-prayer-red/10 px-8 py-4"
      >
        <Text className="font-heading text-lg text-prayer-red">Log Out</Text>
      </Pressable>

      <Text className="text-center text-sm text-muted">Sikkim Carpool v1.0.0</Text>
    </ScrollView>
  );
}
