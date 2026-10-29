import { useEffect, useMemo, useRef } from "react";
import type { Form } from "@form-core/form";
import type { PlatformUrlPort } from "@core/router/ports/PlatformUrlPort";
import { PlatformUrlAdapters } from "@core/router/adapters/PlatformUrlAdapters";
import {
  parseQueryArray,
  parseQueryPrimitive,
} from "@core/router/utils/url-serializer";


export interface UseFormUrlSyncOptions<T extends Record<string, any>> {
  /** The form engine instance to synchronize with URL. */
  form: Form<T>;
  /** Optional namespace scope (e.g. "filters", "products"). Prevents param collisions. */
  scope?: string;
  /** Injected URL adapter port. Defaults to PlatformUrlAdapters.useReactRouter(scope). */
  port?: PlatformUrlPort;
  /** Debounce delay in ms for input synchronization. Defaults to 300ms. */
  debounceMs?: number;
  /** Custom serializer mapping form values to URL entries. */
  serialize?: (values: T) => Record<string, string | string[]>;
  /** Custom deserializer mapping URLSearchParams back to form state. */
  deserialize?: (params: URLSearchParams) => Partial<T>;
  /** If true, uses history.replaceState (default: true). */
  replaceHistory?: boolean;
  /**
   * Wizard step synchronization.
   * If true (or custom string param key like "step"), keeps the active wizard step in sync with URL.
   */
  syncStep?: boolean | string;
  /** Active wizard context step ID if synchronizing multi-step flows. */
  currentStepId?: string;
  /** Wizard step jump callback to navigate steps when browser back/forward is used. */
  onStepChange?: (stepId: string) => void;
}

/**
 * useFormUrlSync
 *
 * Industrial-grade, bi-directional URL synchronization for MDAP Forms.
 *
 * Architecture (Clean Architecture / Port & Adapters):
 * - Depends on PlatformUrlPort — never mutates browser history directly.
 * - Non-destructive: merges and updates only form-owned keys. Table, pagination,
 *   and global search parameters are strictly preserved.
 * - Prevents ping-pong loops via an explicit hydration lock.
 * - Supports scoped multi-widget dashboards and wizard step persistence.
 */
export function useFormUrlSync<T extends Record<string, any>>({
  form,
  scope,
  port: injectedPort,
  debounceMs = 300,
  serialize,
  deserialize,
  replaceHistory = true,
  syncStep = false,
  currentStepId,
  onStepChange,
}: UseFormUrlSyncOptions<T>) {
  // Use injected port or default to the platform React Router adapter
  const defaultPort = PlatformUrlAdapters.useReactRouter({
    scope,
    replace: replaceHistory,
    debounceMs,
  });
  const port = injectedPort ?? defaultPort;

  const isHydrating = useRef(true);
  const prevStepRef = useRef(currentStepId);
  const stepParamKey = typeof syncStep === "string" ? syncStep : "step";

  // ── 1. Inbound URL ➡️ Form Engine (Mount & Popstate) ──────────────
  useEffect(() => {
    isHydrating.current = true;
    const snapshot = port.snapshot();

    // 1a. Hydrate Form Values
    let hydratedValues: Partial<T> = {};
    if (deserialize) {
      hydratedValues = deserialize(snapshot);
    } else {
      // Scoped extraction: extract keys matching scope or unprefixed
      snapshot.forEach((value, key) => {
        const parseVal = (v: string, k: string) => {
          const currentFormVal = (form.values as Record<string, any>)?.[k];
          if (Array.isArray(currentFormVal) || v.includes(",")) {
            return parseQueryArray(v);
          }
          return parseQueryPrimitive(v);
        };


        const prefix = scope ? `${scope}_` : "";
        if (prefix && key.startsWith(prefix)) {
          const rawKey = key.slice(prefix.length);
          if (rawKey !== stepParamKey) {
            hydratedValues[rawKey as keyof T] = parseVal(value, rawKey) as any;
          }
        } else if (!scope && key !== stepParamKey) {
          hydratedValues[key as keyof T] = parseVal(value, key) as any;
        }
      });
    }


    Object.entries(hydratedValues).forEach(([key, value]) => {
      form.setValue(key, value);
    });

    // 1b. Hydrate Wizard Step
    if (syncStep && onStepChange) {
      const stepFromUrl = port.get(stepParamKey);
      if (stepFromUrl && stepFromUrl !== currentStepId) {
        onStepChange(stepFromUrl);
      }
    }

    // Release hydration lock on next frame
    const frameId = requestAnimationFrame(() => {
      isHydrating.current = false;
    });

    return () => cancelAnimationFrame(frameId);
  }, [port, form, deserialize, scope, syncStep, stepParamKey, onStepChange]);

  // ── 2. Outbound Form Values ➡️ URL ────────────────────────────────
  useEffect(() => {
    const unsubscribe = form.subscribe((state) => {
      if (isHydrating.current) return;

      let entries: Record<string, string | string[] | null | undefined> = {};
      if (serialize) {
        entries = serialize(state.values as T);
      } else {
        Object.entries(state.values).forEach(([key, val]) => {
          if (val === undefined || val === null || val === "") {
            entries[key] = null; // Mark for deletion
          } else if (Array.isArray(val)) {
            entries[key] = val.map(String);
          } else {
            entries[key] = String(val);
          }
        });
      }

      port.set(entries, { replace: replaceHistory });
    });

    return () => unsubscribe();
  }, [form, port, serialize, replaceHistory]);

  // ── 3. Outbound Wizard Step ➡️ URL ────────────────────────────────
  useEffect(() => {
    if (!syncStep || !currentStepId) return;

    if (currentStepId !== prevStepRef.current) {
      prevStepRef.current = currentStepId;
      if (!isHydrating.current) {
        port.set(
          { [stepParamKey]: currentStepId },
          { replace: replaceHistory, immediate: true }
        );
      }
    }
  }, [syncStep, currentStepId, port, stepParamKey, replaceHistory]);

  return { port };
}
