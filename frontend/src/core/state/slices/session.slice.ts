/**
 * Global Session Slice
 *
 * Tracks session tokens, active timestamp markers, and session expiration countdowns.
 */

export interface SessionSliceState {
  lastActiveTimestamp: number;
  sessionTimeoutMs: number;
  isSessionExpired: boolean;
  setLastActive: (timestamp?: number) => void;
  markSessionExpired: (expired: boolean) => void;
  resetSessionState: () => void;
}

const INITIAL_STATE = {
  lastActiveTimestamp: Date.now(),
  sessionTimeoutMs: 30 * 60 * 1000, // 30 minutes
  isSessionExpired: false,
};

export const createSessionSlice = (
  set: (fn: (state: SessionSliceState) => Partial<SessionSliceState>) => void
): SessionSliceState => ({
  ...INITIAL_STATE,
  setLastActive: (timestamp = Date.now()) =>
    set((state) => ({ ...state, lastActiveTimestamp: timestamp })),
  markSessionExpired: (isSessionExpired: boolean) =>
    set((state) => ({ ...state, isSessionExpired })),
  resetSessionState: () => set((state) => ({ ...state, ...INITIAL_STATE })),
});
