const { palette } = require('./src/theme/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // The app is fixed-light (userInterfaceStyle: 'light' in app.config.ts;
  // no screen has dark-mode styling). 'class' avoids NativeWind's web
  // runtime throwing when anything touches color-scheme APIs under the
  // default 'media' strategy — nothing here ever adds a `.dark` class.
  darkMode: 'class',
  theme: {
    extend: {
      // Color values (and the palette rationale) live in src/theme/colors.js,
      // shared with JS-side styling; this maps them onto className tokens.
      colors: {
        brand: {
          DEFAULT: palette.brand,
          dark: palette.brandDark,
          light: palette.brandLight,
        },
        prayer: {
          blue: palette.prayerBlue,
          white: palette.prayerWhite,
          red: palette.prayerRed,
          green: palette.prayerGreen,
          yellow: palette.prayerYellow,
        },
        sunset: palette.sunset,
        mountain: {
          DEFAULT: palette.mountain,
          deep: palette.mountainDeep,
          mist: palette.mountainMist,
        },
        cream: palette.cream,
        ink: palette.ink,
        muted: palette.muted,
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
