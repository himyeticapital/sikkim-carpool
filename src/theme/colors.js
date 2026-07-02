/**
 * The app palette — the single source of truth for color values.
 *
 * Plain CommonJS on purpose: tailwind.config.js requires it (className tokens
 * like `bg-brand` resolve to these), and TS code imports it (typed via
 * colors.d.ts) for the places className can't reach — ActivityIndicator,
 * placeholderTextColor, SVG fills, navigation options.
 *
 * Palette rationale: warm, hand-painted Ghibli-ish colors grounded in two
 * local motifs — misty Sikkim mountain lakes (brand) and Tibetan prayer flags
 * (blue/white/red/green/yellow, traditionally sky-air-fire-water-earth).
 * Kept high-contrast against `cream`: glanceable in a moving vehicle.
 */
const palette = {
  brand: '#3C8F86', // misty lake teal
  brandDark: '#245F58',
  brandLight: '#DCF1EE',
  prayerBlue: '#3E7CB1',
  prayerWhite: '#FDFBF6',
  prayerRed: '#D1483E',
  prayerGreen: '#5B8C5A',
  prayerYellow: '#E8B23D',
  sunset: '#E8935A', // dusk glow over the ranges
  mountain: '#5D7A9A', // mid-distance ridge blue
  mountainDeep: '#3A5273', // far ridge, near-silhouette
  mountainMist: '#C9D7E0', // low haze between ridges
  cream: '#FBF6EC', // warm parchment background, replaces stark white
  ink: '#3B2E2A', // warm near-black text, replaces cold slate
  muted: '#7A6B60', // warm gray-brown for secondary text
};

module.exports = { palette };
