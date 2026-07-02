import type { ComponentProps } from 'react';
import { View, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { palette } from '@/theme/colors';

/**
 * The surface treatment every card in the app shares: white, 16px radius,
 * hairline mist border, and a shadow soft enough to read as paper lift, not
 * material design. Change it here and the whole app follows.
 */
const CARD_CLASS = 'rounded-2xl border border-mountain-mist bg-white';

const cardShadow: ViewStyle = {
  shadowColor: palette.ink,
  shadowOpacity: 0.05,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export function Card({ className, style, ...rest }: ComponentProps<typeof View>) {
  return (
    <View
      className={`${CARD_CLASS} ${className ?? ''}`}
      style={[cardShadow, style]}
      {...rest}
    />
  );
}

/** A Card that presses — spring scale + haptic from PressableScale. */
export function PressableCard({
  className,
  style,
  ...rest
}: ComponentProps<typeof PressableScale>) {
  return (
    <PressableScale
      className={`${CARD_CLASS} ${className ?? ''}`}
      style={[cardShadow, style]}
      {...rest}
    />
  );
}
