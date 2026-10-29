import type { Form } from "@form-core/form";
import type { PlatformUrlPort } from "@core/router/ports/PlatformUrlPort";
import { useFormUrlSync } from "./useFormUrlSync";

export interface UseFilterUrlSyncOptions<T extends Record<string, any>> {
  form: Form<T>;
  /** Optional namespace scope (e.g. "filters", "products"). Prevents param collisions. */
  scope?: string;
  /** Injected URL adapter port for decoupling from router. */
  port?: PlatformUrlPort;
  /**
   * How long to wait after the last keystroke before writing to the URL.
   * Defaults to 300ms to prevent flooding the browser history API.
   */
  debounceMs?: number;
  /**
   * Transforms Engine Data (e.g. Dates, Arrays) into simple string records for the URL.
   * Omitting undefined or empty strings keeps the URL clean.
   */
  serialize?: (values: T) => Record<string, string | string[]>;
  /**
   * Transforms raw URL strings back into strongly-typed Engine Data (e.g. "18" -> 18).
   */
  deserialize?: (params: URLSearchParams) => Partial<T>;
  /**
   * If true, uses history.replaceState (doesn't add to back-button history).
   * Defaults to true for inline typing.
   */
  replaceHistory?: boolean;
}

/**
 * Bi-Directional URL Synchronization Hook
 *
 * Safely bridges a Headless Form Engine to the Browser's URL Parameters.
 * - Engine ➡️ URL (Debounced, Serialized, Non-destructive)
 * - URL ➡️ Engine (Back-button safe & Hydrated)
 *
 * Now backed by PlatformUrlPort and useFormUrlSync to preserve existing
 * query parameters (table sort, pagination, global search).
 */
export function useFilterUrlSync<T extends Record<string, any>>({
  form,
  scope,
  port,
  debounceMs = 300,
  serialize,
  deserialize,
  replaceHistory = true,
}: UseFilterUrlSyncOptions<T>) {
  return useFormUrlSync({
    form,
    scope,
    port,
    debounceMs,
    serialize,
    deserialize,
    replaceHistory,
  });
}
