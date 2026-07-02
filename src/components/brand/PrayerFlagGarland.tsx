import { useEffect } from 'react';
import { Platform } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path, Polygon } from 'react-native-svg';

import { palette } from '@/theme/colors';

const FLAG_COLORS = [
  palette.prayerBlue,
  palette.prayerWhite,
  palette.prayerRed,
  palette.prayerGreen,
  palette.prayerYellow,
];

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

// One full sway cycle; sin(2π·t + φ) is continuous across the loop seam.
const FLUTTER_CYCLE_MS = 2800;

interface FlagGeometry {
  x: number;
  y: number;
  color: string;
}

/**
 * A single flag whose free corner drifts on the shared breeze clock. Each
 * flag gets a phase offset so the garland ripples along its length instead
 * of waving in lockstep.
 */
function FlutterFlag({
  flag,
  phase,
  breeze,
}: {
  flag: FlagGeometry;
  phase: number;
  breeze: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => {
    const t = breeze.value * 2 * Math.PI + phase;
    const sway = Math.sin(t) * 2.4;
    const lift = Math.cos(t * 0.8 + phase) * 1.3;
    return {
      points: `${flag.x - 7},${flag.y} ${flag.x + 7},${flag.y} ${
        flag.x + sway
      },${flag.y + 16 + lift}`,
    };
  });
  return <AnimatedPolygon animatedProps={animatedProps} fill={flag.color} />;
}

interface PrayerFlagGarlandProps {
  flagCount?: number;
  height?: number;
  /** Breeze animation; defaults on (native only — SVG animatedProps are flaky on web). */
  animated?: boolean;
}

/**
 * Decorative string of prayer flags, sized to fill its parent's width, with
 * each flag fluttering gently on a shared breeze. Used as a header ornament
 * (Home/Offer/Profile) and behind onboarding. Flag y-positions follow the
 * same quadratic sag as the string itself, so changing `flagCount` still
 * looks hand-strung rather than mechanically even.
 */
export function PrayerFlagGarland({
  flagCount = 9,
  height = 44,
  animated = true,
}: PrayerFlagGarlandProps) {
  const viewW = 400;
  const viewH = 48;
  const topY = 10;
  const sag = 14;
  const startX = 8;
  const endX = viewW - 8;

  const breeze = useSharedValue(0);
  const flutter = animated && Platform.OS !== 'web';

  useEffect(() => {
    if (!flutter) return;
    breeze.value = withRepeat(
      withTiming(1, { duration: FLUTTER_CYCLE_MS, easing: Easing.linear }),
      -1,
    );
  }, [breeze, flutter]);

  const quadY = (t: number) =>
    (1 - t) ** 2 * topY + 2 * (1 - t) * t * (topY + sag) + t ** 2 * topY;

  const flags: FlagGeometry[] = Array.from({ length: flagCount }, (_, i) => {
    const t = flagCount === 1 ? 0.5 : i / (flagCount - 1);
    return {
      x: startX + t * (endX - startX),
      y: quadY(t),
      color: FLAG_COLORS[i % FLAG_COLORS.length],
    };
  });

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${viewW} ${viewH}`}>
      <Path
        d={`M${startX},${topY} Q${viewW / 2},${topY + sag} ${endX},${topY}`}
        stroke={palette.ink}
        strokeWidth={1.5}
        fill="none"
        opacity={0.45}
      />
      {flags.map((flag, i) =>
        flutter ? (
          <FlutterFlag
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            flag={flag}
            phase={i * 0.9}
            breeze={breeze}
          />
        ) : (
          <Polygon
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            points={`${flag.x - 7},${flag.y} ${flag.x + 7},${flag.y} ${flag.x},${flag.y + 16}`}
            fill={flag.color}
          />
        ),
      )}
    </Svg>
  );
}

export default PrayerFlagGarland;
