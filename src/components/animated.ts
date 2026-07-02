import { cssInterop } from 'nativewind';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

/**
 * Animated components pre-registered with NativeWind, so `className` works on
 * them like on core components. Import these instead of re-creating animated
 * components per file (createAnimatedComponent + cssInterop should each run
 * once per component type).
 */
export const AnimatedView = Animated.View;
export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

cssInterop(AnimatedView, { className: 'style' });
cssInterop(AnimatedPressable, { className: 'style' });
