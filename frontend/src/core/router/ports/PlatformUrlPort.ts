/**
 * @file PlatformUrlPort.ts
 * @description Abstract Port for browser URL state management.
 *
 * Clean Architecture (Port & Adapters):
 * Core, domain, and UI primitives (FormCore, ZenithTable) depend strictly on this
 * interface — never on React Router or window.location directly.
 */

export interface PlatformUrlSetOptions {
  /** If true, uses history.replaceState instead of history.pushState. Defaults to true. */
  replace?: boolean;
  /** If true, flushes the update immediately without debouncing. Defaults to false. */
  immediate?: boolean;
}

export interface PlatformUrlDeleteOptions {
  replace?: boolean;
  immediate?: boolean;
}

export interface PlatformUrlPort {
  /** Optional namespace scope (e.g. "products", "checkout"). */
  readonly scope?: string;

  /** Retrieves single value for a given key (unscoped or scoped). */
  get: (key: string) => string | null;

  /** Retrieves all values for a given multi-value key. */
  getAll: (key: string) => string[];

  /** Returns an immutable snapshot of current URLSearchParams. */
  snapshot: () => URLSearchParams;

  /**
   * Sets or updates parameters non-destructively.
   * If value is null, undefined, or empty string, the key is removed.
   * Values of other unrelated parameters are preserved.
   */
  set: (
    entries: Record<string, string | string[] | null | undefined>,
    options?: PlatformUrlSetOptions
  ) => void;

  /** Removes one or more keys non-destructively from the URL. */
  delete: (keys: string[], options?: PlatformUrlDeleteOptions) => void;

  /** Resolves the fully-qualified parameter key incorporating the scope. */
  getScopedKey: (key: string) => string;
}
