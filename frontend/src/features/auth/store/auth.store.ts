import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storeRegistry } from "@core/state/StoreRegistry";

import type { AuthUser } from "@features/auth/services/auth.types";
import type { SessionContext } from "@features/auth/services/session.types";


/**
 * Authentication State
 */
export interface AuthState {
  /** The currently authenticated user */
  user: AuthUser | null;
  /** Access token */
  accessToken: string | null;
  /** Refresh token — long-lived, used to obtain new access tokens */
  refreshToken: string | null;
  /** Token expiry as Unix timestamp (seconds), derived from JWT exp claim */
  tokenExpiry: number | null;
  /** True if the user is authenticated */
  isAuthenticated: boolean;

  /**
   * Hierarchical Session Context
   * Tracks current selection of Company -> BU -> Branch
   */
  sessionContext: SessionContext;

  /** Actions */
  setAuth: (
    user: AuthUser | null,
    accessToken: string,
    tokenExpiry?: number | null,
    refreshToken?: string | null
  ) => void;
  setRefreshToken: (refreshToken: string) => void;
  setTokenOnly: (accessToken: string, tokenExpiry: number | null) => void;
  isTokenExpired: () => boolean;
  clearAuth: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

const DEFAULT_SESSION_CONTEXT: SessionContext = {
  company: null,
  businessUnit: null,
  branch: null,
  isStable: false,
};

/** Keys that should exist on a valid AuthUser — used to detect corrupted state */
const AUTH_USER_KEYS = ["email"];

function isValidAuthUser(user: unknown): user is AuthUser {
  if (!user || typeof user !== "object") return false;
  return AUTH_USER_KEYS.every(
    (key) => key in (user as Record<string, unknown>)
  );
}

/**
 * Auth Store
 *
 * Manages the global authentication state using Zustand.
 * Persists the user profile and session context to localStorage.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      isAuthenticated: false,
      sessionContext: DEFAULT_SESSION_CONTEXT,

      setAuth: (user, accessToken, tokenExpiry = null, refreshToken = null) =>
        set({
          // Guard: never store a corrupted user object (e.g. an error response)
          user: isValidAuthUser(user) ? user : null,
          accessToken,
          refreshToken,
          tokenExpiry,
          isAuthenticated: true,
        }),

      setRefreshToken: (refreshToken) => set({ refreshToken }),

      setTokenOnly: (accessToken, tokenExpiry) =>
        set({ accessToken, tokenExpiry }),

      isTokenExpired: () => {
        const { tokenExpiry } = get();
        if (!tokenExpiry) return true;
        // 30-second buffer: refresh before the token actually expires to avoid
        // race conditions where a request in flight receives a 401 while the
        // token is valid on the client but expired by the time the server sees it.
        const EXPIRY_BUFFER_SECONDS = 30;
        return Date.now() / 1000 > tokenExpiry - EXPIRY_BUFFER_SECONDS;
      },

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          tokenExpiry: null,
          isAuthenticated: false,
          sessionContext: DEFAULT_SESSION_CONTEXT,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, ...updates }
            : isValidAuthUser(updates)
              ? (updates as AuthUser)
              : state.user,
        })),
    }),
    {
      name: "auth-storage",
      version: 3,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenExpiry: state.tokenExpiry,
        sessionContext: state.sessionContext,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const isZombie =
            (state.isAuthenticated && !state.accessToken && !state.refreshToken) ||
            (state.user != null &&
              typeof state.user === "object" &&
              !isValidAuthUser(state.user));
          if (isZombie) {
            state.clearAuth();
          }
        }
      },
      // Migrate: detect and clear zombie auth state from corrupted localStorage.
      migrate: (persistedState: unknown, _version: number) => {
        const state = persistedState as Record<string, unknown> | null;
        if (state && typeof state === "object") {
          const user = state.user;
          const isAuthenticated = state.isAuthenticated;
          const accessToken = state.accessToken;
          const refreshToken = state.refreshToken;

          const isZombie =
            // Zombie: authenticated but no tokens at all
            (isAuthenticated && !accessToken && !refreshToken) ||
            // Corrupted: user is an error object, not an AuthUser
            (user != null &&
              typeof user === "object" &&
              !isValidAuthUser(user));

          if (isZombie) {
            // Return the clean default state — this replaces the corrupted persisted state
            return {
              user: null,
              accessToken: null,
              refreshToken: null,
              tokenExpiry: null,
              isAuthenticated: false,
              sessionContext: DEFAULT_SESSION_CONTEXT,
            } as AuthState;
          }
        }
        return persistedState as AuthState;
      },
    }
  )
);

storeRegistry.register(
  "authStore",
  () => useAuthStore.getState(),
  () => useAuthStore.getState().clearAuth()
);


