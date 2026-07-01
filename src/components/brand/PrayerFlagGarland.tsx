import Svg, { Path, Polygon } from 'react-native-svg';

const FLAG_COLORS = ['#3E7CB1', '#FDFBF6', '#D1483E', '#5B8C5A', '#E8B23D'];

interface PrayerFlagGarlandProps {
  flagCount?: number;
  height?: number;
}

/**
 * Decorative string of prayer flags, sized to fill its parent's width.
 * Used as a header ornament (Home/Offer/Profile) and behind onboarding.
 * Flag y-positions follow the same quadratic sag as the string itself, so
 * changing `flagCount` still looks hand-strung rather than mechanically even.
 */
export function PrayerFlagGarland({
  flagCount = 9,
  height = 44,
}: PrayerFlagGarlandProps) {
  const viewW = 400;
  const viewH = 48;
  const topY = 10;
  const sag = 14;
  const startX = 8;
  const endX = viewW - 8;

  const quadY = (t: number) =>
    (1 - t) ** 2 * topY + 2 * (1 - t) * t * (topY + sag) + t ** 2 * topY;

  const flags = Array.from({ length: flagCount }, (_, i) => {
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
        stroke="#3B2E2A"
        strokeWidth={1.5}
        fill="none"
        opacity={0.45}
      />
      {flags.map((flag, i) => (
        <Polygon
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          points={`${flag.x - 7},${flag.y} ${flag.x + 7},${flag.y} ${flag.x},${flag.y + 16}`}
          fill={flag.color}
        />
      ))}
    </Svg>
  );
}

export default PrayerFlagGarland;
