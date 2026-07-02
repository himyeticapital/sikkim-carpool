import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

interface DateFieldProps {
  mode: 'date' | 'time';
  value: Date;
  onChange: (date: Date) => void;
  label: string;
  minimumDate?: Date;
  className?: string;
}

/** Tap-to-open native date/time picker. See DateField.tsx for the web sibling. */
export function DateField({
  mode,
  value,
  onChange,
  label,
  minimumDate,
  className,
}: DateFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <>
      <Pressable onPress={() => setShow(true)} className={className}>
        <Text className="font-body text-base text-ink">{label}</Text>
      </Pressable>
      {show ? (
        <RNDateTimePicker
          value={value}
          mode={mode}
          minimumDate={minimumDate}
          onChange={(_event, date) => {
            setShow(false);
            if (date) onChange(date);
          }}
        />
      ) : null}
    </>
  );
}

export default DateField;
