import { Pressable, Text, View } from 'react-native';

interface SegmentedControlProps<K extends string> {
  options: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}

/** Equal-width segment toggle (the My Rides Booked/Offered switcher). */
export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<K>) {
  return (
    <View className="flex-row rounded-full bg-mountain-mist p-1">
      {options.map(({ key, label }) => (
        <Pressable
          key={key}
          onPress={() => onChange(key)}
          className={`flex-1 items-center rounded-full py-2 ${
            value === key ? 'bg-white' : ''
          }`}
        >
          <Text
            className={`font-heading text-base ${
              value === key ? 'text-ink' : 'text-muted'
            }`}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
