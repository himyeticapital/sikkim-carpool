import { createElement } from 'react';
import { View } from 'react-native';

interface DateFieldProps {
  mode: 'date' | 'time';
  value: Date;
  onChange: (date: Date) => void;
  label: string;
  minimumDate?: Date;
  className?: string;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/**
 * Web sibling of DateField.native.tsx — @react-native-community/datetimepicker
 * renders null on web, so this uses a real HTML date/time input instead.
 * `label` is accepted for prop-shape parity with native but unused: the
 * browser draws its own control chrome.
 */
export function DateField({ mode, value, onChange, minimumDate, className }: DateFieldProps) {
  const dateStr = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  const timeStr = `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  const min = minimumDate
    ? `${minimumDate.getFullYear()}-${pad(minimumDate.getMonth() + 1)}-${pad(minimumDate.getDate())}`
    : undefined;

  return (
    <View className={className}>
      {createElement('input', {
        type: mode,
        value: mode === 'date' ? dateStr : timeStr,
        min: mode === 'date' ? min : undefined,
        onChange: (e: { target: { value: string } }) => {
          const raw = e.target.value;
          if (!raw) return;
          if (mode === 'date') {
            const [y, m, d] = raw.split('-').map(Number);
            onChange(new Date(y, m - 1, d, value.getHours(), value.getMinutes()));
          } else {
            const [h, min2] = raw.split(':').map(Number);
            onChange(new Date(value.getFullYear(), value.getMonth(), value.getDate(), h, min2));
          }
        },
        style: {
          border: 'none',
          background: 'transparent',
          font: 'inherit',
          color: 'inherit',
          width: '100%',
          outline: 'none',
        },
      })}
    </View>
  );
}

export default DateField;
