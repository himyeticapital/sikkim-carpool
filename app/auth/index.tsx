import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Logo } from '@/components/brand/Logo';
import { MountainBackdrop } from '@/components/brand/MountainBackdrop';
import { RoadMotif } from '@/components/brand/RoadMotif';
import { fetchOrCreateProfile, requestOtp, verifyOtp } from '@/services/auth';
import { useAppStore } from '@/store/useAppStore';
import { palette } from '@/theme/colors';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

/**
 * Phone number + OTP sign-in via Supabase. No ID check here — verification
 * is only asked for at the user's first booking (see src/config/flags.ts and
 * app/verify/digilocker.tsx).
 */
export default function AuthScreen() {
  const router = useRouter();
  const setSession = useAppStore((s) => s.setSession);
  const setProfile = useAppStore((s) => s.setProfile);

  const [phase, setPhase] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const otpInputRef = useRef<TextInput>(null);

  const fullPhone = `+91${phone}`;

  useEffect(() => {
    if (phase !== 'otp' || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  const handleRequestOtp = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await requestOtp(fullPhone);
      setPhase('otp');
      setOtp('');
      setCountdown(RESEND_SECONDS);
      requestAnimationFrame(() => otpInputRef.current?.focus());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not send the code. Try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [fullPhone]);

  const handleVerify = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { session, user } = await verifyOtp(fullPhone, otp);
      setSession(session);
      const profile = await fetchOrCreateProfile(user.id, fullPhone);
      setProfile(profile);
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "That code didn't match. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [fullPhone, otp, router, setProfile, setSession]);

  const canRequestOtp = phone.length === 10 && !loading;
  const canVerify = otp.length === OTP_LENGTH && !loading;

  return (
    <View className="flex-1 bg-cream">
      <View pointerEvents="none" className="absolute inset-x-0 bottom-0">
        <View className="relative">
          <MountainBackdrop height={200} />
          <View className="absolute inset-0">
            <RoadMotif height={200} />
          </View>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-grow justify-center px-8 py-16"
      >
        <View className="mb-10 items-center gap-1">
          <Logo size={88} />
          <Text className="mt-3 font-display text-3xl text-ink">
            Sikkim Carpool
          </Text>
          <Text className="font-body-regular text-lg text-muted">
            Share rides across the hills
          </Text>
        </View>

        {phase === 'phone' ? (
          <View className="gap-4">
            <Text className="font-heading text-base text-muted">
              Phone number
            </Text>
            <View className="flex-row items-center gap-3 rounded-2xl border-2 border-brand-light bg-white px-4">
              <Text className="font-heading text-lg text-ink">+91</Text>
              <TextInput
                className="flex-1 py-4 text-lg text-ink"
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210"
                placeholderTextColor={palette.muted}
                autoFocus
              />
            </View>

            {error ? (
              <Text className="text-base text-prayer-red">{error}</Text>
            ) : null}

            <Pressable
              disabled={!canRequestOtp}
              onPress={handleRequestOtp}
              className={`items-center rounded-full px-8 py-4 ${
                canRequestOtp ? 'bg-brand' : 'bg-mountain-mist'
              }`}
            >
              {loading ? (
                <ActivityIndicator color={palette.cream} />
              ) : (
                <Text className="font-heading text-lg text-cream">Get OTP</Text>
              )}
            </Pressable>

            <Text className="text-center text-sm text-muted">
              By continuing, you agree to our Terms of Service and Privacy
              Policy
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            <Text className="text-center font-heading text-base text-muted">
              Enter the code sent to +91 {phone}
            </Text>

            <View className="relative">
              <View className="flex-row justify-center gap-2">
                {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                  <View
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className="h-14 w-11 items-center justify-center rounded-xl border-2 border-brand-light bg-white"
                  >
                    <Text className="font-heading text-xl text-ink">
                      {otp[i] ?? ''}
                    </Text>
                  </View>
                ))}
              </View>
              <TextInput
                ref={otpInputRef}
                value={otp}
                onChangeText={(t) =>
                  setOtp(t.replace(/\D/g, '').slice(0, OTP_LENGTH))
                }
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                className="absolute inset-0 opacity-0"
                autoFocus
              />
            </View>

            {error ? (
              <Text className="text-center text-base text-prayer-red">
                {error}
              </Text>
            ) : null}

            <Pressable
              disabled={!canVerify}
              onPress={handleVerify}
              className={`items-center rounded-full px-8 py-4 ${
                canVerify ? 'bg-brand' : 'bg-mountain-mist'
              }`}
            >
              {loading ? (
                <ActivityIndicator color={palette.cream} />
              ) : (
                <Text className="font-heading text-lg text-cream">
                  Verify & Continue
                </Text>
              )}
            </Pressable>

            <Pressable
              disabled={countdown > 0}
              onPress={handleRequestOtp}
              hitSlop={12}
            >
              <Text className="text-center font-heading text-base text-brand-dark">
                {countdown > 0
                  ? `Resend OTP in 00:${String(countdown).padStart(2, '0')}`
                  : 'Resend OTP'}
              </Text>
            </Pressable>

            <Pressable onPress={() => setPhase('phone')} hitSlop={12}>
              <Text className="text-center text-base text-muted">
                Change number
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
