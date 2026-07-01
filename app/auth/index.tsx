import { PhasePlaceholder } from '@/components/PhasePlaceholder';

export default function AuthScreen() {
  return (
    <PhasePlaceholder
      title="Sign in"
      phase="Auth"
      description="Phone number + OTP via Supabase. No ID check here — verification is only asked for at your first booking."
    />
  );
}
