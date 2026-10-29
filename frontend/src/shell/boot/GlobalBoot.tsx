import React, { Suspense, lazy } from "react";

import { useThemeStore } from "@core/state/theme.store";
import { PageSkeleton } from "@ui/PageSkeleton";

import { attemptSessionRecovery } from "@configs/api/axios/utils/interceptors/axios.auth.interceptor";

import { useAuthStore } from "@features/auth/store/auth.store";

import { toastError } from "@shared/ui/Toast";

import { SessionGuard } from "./SessionGuard";

/**
 * Resilient lazy helper — retries once on Vite chunk load failures.
 * Vite throws `TypeError: error loading dynamically imported module` when
 * the underlying module evaluation throws or the chunk 404s after HMR.
 * A single retry (or hard reload if retry fails) recovers without manual refresh.
 */
function lazyWithRetry<T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  key: string
) {
  return lazy(async () => {
    const storageKey = `lazy-retry:${key}`;
    try {
      return await importer();
    } catch (err: any) {
      const message: string = err?.message ?? "";
      const isChunkError =
        message.includes("dynamically imported module") ||
        message.includes("Failed to fetch") ||
        message.includes("ChunkLoadError") ||
        message.includes("error loading") ||
        err?.name === "ChunkLoadError";

      console.error(`[GlobalBoot] Lazy chunk load failed (${key}):`, err);

      if (isChunkError) {
        const canUseStorage = typeof sessionStorage !== "undefined";
        const lastReload = canUseStorage
          ? sessionStorage.getItem(storageKey)
          : null;
        const now = Date.now();
        if (!lastReload || now - Number(lastReload) > 10_000) {
          if (canUseStorage) sessionStorage.setItem(storageKey, String(now));
          await new Promise((r) => setTimeout(r, 300));
          try {
            return await importer();
          } catch (retryErr) {
            console.error("[GlobalBoot] Retry failed, hard reloading:", retryErr);
            if (typeof window !== "undefined") window.location.reload();
            throw retryErr;
          }
        }
      }
      throw err;
    }
  });
}

const AppBoot = lazyWithRetry(
  () => import("@core/providers/RouterProvider"),
  "app-boot"
);
const AuthBoot = lazyWithRetry(() => import("./AuthBoot"), "auth-boot");

const useHydrationGuard = () => {
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    const check = () => {
      const authReady = useAuthStore.persist.hasHydrated();
      const themeReady = useThemeStore.persist.hasHydrated();

      if (authReady && themeReady) {
        setIsHydrated(true);
      }
    };

    check();

    const unsubAuth = useAuthStore.persist.onFinishHydration(check);
    const unsubTheme = useThemeStore.persist.onFinishHydration(check);

    return () => {
      unsubAuth();
      unsubTheme();
    };
  }, []);

  return isHydrated;
};

export const GlobalBoot: React.FC = () => {
  const isHydrated = useHydrationGuard();
  const [isRecovering, setIsRecovering] = React.useState(true);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // After hydration, silently restore/validate a persisted session BEFORE the
  // app shell (and its workspace/profile queries) mounts. This prevents a batch
  // of unauthenticated requests when a stale session is hydrated.
  React.useEffect(() => {
    if (isHydrated) {
      let cancelled = false;
      attemptSessionRecovery().finally(() => {
        if (!cancelled) setIsRecovering(false);
      });
      return () => {
        cancelled = true;
      };
    }
  }, [isHydrated]);

  // Listen for forced logout events (e.g., refresh token expired, 403 Forbidden)
  // and show a user-facing notification before the redirect to login.
  React.useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const status = detail?.status;
      if (status === 403) {
        toastError(
          "Access Denied",
          "You do not have permission to perform this action."
        );
      } else {
        toastError("Session Expired", "Please sign in again.");
      }
    };
    window.addEventListener("auth:error", handler);
    return () => window.removeEventListener("auth:error", handler);
  }, []);

  if (!isHydrated || isRecovering) {
    return <PageSkeleton />;
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      {!isAuthenticated ? (
        <AuthBoot />
      ) : (
        <SessionGuard>
          <AppBoot />
        </SessionGuard>
      )}
    </Suspense>
  );
};
