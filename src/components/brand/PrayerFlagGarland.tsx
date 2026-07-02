import { useEffect } from 'react';
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
// Lungta proportions: small squarish cloth, sewn along its top edge to the
// cord — the flag itself is close to a square, slightly taller than wide.
const FLAG_W = 13;
const FLAG_H = 15;

interface FlagGeometry {
  x: number;
  y: number;
  color: string;
}

/**
 * A single flag pinned along its top edge (as it's sewn to the cord), with
 * the loose fabric below rippling on the shared breeze clock: the bottom
 * edge shears sideways and the width breathes slightly, rather than the
 * whole shape swinging from one point. Each flag gets a phase offset so the
 * ripple travels along the garland instead of every flag moving in lockstep.
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
    const sway = Math.sin(t) * 3;
    const puff = Math.cos(t * 1.3 + phase) * 1.4;
    const topL = flag.x - FLAG_W / 2;
    const topR = flag.x + FLAG_W / 2;
    const botR = flag.x + FLAG_W / 2 + sway + puff;
    const botL = flag.x - FLAG_W / 2 + sway - puff;
    return {
      points: `${topL},${flag.y} ${topR},${flag.y} ${botR},${flag.y + FLAG_H} ${botL},${flag.y + FLAG_H}`,
    };
  });
  return (
    <AnimatedPolygon
      animatedProps={animatedProps}
      fill={flag.color}
      stroke={palette.ink}
      strokeOpacity={0.18}
      strokeWidth={0.75}
    />
  );
}

interface PrayerFlagGarlandProps {
  flagCount?: number;
  height?: number;
  /** Breeze animation; on by default on every platform. */
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
  const flutter = animated;

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
            points={`${flag.x - FLAG_W / 2},${flag.y} ${flag.x + FLAG_W / 2},${flag.y} ${
              flag.x + FLAG_W / 2
            },${flag.y + FLAG_H} ${flag.x - FLAG_W / 2},${flag.y + FLAG_H}`}
            fill={flag.color}
            stroke={palette.ink}
            strokeOpacity={0.18}
            strokeWidth={0.75}
          />
        ),
      )}
    </Svg>
  );
}

export default PrayerFlagGarland;
