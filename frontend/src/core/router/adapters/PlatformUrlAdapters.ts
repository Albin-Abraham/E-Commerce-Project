import { useMemo, useRef } from "react";
import { useInRouterContext, useLocation, useNavigate } from "react-router-dom";
import { debounce } from "lodash-es";

import type {
  PlatformUrlDeleteOptions,
  PlatformUrlPort,
  PlatformUrlSetOptions,
} from "../ports/PlatformUrlPort";

/**
 * Builds a clean query string from URLSearchParams, keeping `:` unencoded for readability.
 */
function serializeSearchParams(params: URLSearchParams): string {
  const parts: string[] = [];
  params.forEach((value, key) => {
    parts.push(`${key}=${value}`);
  });
  return parts.join("&");
}

export interface PlatformUrlAdapterOptions {
  scope?: string;
  isGlobal?: boolean;
  replace?: boolean;
  debounceMs?: number;
}

/**
 * Concrete implementations of PlatformUrlPort.
 * High-level modules (Form, Table) consume only PlatformUrlPort.
 */
export const PlatformUrlAdapters = Object.freeze({
  /**
   * useReactRouter — Reactive React Router adapter with ref-stabilization and debouncing.
   */
  useReactRouter(options: PlatformUrlAdapterOptions = {}): PlatformUrlPort {
    const {
      scope: manualScope,
      isGlobal = false,
      replace: defaultReplace = true,
      debounceMs = 300,
    } = options;

    const inRouter = useInRouterContext();
    const navigate = inRouter ? useNavigate() : () => {};
    const location = inRouter
      ? useLocation()
      : { pathname: "/", search: "", state: null, hash: "", key: "default" };

    const locationRef = useRef(location);
    const navigateRef = useRef(navigate);
    locationRef.current = location;
    navigateRef.current = navigate;

    // Derive scope from route pathname when not provided manually and not global
    const scope = useMemo(() => {
      if (isGlobal) return undefined;
      if (manualScope) return manualScope;
      const parts = location.pathname.split("/").filter(Boolean);
      return parts.length > 0 ? parts.join("_") : undefined;
    }, [location.pathname, manualScope, isGlobal]);

    const getScopedKey = (key: string) => {
      return scope ? `${scope}_${key}` : key;
    };

    // Debounced navigation flush to prevent browser history thrashing
    const debouncedApply = useRef(
      debounce((url: string, replaceMode: boolean, state: any) => {
        navigateRef.current(url, { replace: replaceMode, state });
      }, debounceMs)
    ).current;

    return useMemo<PlatformUrlPort>(
      () => ({
        scope,
        getScopedKey,

        get: (key: string) => {
          const params = new URLSearchParams(locationRef.current.search);
          const scopedKey = getScopedKey(key);
          return params.get(scopedKey) ?? (scope ? params.get(key) : null);
        },

        getAll: (key: string) => {
          const params = new URLSearchParams(locationRef.current.search);
          const scopedKey = getScopedKey(key);
          const values = params.getAll(scopedKey);
          return values.length > 0 ? values : scope ? params.getAll(key) : [];
        },

        snapshot: () => new URLSearchParams(locationRef.current.search),

        set: (
          entries: Record<string, string | string[] | null | undefined>,
          setOptions: PlatformUrlSetOptions = {}
        ) => {
          const next = new URLSearchParams(locationRef.current.search);

          Object.entries(entries).forEach(([k, v]) => {
            const finalKey = getScopedKey(k);
            next.delete(finalKey);

            if (v === null || v === undefined || v === "") {
              return;
            }

            if (Array.isArray(v)) {
              v.forEach((val) => {
                if (val !== null && val !== undefined && val !== "") {
                  next.append(finalKey, String(val));
                }
              });
            } else {
              next.set(finalKey, String(v));
            }
          });

          const qs = serializeSearchParams(next);
          const url = `${locationRef.current.pathname}${qs ? `?${qs}` : ""}`;
          const shouldReplace = setOptions.replace ?? defaultReplace;

          if (setOptions.immediate) {
            debouncedApply.cancel();
            navigateRef.current(url, { replace: shouldReplace });
          } else {
            debouncedApply(url, shouldReplace);
          }
        },

        delete: (keys: string[], delOptions: PlatformUrlDeleteOptions = {}) => {
          const next = new URLSearchParams(locationRef.current.search);
          keys.forEach((k) => {
            next.delete(getScopedKey(k));
            if (scope) next.delete(k);
          });

          const qs = serializeSearchParams(next);
          const url = `${locationRef.current.pathname}${qs ? `?${qs}` : ""}`;
          const shouldReplace = delOptions.replace ?? defaultReplace;

          if (delOptions.immediate) {
            debouncedApply.cancel();
            navigateRef.current(url, { replace: shouldReplace });
          } else {
            debouncedApply(url, shouldReplace);
          }
        },
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [scope, defaultReplace, debounceMs]
    );
  },

  /**
   * useNative — Pure window.location adapter with non-destructive merge.
   */
  useNative(options: PlatformUrlAdapterOptions = {}): PlatformUrlPort {
    const {
      scope,
      replace: defaultReplace = true,
      debounceMs = 300,
    } = options;

    const getScopedKey = (key: string) => {
      return scope ? `${scope}_${key}` : key;
    };

    const debouncedPush = useRef(
      debounce((url: string, replaceMode: boolean) => {
        if (typeof window === "undefined") return;
        if (replaceMode) {
          window.history.replaceState(null, "", url);
        } else {
          window.history.pushState(null, "", url);
        }
      }, debounceMs)
    ).current;

    return useMemo<PlatformUrlPort>(
      () => ({
        scope,
        getScopedKey,

        get: (key: string) => {
          if (typeof window === "undefined") return null;
          const params = new URLSearchParams(window.location.search);
          const scopedKey = getScopedKey(key);
          return params.get(scopedKey) ?? (scope ? params.get(key) : null);
        },

        getAll: (key: string) => {
          if (typeof window === "undefined") return [];
          const params = new URLSearchParams(window.location.search);
          const scopedKey = getScopedKey(key);
          const values = params.getAll(scopedKey);
          return values.length > 0 ? values : scope ? params.getAll(key) : [];
        },

        snapshot: () =>
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams(),

        set: (
          entries: Record<string, string | string[] | null | undefined>,
          setOptions: PlatformUrlSetOptions = {}
        ) => {
          if (typeof window === "undefined") return;
          const next = new URLSearchParams(window.location.search);

          Object.entries(entries).forEach(([k, v]) => {
            const finalKey = getScopedKey(k);
            next.delete(finalKey);

            if (v === null || v === undefined || v === "") return;

            if (Array.isArray(v)) {
              v.forEach((val) => {
                if (val !== null && val !== undefined && val !== "") {
                  next.append(finalKey, String(val));
                }
              });
            } else {
              next.set(finalKey, String(v));
            }
          });

          const qs = serializeSearchParams(next);
          const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
          const shouldReplace = setOptions.replace ?? defaultReplace;

          if (setOptions.immediate) {
            debouncedPush.cancel();
            if (shouldReplace) {
              window.history.replaceState(null, "", url);
            } else {
              window.history.pushState(null, "", url);
            }
          } else {
            debouncedPush(url, shouldReplace);
          }
        },

        delete: (keys: string[], delOptions: PlatformUrlDeleteOptions = {}) => {
          if (typeof window === "undefined") return;
          const next = new URLSearchParams(window.location.search);
          keys.forEach((k) => {
            next.delete(getScopedKey(k));
            if (scope) next.delete(k);
          });

          const qs = serializeSearchParams(next);
          const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
          const shouldReplace = delOptions.replace ?? defaultReplace;

          if (delOptions.immediate) {
            debouncedPush.cancel();
            if (shouldReplace) {
              window.history.replaceState(null, "", url);
            } else {
              window.history.pushState(null, "", url);
            }
          } else {
            debouncedPush(url, shouldReplace);
          }
        },
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [scope, defaultReplace, debounceMs]
    );
  },

  /**
   * createMock — In-memory mock adapter for fast headless testing.
   */
  createMock(
    initialState: Record<string, string | string[]> = {},
    scope?: string
  ): PlatformUrlPort & { _store: Map<string, string[]> } {
    const store = new Map<string, string[]>();

    Object.entries(initialState).forEach(([k, v]) => {
      store.set(k, Array.isArray(v) ? [...v] : [v]);
    });

    const getScopedKey = (key: string) => {
      return scope ? `${scope}_${key}` : key;
    };

    return {
      _store: store,
      scope,
      getScopedKey,

      get: (key: string) => {
        const scopedKey = getScopedKey(key);
        const vals = store.get(scopedKey) ?? (scope ? store.get(key) : undefined);
        return vals && vals.length > 0 ? vals[0] : null;
      },

      getAll: (key: string) => {
        const scopedKey = getScopedKey(key);
        const vals = store.get(scopedKey) ?? (scope ? store.get(key) : undefined);
        return vals ? [...vals] : [];
      },

      snapshot: () => {
        const params = new URLSearchParams();
        store.forEach((vals, k) => {
          vals.forEach((v) => params.append(k, v));
        });
        return params;
      },

      set: (entries: Record<string, string | string[] | null | undefined>) => {
        Object.entries(entries).forEach(([k, v]) => {
          const finalKey = getScopedKey(k);
          if (v === null || v === undefined || v === "") {
            store.delete(finalKey);
          } else if (Array.isArray(v)) {
            const filtered = v.filter(
              (item) => item !== null && item !== undefined && item !== ""
            );
            if (filtered.length > 0) {
              store.set(finalKey, filtered.map(String));
            } else {
              store.delete(finalKey);
            }
          } else {
            store.set(finalKey, [String(v)]);
          }
        });
      },

      delete: (keys: string[]) => {
        keys.forEach((k) => {
          store.delete(getScopedKey(k));
          if (scope) store.delete(k);
        });
      },
    };
  },
});
