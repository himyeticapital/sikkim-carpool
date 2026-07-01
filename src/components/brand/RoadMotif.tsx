import Svg, { Path } from 'react-native-svg';

interface RoadMotifProps {
  height?: number;
}

const ROAD_PATH =
  'M-20,268 C 40,230 30,190 90,172 C 150,154 130,110 190,96 C 250,82 230,44 300,34 L 420,18';

/**
 * Winding mountain-highway motif — a switchback road with a dashed center
 * line. Shares MountainBackdrop's viewBox and slice scaling so the two can be
 * stacked (road absolutely positioned over the ridges) as one backdrop.
 */
export function RoadMotif({ height = 220 }: RoadMotifProps) {
  return (
    <Svg
      width="100%"
      height={height}
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMax slice"
    >
      <Path
        d={ROAD_PATH}
        stroke="#6B5D53"
        strokeWidth={20}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d={ROAD_PATH}
        stroke="#FBF6EC"
        strokeWidth={2.5}
        strokeDasharray="12 10"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

export default RoadMotif;
