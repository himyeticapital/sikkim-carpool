import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';

interface LogoProps {
  size?: number;
}

const FLAG_COLORS = ['#3E7CB1', '#FDFBF6', '#D1483E', '#5B8C5A', '#E8B23D'];

/**
 * App mark: a round "sticker" badge — layered mountain ridges, a rising sun,
 * a little car winding up the pass, and a prayer-flag garland strung across
 * the top. Pure vector so it scales cleanly from a tab icon up to a splash
 * illustration without needing separate raster exports.
 */
export function Logo({ size = 96 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id="logoSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3E7CB1" />
          <Stop offset="1" stopColor="#DCF1EE" />
        </LinearGradient>
        <ClipPath id="logoBadgeClip">
          <Circle cx="100" cy="100" r="94" />
        </ClipPath>
      </Defs>

      {/* Badge outline */}
      <Circle cx="100" cy="100" r="98" fill="#FBF6EC" />
      <Circle cx="100" cy="100" r="94" fill="url(#logoSky)" />
      <Circle
        cx="100"
        cy="100"
        r="94"
        fill="none"
        stroke="#3B2E2A"
        strokeWidth={3}
        opacity={0.12}
      />

      {/* Everything below is clipped to the inner circle so no shape can
          poke past the badge edge. */}
      <G clipPath="url(#logoBadgeClip)">
        {/* Sun with a soft halo */}
        <Circle cx="148" cy="56" r="24" fill="#E8935A" opacity={0.25} />
        <Circle cx="148" cy="56" r="15" fill="#E8935A" />

        {/* Far ridge */}
        <Polygon points="14,142 70,68 128,142" fill="#3A5273" />
        <Polygon points="58,86 70,68 82,86" fill="#FDFBF6" />

        {/* Mid ridge */}
        <Polygon points="58,150 120,82 182,150" fill="#5D7A9A" />
        <Polygon points="106,102 120,82 134,102" fill="#FDFBF6" />

        {/* Valley floor + near hills flanking the road */}
        <Rect x="4" y="150" width="192" height="46" fill="#5B8C5A" />
        <Polygon points="-4,178 42,128 92,178" fill="#245F58" />
        <Polygon points="112,178 158,124 204,178" fill="#245F58" />

        {/* Mountain road with the car cresting the pass */}
        <Polygon points="90,196 110,196 102,132 98,132" fill="#7A6B60" />
        <Path
          d="M100,196 L100,138"
          stroke="#FDFBF6"
          strokeWidth={2}
          strokeDasharray="6,7"
          opacity={0.8}
        />
        <Rect x="82" y="166" width="36" height="17" rx="8" fill="#D1483E" />
        <Rect x="88" y="169" width="12" height="9" rx="3" fill="#FDFBF6" />
        <Circle cx="90" cy="185" r="6" fill="#3B2E2A" />
        <Circle cx="110" cy="185" r="6" fill="#3B2E2A" />
      </G>

      {/* Prayer-flag garland across the top of the badge */}
      <Path
        d="M22,36 Q100,16 178,36"
        stroke="#3B2E2A"
        strokeWidth={2}
        fill="none"
        opacity={0.5}
      />
      {[
        { x: 38, y: 32 },
        { x: 69, y: 23 },
        { x: 100, y: 20 },
        { x: 131, y: 23 },
        { x: 162, y: 32 },
      ].map((flag, i) => (
        <Polygon
          key={flag.x}
          points={`${flag.x - 7},${flag.y} ${flag.x + 7},${flag.y} ${flag.x},${flag.y + 16}`}
          fill={FLAG_COLORS[i % FLAG_COLORS.length]}
        />
      ))}
    </Svg>
  );
}

export default Logo;
