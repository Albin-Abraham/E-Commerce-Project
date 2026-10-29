// src/configs/api/axios/interceptor/axios.auth.interceptor.ts
/**
 * @fileoverview Authentication Interceptor Plugin
 *
 * Handles automatic token injection and silent token refresh for authenticated requests.
 *
 * ## Refresh Strategy
 *
 * ### Proactive (before request)
 * Checks `isTokenExpired()` before sending. If expired, triggers a silent refresh
 * so the outgoing request always carries a valid token.
 *
 * ### Reactive (on 401)
 * If the server returns 401, attempts one silent refresh and retries the failed request.
 * If the refresh itself fails, clears auth and dispatches `auth:error`.
 *
 * ### RequestQueue (refresh mutex)
 * While a refresh is in-flight, subsequent requests are parked in a `RequestQueue`
 * as `{resolve, reject}` callbacks. When refresh settles:
 *   - SUCCESS → all queued requests are resolved with the new token and retried
 *   - FAILURE → all queued requests are rejected and the user is logged out
 *
 * This prevents token refresh stampedes without relying on implicit promise sharing.
 *
 * @module configs/api/axios/interceptors/axios.auth.interceptor
 */
import axios from "axios";
import type {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import { ApiEndpoints } from "@configs/api/endpoints";
import type { PluginModule } from "@configs/type/interceptor";

import { useAuthStore } from "@features/auth/store/auth.store";

// ─── Request Queue ────────────────────────────────────────────────────────────

type QueueEntry = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let requestQueue: QueueEntry[] = [];

/** Park a request until the in-flight refresh settles. */
function enqueueRequest(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    requestQueue.push({ resolve, reject });
  });
}

/** Resolve all queued requests with the new access token. */
function flushQueue(newToken: string): void {
  requestQueue.forEach(({ resolve }) => resolve(newToken));
  requestQueue = [];
}

/** Reject all queued requests (refresh failed — session unrecoverable). */
function drainQueue(error: unknown): void {
  requestQueue.forEach(({ reject }) => reject(error));
  requestQueue = [];
}

// ─── Token Refresh ────────────────────────────────────────────────────────────

/**
 * Perform a token refresh via a bare axios call (no interceptors on this call
 * to avoid recursive loops). Updates the Zustand store on success.
 */
async function performRefresh(): Promise<string> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) throw new Error("No refresh token available.");

  // Bare axios — bypasses all interceptors on this instance
  const response = await axios.post(ApiEndpoints.Auth.Refresh, {
    refresh: refreshToken,
  });

  const body = response.data;

  // Extract access token from multiple response formats
  // 1. Unified envelope: { status, message, detail: { access, refresh } }
  // 2. Legacy envelope:  { data: { access, refresh } }
  // 3. Raw:             { access, refresh }
  let access: string | undefined;
  let newRefreshToken: string | undefined;

  if (body && typeof body === "object") {
    if (
      body.status !== undefined &&
      body.detail &&
      typeof body.detail === "object"
    ) {
      // Unified envelope
      access = body.detail.access;
      newRefreshToken = body.detail.refresh;
    } else if (body.data && typeof body.data === "object") {
      // Legacy envelope
      access = body.data.access;
      newRefreshToken = body.data.refresh;
    } else {
      // Raw
      access = body.access;
      newRefreshToken = body.refresh;
    }
  }

  if (!access) throw new Error("Refresh response contained no access token.");

  // Decode new expiry
  let tokenExpiry: number | null = null;
  try {
    const { jwtDecode } = await import("jwt-decode");
    const decoded = jwtDecode<{ exp: number }>(access);
    tokenExpiry = decoded.exp ?? null;
  } catch {
    // Non-fatal — expiry check will treat null as expired on next request
  }

  // Store new access token + expiry. Also store rotated refresh token if present.
  useAuthStore.setState((s) => ({
    ...s,
    accessToken: access,
    tokenExpiry,
    ...(newRefreshToken ? { refreshToken: newRefreshToken } : {}),
  }));
  return access;
}

/**
 * Entry point for any code that needs a fresh token.
 *
 * - If no refresh is running → starts one, flushes or drains the queue on completion
 * - If a refresh is already running → parks the caller in the RequestQueue
 */
async function getRefreshedToken(): Promise<string> {
  if (isRefreshing) {
    // Park this caller until the in-flight refresh resolves
    return enqueueRequest();
  }

  isRefreshing = true;

  try {
    const newToken = await performRefresh();
    flushQueue(newToken); // Unblock all queued requests with the new token
    return newToken;
  } catch (error) {
    drainQueue(error); // Reject all queued requests
    throw error;
  } finally {
    isRefreshing = false;
  }
}

// ─── Auth Error Helpers ───────────────────────────────────────────────────────

function forceLogout(status?: number): void {
  useAuthStore.getState().clearAuth();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:error", { detail: { status } }));
  }
}

function injectToken(config: InternalAxiosRequestConfig, token: string): void {
  if (config.headers && typeof config.headers.set === "function") {
    config.headers.set("Authorization", `Bearer ${token}`);
  } else if (config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
}

// ─── Request Interceptor ──────────────────────────────────────────────────────

const requestInterceptor = async (
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> => {
  const { accessToken, refreshToken, isTokenExpired } = useAuthStore.getState();

  // No access token at all — try to obtain one via the refresh token before
  // sending, otherwise the request would go out with no Authorization header
  // and the backend would return 401 (this affects session + profile calls).
  if (!accessToken && refreshToken) {
    try {
      const freshToken = await getRefreshedToken();
      injectToken(config, freshToken);
    } catch {
      if (import.meta.env.MODE === "development") {
        console.warn(
          "[AuthInterceptor] No access token and refresh failed — sending unauthenticated request."
        );
      }
    }
    return finalize(config);
  }

  if (accessToken) {
    if (isTokenExpired()) {
      // Proactive refresh — get a fresh token before the request goes out
      try {
        const freshToken = await getRefreshedToken();
        injectToken(config, freshToken);
      } catch {
        // Fall back to the existing access token
        injectToken(config, accessToken);
        if (import.meta.env.MODE === "development") {
          console.warn(
            "[AuthInterceptor] Proactive refresh failed — sending anyway."
          );
        }
      }
    } else {
      injectToken(config, accessToken);
    }
  }

  return finalize(config);
};

/** Appends audit headers and returns the finalized request config. */
function finalize(config: InternalAxiosRequestConfig) {
  // Audit header
  try {
    const path = window.location?.pathname || "/";
    if (config.headers && typeof config.headers.set === "function") {
      config.headers.set("Frontend-Path", path);
    } else if (config.headers) {
      config.headers["Frontend-Path"] = path;
    }
  } catch {
    // Non-fatal
  }

  return config;
}

const requestErrorInterceptor = (error: AxiosError): Promise<never> => {
  if (import.meta.env.MODE === "development") {
    console.error("[AuthInterceptor] Request interceptor error:", error);
  }
  return Promise.reject(error);
};

// ─── Response Interceptors ────────────────────────────────────────────────────

const responseInterceptor = (response: AxiosResponse): AxiosResponse =>
  response;

/**
 * Reactive refresh: on 401, attempt one silent token refresh via the RequestQueue
 * and retry the original request. The `_retried` flag prevents infinite loops.
 */
const createResponseErrorInterceptor = (axiosInstance: AxiosInstance) => {
  return async (error: AxiosError): Promise<AxiosResponse | never> => {
    const config = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };
    const status = error.response?.status;

    if (status === 401 && config && !config._retried) {
      config._retried = true;

      try {
        // Goes through the same RequestQueue — if another refresh is already
        // running (from the proactive path), this parks in the queue instead
        // of firing a duplicate refresh request.
        const newToken = await getRefreshedToken();
        injectToken(config, newToken);
        return await axiosInstance(config); // Retry using the SAME instance
      } catch {
        forceLogout(401);
        return Promise.reject(error);
      }
    }

    if (status === 403) {
      if (import.meta.env.MODE === "development") {
        console.warn("[AuthInterceptor] 403 Forbidden:", config?.url);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("auth:error", { detail: { status, error } })
        );
      }
    }

    return Promise.reject(error);
  };
};

// ─── Boot-time Session Recovery ───────────────────────────────────────────────

/**
 * Validates and silently restores a hydrated session before the app shell mounts.
 *
 * When the app boots with a persisted `isAuthenticated: true` but the access
 * token is missing or expired, this performs a silent token refresh so the
 * workspace + profile queries don't fire unauthenticated (which would 401 and
 * cascade into a cleared, stranded session).
 *
 * @returns true if a usable session exists (tokens present or refreshed),
 *          false if auth should be cleared (user must log in again).
 */
export async function attemptSessionRecovery(): Promise<boolean> {
  const { accessToken, refreshToken, isAuthenticated, tokenExpiry } =
    useAuthStore.getState();

  if (!isAuthenticated) return false;

  // Valid token already present and not near expiry — nothing to do.
  const EXPIRY_BUFFER_SECONDS = 30;
  if (
    accessToken &&
    tokenExpiry &&
    Date.now() / 1000 < tokenExpiry - EXPIRY_BUFFER_SECONDS
  ) {
    return true;
  }

  // No usable access token — try a silent refresh; fall back to clearing auth.
  if (refreshToken) {
    // Derive timeout from token age: if token expired long ago, fail fast.
    // - < 60s expired  → 8s timeout (likely still valid on server)
    // - 60s–300s       → 5s timeout (probably stale)
    // - > 300s          → skip refresh, force logout
    const timeSinceExpiry = tokenExpiry
      ? Date.now() / 1000 - tokenExpiry
      : Infinity;
    if (timeSinceExpiry > 300) {
      if (import.meta.env.MODE === "development") {
        console.warn(
          "[AuthInterceptor] Session expired too long ago, skipping recovery."
        );
      }
    } else {
      const refreshTimeoutMs = timeSinceExpiry < 60 ? 8_000 : 5_000;
      try {
        const refreshPromise = getRefreshedToken();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Session recovery timed out")),
            refreshTimeoutMs
          )
        );

        await Promise.race([refreshPromise, timeoutPromise]);
        return true;
      } catch (error) {
        if (import.meta.env.MODE === "development") {
          console.warn(
            "[AuthInterceptor] Session recovery refresh failed.",
            error
          );
        }
      }
    }
  }

  forceLogout(401);
  return false;
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export const AuthInterceptorPlugin: PluginModule = {
  name: "AuthInterceptor",
  enabled: (type: "public" | "auth") => type === "auth",

  apply: (axiosInstance: AxiosInstance) => {
    axiosInstance.interceptors.request.use(
      requestInterceptor,
      requestErrorInterceptor
    );

    axiosInstance.interceptors.response.use(
      responseInterceptor,
      createResponseErrorInterceptor(axiosInstance)
    );

    if (import.meta.env.MODE === "development") {
      console.info("[AuthInterceptor] Plugin applied successfully");
    }
  },
};
