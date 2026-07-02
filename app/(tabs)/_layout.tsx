import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';

import { palette } from '@/theme/colors';

/**
 * Bottom tab navigator: Home (search), Offer a ride, Profile.
 * Icons are simple emoji glyphs for now — swapped for a proper icon set when
 * the individual screens are built. Large label text keeps tabs legible in a
 * moving vehicle.
 */
function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ fontSize: 22, color }}>{glyph}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: palette.cream },
        headerTitleStyle: { fontFamily: 'Baloo2_600SemiBold', fontSize: 20 },
        headerTintColor: palette.ink,
        tabBarActiveTintColor: palette.brand,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: palette.cream,
          borderTopColor: '#E5DCC8', // one-off: cream darkened a step for the hairline
        },
        tabBarLabelStyle: { fontSize: 13, fontFamily: 'Baloo2_600SemiBold' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Find a ride',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon glyph="🔍" color={color} />,
        }}
      />
      <Tabs.Screen
        name="offer-ride"
        options={{
          title: 'Offer a ride',
          tabBarLabel: 'Offer',
          tabBarIcon: ({ color }) => <TabIcon glyph="🚗" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon glyph="👤" color={color} />,
        }}
      />
    </Tabs>
  );
}
