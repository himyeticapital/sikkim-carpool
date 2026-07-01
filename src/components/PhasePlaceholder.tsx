import { Text, View } from 'react-native';

import { Logo } from '@/components/brand/Logo';
import { PrayerFlagGarland } from '@/components/brand/PrayerFlagGarland';

interface PhasePlaceholderProps {
  title: string;
  /** Which build phase this screen gets its real implementation in. */
  phase: string;
  description?: string;
}

/**
 * Temporary screen body used by route stubs so the whole app boots and
 * navigates end-to-end during Phase 1, before each screen's real UI exists.
 * Replaced screen-by-screen in later phases.
 */
export function PhasePlaceholder({
  title,
  phase,
  description,
}: PhasePlaceholderProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-cream px-8">
      <View className="absolute inset-x-0 top-0">
        <PrayerFlagGarland flagCount={7} height={32} />
      </View>
      <Logo size={72} />
      <Text className="mt-2 text-center font-display text-2xl text-ink">
        {title}
      </Text>
      <View className="rounded-full bg-brand-light px-4 py-1">
        <Text className="font-heading text-base text-brand-dark">
          Coming in the {phase} phase
        </Text>
      </View>
      {description ? (
        <Text className="text-center font-body-regular text-lg text-muted">
          {description}
        </Text>
      ) : null}
    </View>
  );
}

export default PhasePlaceholder;
