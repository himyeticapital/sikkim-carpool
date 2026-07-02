import type { WithSpringConfig } from 'react-native-reanimated';

/**
 * Motion tokens — every animation in the app draws from these three springs
 * so the whole product moves with one personality: quick to respond, soft to
 * settle, celebratory only when something worth celebrating happened.
 */
export const springs = {
  /** Press feedback and control thumbs — immediate, no visible bounce. */
  press: { damping: 22, stiffness: 320, mass: 0.7 },
  /** Content settling into place. */
  gentle: { damping: 18, stiffness: 190 },
  /** One-off celebratory pops (booking success). */
  pop: { damping: 13, stiffness: 210 },
} as const satisfies Record<string, WithSpringConfig>;

/** Cascade delay for the i-th item of a list entrance (capped so long lists don't crawl). */
export function staggerDelay(index: number, step = 55, max = 440): number {
  return Math.min(index * step, max);
}
