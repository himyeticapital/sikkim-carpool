import { Text, View } from 'react-native';

interface RouteLinesProps {
  source: string;
  destination: string;
}

/**
 * The two-stop route readout used everywhere a ride appears: brand dot for
 * the origin, dark square for the destination.
 */
export function RouteLines({ source, destination }: RouteLinesProps) {
  return (
    <View className="gap-1.5">
      <View className="flex-row items-center gap-2">
        <View className="h-2.5 w-2.5 rounded-full bg-brand" />
        <Text className="flex-1 font-body-regular text-base text-ink" numberOfLines={1}>
          {source}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <View className="h-2.5 w-2.5 bg-mountain-deep" />
        <Text className="flex-1 font-body-regular text-base text-ink" numberOfLines={1}>
          {destination}
        </Text>
      </View>
    </View>
  );
}
