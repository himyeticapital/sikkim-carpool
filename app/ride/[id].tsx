import { useLocalSearchParams } from 'expo-router';

import { PhasePlaceholder } from '@/components/PhasePlaceholder';

export default function RideDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PhasePlaceholder
      title="Ride details"
      phase="Ride Details + Booking"
      description={`Map preview, driver card, fare, and "Book seat" (with the just-in-time verification gate). Ride id: ${id ?? '—'}`}
    />
  );
}
