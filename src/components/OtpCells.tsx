import { useEffect } from 'react';
import { Text, View } from 'react-native';
import {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { AnimatedView } from '@/components/animated';
import { springs } from '@/theme/motion';

interface OtpCellsProps {
  value: string;
  length: number;
  /** Truthy when the last submit failed — plays one shake of the row. */
  error?: boolean;
}

/** The blinking insertion caret shown in the active (next-to-fill) cell. */
function Caret() {
  const blink = useSharedValue(1);

  useEffect(() => {
    blink.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 420 }),
        withTiming(1, { duration: 420 }),
      ),
      -1,
    );
  }, [blink]);

  const style = useAnimatedStyle(() => ({ opacity: blink.value }));
  return <AnimatedView className="h-6 w-0.5 rounded-full bg-brand" style={style} />;
}

/**
 * Display layer for OTP entry (the real input is a hidden TextInput owned by
 * the screen): the next cell shows a breathing caret, digits pop in as typed,
 * and a wrong code shakes the whole row once.
 */
export function OtpCells({ value, length, error = false }: OtpCellsProps) {
  const shake = useSharedValue(0);

  useEffect(() => {
    if (!error) return;
    shake.value = withSequence(
      withTiming(-7, { duration: 55 }),
      withTiming(6, { duration: 55 }),
      withTiming(-4, { duration: 55 }),
      withTiming(2, { duration: 55 }),
      withTiming(0, { duration: 55 }),
    );
  }, [error, shake]);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  return (
    <AnimatedView className="flex-row justify-center gap-2" style={rowStyle}>
      {Array.from({ length }).map((_, i) => {
        const digit = value[i];
        const active = i === value.length;
        return (
          <View
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className={`h-14 w-11 items-center justify-center rounded-xl border-2 bg-white ${
              active ? 'border-brand' : 'border-brand-light'
            }`}
          >
            {digit ? (
              <AnimatedView
                key={`${i}-${digit}`}
                entering={ZoomIn.springify()
                  .damping(springs.pop.damping)
                  .stiffness(springs.pop.stiffness)}
              >
                <Text className="font-heading text-xl text-ink">{digit}</Text>
              </AnimatedView>
            ) : active ? (
              <AnimatedView entering={FadeIn.duration(150)}>
                <Caret />
              </AnimatedView>
            ) : null}
          </View>
        );
      })}
    </AnimatedView>
  );
}
