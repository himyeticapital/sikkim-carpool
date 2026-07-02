import { Text } from 'react-native';
import { FadeIn } from 'react-native-reanimated';

import { AnimatedView } from '@/components/animated';

interface EmptyStateProps {
  title: string;
  body: string;
}

/** Friendly list-is-empty message; keep the body actionable, not apologetic. */
export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <AnimatedView entering={FadeIn.duration(300)} className="items-center gap-2 py-10">
      <Text className="font-heading text-lg text-ink">{title}</Text>
      <Text className="text-center font-body-regular text-base text-muted">
        {body}
      </Text>
    </AnimatedView>
  );
}
