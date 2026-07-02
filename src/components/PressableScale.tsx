import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/animated';
import { tapHaptic } from '@/lib/haptics';
import { springs } from '@/theme/motion';

// Typed against Pressable's own props (not the animated component's, whose
// SharedValue-union prop types don't survive spreading). Style is narrowed to
// plain styles — the press-state-function form can't merge with an animated one.
interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  className?: string;
  /** Resting→pressed scale. Cards read best at the default; tiny chips at ~0.94. */
  scaleTo?: number;
  /** Selection haptic on press. On by default — opt out for high-frequency taps. */
  haptic?: boolean;
}

/**
 * The app's only pressed-state treatment: a quick spring down to `scaleTo`
 * and back, plus a selection haptic. Replaces `active:` color classes — touch
 * feedback should feel physical, not painted.
 */
export function PressableScale({
  scaleTo = 0.97,
  haptic = true,
  onPressIn,
  onPressOut,
  onPress,
  style,
  ...rest
}: PressableScaleProps) {
  const pressed = useSharedValue(0);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pressed.value * (scaleTo - 1) }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      style={[style, pressStyle]}
      onPressIn={(e) => {
        pressed.value = withSpring(1, springs.press);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withSpring(0, springs.press);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) tapHaptic();
        onPress?.(e);
      }}
    />
  );
}
