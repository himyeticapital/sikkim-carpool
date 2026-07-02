import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Logo } from '@/components/brand/Logo';
import { MountainBackdrop } from '@/components/brand/MountainBackdrop';
import { PrayerFlagGarland } from '@/components/brand/PrayerFlagGarland';
import { RoadMotif } from '@/components/brand/RoadMotif';
import { markOnboardingSeen } from '@/services/onboarding';
import { palette } from '@/theme/colors';

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <View className="h-32 w-32 items-center justify-center rounded-full bg-brand-light">
      {children}
    </View>
  );
}

function PhoneGlyph() {
  return (
    <Svg width={64} height={64} viewBox="0 0 100 100">
      <Rect x="25" y="8" width="50" height="84" rx="10" fill={palette.mountainDeep} />
      <Rect x="30" y="18" width="40" height="58" rx="4" fill={palette.prayerWhite} />
      <Circle cx="50" cy="84" r="4" fill={palette.prayerWhite} />
      <Path
        d="M40,44 L48,52 L62,36"
        stroke={palette.prayerGreen}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function ShieldCheckGlyph() {
  return (
    <Svg width={64} height={64} viewBox="0 0 100 100">
      <Path
        d="M50,8 L86,24 L86,52 Q86,84 50,96 Q14,84 14,52 L14,24 Z"
        fill={palette.brand}
      />
      <Path
        d="M32,50 L45,63 L70,35"
        stroke={palette.prayerWhite}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

const SLIDES = [
  {
    key: 'welcome',
    title: 'Sikkim Carpool',
    body: 'Yatra sathi for the mountains — share a ride, share the road, one hill town at a time.',
    illustration: <Logo size={140} />,
  },
  {
    key: 'signup',
    title: 'Hop in, no paperwork',
    body: 'Sign up with just your phone number. Browse rides or offer one right away — nothing else to fill out.',
    illustration: (
      <IconBadge>
        <PhoneGlyph />
      </IconBadge>
    ),
  },
  {
    key: 'verify',
    title: 'One quick check, only when it counts',
    body: "Before your first booking, we verify your ID with DigiLocker — a one-time, under-a-minute step. After that, you're set for every ride.",
    illustration: (
      <IconBadge>
        <ShieldCheckGlyph />
      </IconBadge>
    ),
  },
];

/**
 * First-run introduction shown once, before the user reaches /auth. Gated by
 * a local "seen" flag (src/services/onboarding.ts) so it never reappears
 * after the user finishes or skips it.
 */
export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const finish = useCallback(async () => {
    await markOnboardingSeen();
    router.replace('/auth');
  }, [router]);

  const handleNext = useCallback(() => {
    if (isLast) {
      finish();
      return;
    }
    const nextIndex = index + 1;
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    setIndex(nextIndex);
  }, [finish, index, isLast, width]);

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / width);
      setIndex(Math.max(0, Math.min(SLIDES.length - 1, page)));
    },
    [width],
  );

  return (
    <View className="flex-1 bg-cream">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide) => (
          <View
            key={slide.key}
            style={{ width }}
            className="items-center justify-center px-8 pb-44 pt-20"
          >
            {slide.illustration}
            <Text className="mt-8 text-center font-display text-3xl text-ink">
              {slide.title}
            </Text>
            <Text className="mt-4 text-center font-body-regular text-lg text-muted">
              {slide.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View pointerEvents="none" className="absolute inset-x-0 top-0 pt-3">
        <PrayerFlagGarland flagCount={9} height={40} />
      </View>

      <View pointerEvents="none" className="absolute inset-x-0 bottom-0">
        <View className="relative">
          <MountainBackdrop height={170} />
          <View className="absolute inset-0">
            <RoadMotif height={170} />
          </View>
        </View>
      </View>

      <View className="absolute inset-x-0 bottom-10 items-center gap-6 px-8">
        <View className="flex-row gap-2">
          {SLIDES.map((slide, i) => (
            <View
              key={slide.key}
              className={`h-2.5 rounded-full ${
                i === index ? 'w-6 bg-brand' : 'w-2.5 bg-mountain-mist'
              }`}
            />
          ))}
        </View>

        <View className="w-full flex-row items-center justify-between">
          <Pressable onPress={finish} hitSlop={12}>
            <Text className="font-heading text-lg text-muted">Skip</Text>
          </Pressable>
          <Pressable
            onPress={handleNext}
            className="rounded-full bg-brand px-8 py-4"
          >
            <Text className="font-heading text-lg text-cream">
              {isLast ? 'Get started' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
