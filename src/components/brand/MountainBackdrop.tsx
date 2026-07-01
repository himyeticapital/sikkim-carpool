import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

interface MountainBackdropProps {
  height?: number;
}

/**
 * Full-width, layered ridge silhouette for pinning behind screen content
 * (onboarding slides, auth). `preserveAspectRatio="slice"` lets it stretch to
 * any device width without distorting the ridge shapes.
 */
export function MountainBackdrop({ height = 220 }: MountainBackdropProps) {
  return (
    <Svg
      width="100%"
      height={height}
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMax slice"
    >
      <Defs>
        <LinearGradient id="mountainMist" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C9D7E0" stopOpacity={0} />
          <Stop offset="1" stopColor="#C9D7E0" stopOpacity={0.7} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="400" height="260" fill="url(#mountainMist)" />
      <Path
        d="M0,180 L60,120 130,170 200,110 270,165 340,125 400,175 L400,260 0,260 Z"
        fill="#C9D7E0"
      />
      <Path
        d="M0,210 L80,150 150,195 230,140 300,200 400,150 L400,260 0,260 Z"
        fill="#5D7A9A"
      />
      <Path
        d="M0,240 L70,190 160,230 260,180 340,225 400,195 L400,260 0,260 Z"
        fill="#3A5273"
      />
    </Svg>
  );
}

export default MountainBackdrop;
