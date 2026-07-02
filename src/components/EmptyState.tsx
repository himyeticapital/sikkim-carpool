import { Text, View } from 'react-native';

interface EmptyStateProps {
  title: string;
  body: string;
}

/** Friendly list-is-empty message; keep the body actionable, not apologetic. */
export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <View className="items-center gap-2 py-10">
      <Text className="font-heading text-lg text-ink">{title}</Text>
      <Text className="text-center font-body-regular text-base text-muted">
        {body}
      </Text>
    </View>
  );
}
