import { PhasePlaceholder } from '@/components/PhasePlaceholder';

export default function VerifyPendingScreen() {
  return (
    <PhasePlaceholder
      title="Confirming your verification"
      phase="Verification Gate"
      description="Shown while the DigiLocker callback resolves. On success we finish your booking automatically and hand you the driver's WhatsApp contact."
    />
  );
}
