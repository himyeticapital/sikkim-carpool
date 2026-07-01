import { PhasePlaceholder } from '@/components/PhasePlaceholder';

export default function DigiLockerConsentScreen() {
  return (
    <PhasePlaceholder
      title="Verify with DigiLocker"
      phase="Verification Gate"
      description="One-time Aadhaar-based ID check via DigiLocker's consent flow. We store only a reference, never your Aadhaar number."
    />
  );
}
