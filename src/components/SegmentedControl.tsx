import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';

import { AnimatedView } from '@/components/animated';
import { tapHaptic } from '@/lib/haptics';
import { springs } from '@/theme/motion';

const PAD = 4; // matches the p-1 track inset

interface SegmentedControlProps<K extends string> {
  options: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}

/**
 * Equal-width segment toggle with a white thumb that glides under the
 * selected label on a spring (the My Rides Booked/Offered switcher).
 */
export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<K>) {
  const [trackWidth, setTrackWidth] = useState(0);
  const segmentWidth = trackWidth > 0 ? (trackWidth - PAD * 2) / options.length : 0;
  const index = Math.max(
    options.findIndex((o) => o.key === value),
    0,
  );

  const targetX = useDerivedValue(
    () => withSpring(index * segmentWidth, springs.gentle),
    [index, segmentWidth],
  );
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: targetX.value }],
  }));

  return (
    <View
      className="flex-row rounded-full bg-mountain-mist p-1"
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      {segmentWidth > 0 ? (
        <AnimatedView
          className="absolute bottom-1 top-1 rounded-full bg-white"
          style={[{ left: PAD, width: segmentWidth }, thumbStyle]}
        />
      ) : null}
      {options.map(({ key, label }) => (
        <Pressable
          key={key}
          onPress={() => {
            if (key !== value) {
              tapHaptic();
              onChange(key);
            }
          }}
          className="flex-1 items-center rounded-full py-2"
        >
          <Text
            className={`font-heading text-base ${
              value === key ? 'text-ink' : 'text-muted'
            }`}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
