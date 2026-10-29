import { useThemeStore } from "@core/state/theme.store";
import type { ThemeState } from "@core/state/theme.store";

import { useAuthStore } from "@features/auth/store/auth.store";
import type { AuthState } from "@features/auth/store/auth.store";

/**
 * GlobalState Interface
 *
 * Unifies all individual store states into a single predictable type.
 */
export interface GlobalState {
  auth: AuthState;
  theme: ThemeState;
}

/**
 * Utility to combine states from different stores safely outside React.
 */
export const getGlobalState = (): GlobalState => {
  return {
    auth: useAuthStore.getState(),
    theme: useThemeStore.getState(),
  };
};
