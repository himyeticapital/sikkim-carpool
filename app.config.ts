import type { ExpoConfig, ConfigContext } from 'expo/config';

// Google Maps native SDK keys are read from the environment so they never get
// committed. The same key powers Places Autocomplete / Directions on the JS side
// via EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (see src/services/places.ts).
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Sikkim Carpool',
  slug: 'sikkim-carpool',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  // Custom scheme is required for Expo Router deep links and for the DigiLocker
  // OAuth redirect that lands the user back in the app (wired in a later phase).
  scheme: 'sikkimcarpool',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.sikkimcarpool.app',
    config: {
      googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    },
    infoPlist: {
      // Location is used to default the "from" field to the rider's current spot.
      NSLocationWhenInUseUsageDescription:
        'Sikkim Carpool uses your location to suggest nearby pickup points and set your starting point.',
    },
  },
  android: {
    package: 'com.sikkimcarpool.app',
    adaptiveIcon: {
      backgroundColor: '#FBF6EC',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        apiKey: GOOGLE_MAPS_API_KEY,
      },
    },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-status-bar',
    'expo-font',
    [
      'expo-splash-screen',
      {
        // Warm cream, matching the app's Ghibli-inspired background — see
        // tailwind.config.js `cream` token.
        backgroundColor: '#FBF6EC',
        image: './assets/icon.png',
        imageWidth: 160,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Sikkim Carpool uses your location to suggest nearby pickup points and set your starting point.',
      },
    ],
    '@react-native-community/datetimepicker',
  ],
  experiments: {
    typedRoutes: true,
  },
});
