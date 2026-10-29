import React from "react";

import { useAuthStore } from "@features/auth/store/auth.store";

/**
 * SessionGuard
 *
 * Gates app rendering behind authentication ONLY. It no longer renders a
 * fullscreen overlay when the workspace (company / business unit) context is
 * not stable — instead the routed shell redirects the user to /workspace where
 * they set up their session (see RootLayout / WorkspacePage).
 */
export const SessionGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // ✅ Let GlobalBoot handle auth
  if (!isAuthenticated) return null;

  // ✅ Authenticated — render the app shell (workspace routing handled in-shell)
  return <>{children}</>;
};
