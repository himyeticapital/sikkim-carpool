import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * Drifting valley mist, drawn by a Skia fragment shader — fbm value noise
 * scrolled slowly sideways, fading toward the top so it reads as haze
 * settling between the ridges of MountainBackdrop underneath. Alpha stays
 * low: the effect should be felt, not noticed. Native-only (the .tsx
 * sibling is the web no-op); a shader-compile failure renders nothing.
 */
const MIST_SKSL = `
uniform float u_time;
uniform float2 u_size;

float hash(float2 p) {
  return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453123);
}

float noise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + float2(1.0, 0.0)), u.x),
    mix(hash(i + float2(0.0, 1.0)), hash(i + float2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(float2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.1;
    a *= 0.5;
  }
  return v;
}

half4 main(float2 xy) {
  float2 uv = xy / u_size;
  // Two layers drifting at different speeds gives the mist parallax.
  float near = fbm(float2(uv.x * 3.0 + u_time * 0.045, uv.y * 2.2 + 7.0));
  float far  = fbm(float2(uv.x * 5.0 - u_time * 0.025, uv.y * 3.5 + 2.0));
  float density = smoothstep(0.38, 0.85, near * 0.65 + far * 0.35);
  // Heavier low in the frame, gone by the ridge tops.
  density *= smoothstep(0.05, 0.75, uv.y);
  float a = density * 0.4;
  half3 mist = half3(0.788, 0.843, 0.878); // palette mountainMist #C9D7E0
  return half4(mist * a, a);
}
`;

const effect = Skia.RuntimeEffect.Make(MIST_SKSL);

export function MistOverlay({ height = 200 }: { height?: number }) {
  const [width, setWidth] = useState(0);
  const time = useSharedValue(0);

  useEffect(() => {
    // 0→600s of shader time over 10 real minutes, looped; the noise field is
    // aperiodic so the wrap is imperceptible at this drift speed.
    time.value = withRepeat(
      withTiming(600, { duration: 600000, easing: Easing.linear }),
      -1,
    );
  }, [time]);

  const uniforms = useDerivedValue(() => ({
    u_time: time.value,
    u_size: [width, height] as [number, number],
  }));

  if (!effect) return null;

  return (
    <View
      pointerEvents="none"
      style={{ height, width: '100%' }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <Canvas style={{ flex: 1 }}>
          <Fill>
            <Shader source={effect} uniforms={uniforms} />
          </Fill>
        </Canvas>
      ) : null}
    </View>
  );
}

export default MistOverlay;
