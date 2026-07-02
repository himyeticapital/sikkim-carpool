import { Text, View } from 'react-native';

const TONES = {
  /** Confirmed / active / verified — anything in good standing. */
  positive: { bg: 'bg-brand-light', text: 'text-brand-dark' },
  /** Completed / not verified — done or merely absent, not a problem. */
  neutral: { bg: 'bg-mountain-mist', text: 'text-muted' },
  /** Running low / pending — worth a glance. */
  warning: { bg: 'bg-sunset/20', text: 'text-sunset' },
  /** Cancelled / banned. */
  danger: { bg: 'bg-prayer-red/10', text: 'text-prayer-red' },
} as const;

export type PillTone = keyof typeof TONES;

interface PillProps {
  label: string;
  tone: PillTone;
  /** Compact variant for dense rows (e.g. badge lists). */
  small?: boolean;
}

/** Status pill: state is carried by the tone, never ad-hoc colors. */
export function Pill({ label, tone, small = false }: PillProps) {
  const t = TONES[tone];
  return (
    <View className={`rounded-full ${small ? 'px-2 py-0.5' : 'px-3 py-1'} ${t.bg}`}>
      <Text className={`font-body ${small ? 'text-xs' : 'text-sm'} ${t.text}`}>
        {label}
      </Text>
    </View>
  );
}
