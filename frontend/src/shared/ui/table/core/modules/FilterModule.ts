import { useEffect, useMemo, useRef } from "react";

import { debounce } from "lodash-es";

import type { HookSignature } from "@ui/table/types";
import { useTableContext } from "@ui/table/core/TableEngineContext";

/**
 * FilterModule — thin engine writer.
 *
 * Applied filters are always engine state (URL / TableQueryParams).
 * Debounce only delays the write; it is not a second filter store.
 */

export interface UseFilterSignature extends HookSignature {
  debounceMs?: number;
  onFilterChange?: (filters: Record<string, unknown>) => void;
}

function filtersFromEngine(
  columnFilters: { id: string; value: unknown }[]
): Record<string, unknown> {
  return Object.fromEntries(
    columnFilters
      .filter((f) => f.value != null && f.value !== "")
      .map((f) => [f.id, f.value])
  );
}

export const FilterModule = Object.freeze({
  useFilter(sig: UseFilterSignature = {}) {
    const { engine } = useTableContext<unknown>();
    const enabled = sig.enabled !== false;
    const ms = sig.debounceMs ?? 300;
    const onFilterChangeRef = useRef(sig.onFilterChange);
    onFilterChangeRef.current = sig.onFilterChange;

    // Use ref to hold latest engine so debounce never captures stale reference
    const engineRef = useRef(engine);
    engineRef.current = engine;

    const pendingRef = useRef<Record<string, unknown>>({});

    const applyPending = useMemo(
      () =>
        debounce(() => {
          const currentEngine = engineRef.current;
          const pending = pendingRef.current;
          pendingRef.current = {};
          for (const [col, val] of Object.entries(pending)) {
            currentEngine
              .getColumn(col)
              ?.setFilterValue(val === "" || val == null ? undefined : val);
          }
          onFilterChangeRef.current?.(
            filtersFromEngine(currentEngine.getState().columnFilters)
          );
        }, ms),
      [ms]
    );

    useEffect(() => () => applyPending.cancel(), [applyPending]);

    const engineState = engine.getState();
    const filters = filtersFromEngine(engineState.columnFilters);
    const columnActive = engineState.columnFilters.filter(
      (f) => f.value != null && f.value !== ""
    ).length;
    const searchActive = engineState.globalFilter ? 1 : 0;

    return {
      filters,
      activeCount: columnActive + searchActive,

      setFilter: (key: string, val: unknown) => {
        if (!enabled) return;
        pendingRef.current[key] = val;
        applyPending();
      },

      clearFilter: (key: string) => {
        if (!enabled) return;
        delete pendingRef.current[key];
        engine.getColumn(key)?.setFilterValue(undefined);
      },

      clearAll: () => {
        if (!enabled) return;
        pendingRef.current = {};
        applyPending.cancel();
        engine.resetColumnFilters();
        engine.setGlobalFilter("");
      },

      setGlobalSearch: (value: string) => {
        if (!enabled) return;
        engine.setGlobalFilter(value);
      },

      flush: () => applyPending.flush(),
    };
  },
});
