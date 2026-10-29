import { useEffect, useRef } from "react";
import type { PlatformUrlPort } from "@core/router/ports/PlatformUrlPort";
import { PlatformUrlAdapters } from "@core/router/adapters/PlatformUrlAdapters";
import {
  deserializeEntriesToObject,
  serializeObjectToEntries,
} from "@core/router/utils/url-serializer";

/**
 * useFilterUrlSync
 *
 * Bi-directional synchronization between local state and URL search parameters.
 *
 * Clean Architecture (Port & Adapters):
 * - Depends on PlatformUrlPort — decoupled from react-router-dom directly.
 * - Zero JSON.stringify / JSON.parse — uses clean bracket/delimiter serialization.
 * - Non-destructive: preserves existing query params (table pagination, sorts, etc.).
 * - Hydration-locked to prevent ping-pong re-render cycles.
 */

export interface UrlSyncOptions<T> {
  /** Optional namespace scope (e.g. "filters", "products"). */
  key?: string;
  /** Debounce delay in ms before writing to URL (default: 300). */
  debounceMs?: number;
  /** Callback fired whenever state changes are dispatched to URL. */
  onUpdate?: (newState: T) => void;
  /** Injected URL port adapter (e.g. for testing or native window). */
  port?: PlatformUrlPort;
  /** If true, uses history.replaceState instead of pushState (default: true). */
  replace?: boolean;
}

export function useFilterUrlSync<T extends Record<string, any>>(
  state: T,
  setLocalState: (state: T) => void,
  options: UrlSyncOptions<T> = {}
) {
  const {
    key: scope,
    debounceMs = 300,
    onUpdate,
    port: injectedPort,
    replace = true,
  } = options;

  const defaultPort = PlatformUrlAdapters.useReactRouter({
    scope,
    debounceMs,
    replace,
  });
  const port = injectedPort ?? defaultPort;

  const isHydrating = useRef(true);
  const stateRef = useRef(state);
  stateRef.current = state;

  // 1. Inbound: URL -> State (Initial mount / hydration)
  useEffect(() => {
    isHydrating.current = true;
    const snapshot = port.snapshot();

    const deserialized = deserializeEntriesToObject(snapshot, { prefix: scope });

    if (Object.keys(deserialized).length > 0) {
      setLocalState({
        ...stateRef.current,
        ...deserialized,
      });
    }

    const frameId = requestAnimationFrame(() => {
      isHydrating.current = false;
    });

    return () => cancelAnimationFrame(frameId);
  }, [port, setLocalState, scope]);

  // 2. Outbound: State -> URL (Debounced via PlatformUrlPort)
  useEffect(() => {
    if (isHydrating.current) return;

    const entries = serializeObjectToEntries(state, { prefix: scope });
    port.set(entries, { replace });
    onUpdate?.(state);
  }, [state, port, scope, replace, onUpdate]);

  return {
    searchParams: port.snapshot(),
    port,
  };
}
