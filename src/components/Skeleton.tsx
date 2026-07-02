import { useEffect } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { View } from 'react-native';

import { AnimatedView } from '@/components/animated';
import { Card } from '@/components/Card';

/** One breathing placeholder bar. Give it width/height/radius via className. */
export function Skeleton({ className }: { className?: string }) {
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [pulse]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <AnimatedView
      className={`rounded-lg bg-mountain-mist ${className ?? ''}`}
      style={style}
    />
  );
}

/** Loading stand-in shaped like a RideCard, so lists don't jump on arrival. */
export function RideCardSkeleton() {
  return (
    <Card className="gap-3 p-4">
      <View className="flex-row items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-3/5" />
        </View>
        <Skeleton className="h-6 w-14" />
      </View>
      <View className="gap-2 pl-1">
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-3/5" />
      </View>
      <View className="flex-row gap-2">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </View>
    </Card>
  );
}
