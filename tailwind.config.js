/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Warm, hand-painted Ghibli-ish palette grounded in two local motifs:
        // misty Sikkim mountain lakes (brand) and Tibetan prayer flags
        // (blue/white/red/green/yellow, traditionally sky-air-fire-water-earth).
        // Kept high-contrast against `cream` — still meant to be glanceable in
        // a moving vehicle, just warmer than a stock corporate palette.
        brand: {
          DEFAULT: '#3C8F86', // misty lake teal
          dark: '#245F58',
          light: '#DCF1EE',
        },
        prayer: {
          blue: '#3E7CB1',
          white: '#FDFBF6',
          red: '#D1483E',
          green: '#5B8C5A',
          yellow: '#E8B23D',
        },
        sunset: '#E8935A', // dusk glow over the ranges
        mountain: {
          DEFAULT: '#5D7A9A', // mid-distance ridge blue
          deep: '#3A5273', // far ridge, near-silhouette
          mist: '#C9D7E0', // low haze between ridges
        },
        cream: '#FBF6EC', // warm parchment background, replaces stark white
        ink: '#3B2E2A', // warm near-black text, replaces cold slate
        muted: '#7A6B60', // warm gray-brown for secondary text
      },
      fontFamily: {
        // Baloo 2 is a round, friendly display face — the "cute logo /
        // storybook" feel comes through mostly in headings; body copy stays
        // legible at the larger sizes this app already defaults to.
        display: ['Baloo2_700Bold'],
        heading: ['Baloo2_600SemiBold'],
        body: ['Baloo2_500Medium'],
        'body-regular': ['Baloo2_400Regular'],
      },
      fontSize: {
        // Larger defaults than web — glanceable while driving.
        base: ['17px', '24px'],
        lg: ['20px', '28px'],
        xl: ['24px', '32px'],
      },
    },
  },
  plugins: [],
};
