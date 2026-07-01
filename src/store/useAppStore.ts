import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import type { Profile } from '@/types/models';

/**
 * Global app state.
 *
 * Phase 1 keeps this minimal: the Supabase auth session and the current user's
 * profile row. Later phases add things like a "pending booking to resume after
 * KYC" slot (the verification-gate flow) and driver-mode state — those hang off
 * this same store so the resume-after-verify handoff stays in one place.
 */
interface AppState {
  session: Session | null;
  profile: Profile | null;
  /** True until the initial session load completes (splash/gate decisions). */
  initializing: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setInitializing: (initializing: boolean) => void;
  /** Convenience for logout / auth reset. */
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  session: null,
  profile: null,
  initializing: true,

  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setInitializing: (initializing) => set({ initializing }),
  reset: () => set({ session: null, profile: null }),
}));

/** Selector: is the current user KYC-verified? Used by the booking gate later. */
export const selectIsVerified = (state: AppState): boolean =>
  state.profile?.kyc_status === 'verified';
