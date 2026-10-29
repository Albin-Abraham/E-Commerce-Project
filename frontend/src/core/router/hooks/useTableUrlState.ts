import { useCallback, useMemo } from "react";

import { PlatformUrlAdapters } from "../adapters/PlatformUrlAdapters";
import type {
  TableUrlState,
  TableUrlStatePort,
  TableUrlStateUpdateOptions,
} from "../ports/TableUrlStatePort";
import { DEFAULT_TABLE_URL_STATE } from "../ports/TableUrlStatePort";

export interface UseTableUrlStateOptions {
  /**
   * Namespaces URL params (e.g. products_table_page). Defaults to the
   * current pathname-derived scope from the underlying URL port.
   */
  scope?: string;
  /** Explicit table id — used as the scope when scope is not provided. */
  tableId?: string;
  defaults?: Partial<TableUrlState>;
  debounceMs?: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePositiveInt(raw: string | null, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * useTableUrlState
 *
 * React Router-backed adapter for the TableUrlStatePort. Keeps pagination,
 * page size, search, sort, and named filters in scoped URL params so table
 * state is shareable and survives refresh/browser navigation. Built on the
 * existing scoped PlatformUrlPort.
 */
export function useTableUrlState<TState extends TableUrlState = TableUrlState>(
  options: UseTableUrlStateOptions = {}
): TableUrlStatePort<TState> {
  const { scope, tableId, defaults, debounceMs = 300 } = options;
  const resolvedScope = scope ?? tableId;

  const port = PlatformUrlAdapters.useReactRouter({
    scope: resolvedScope,
    debounceMs,
  });

  const mergedDefaults = useMemo(
    () => ({ ...DEFAULT_TABLE_URL_STATE, ...defaults }),
    [defaults]
  );

  const readState = useCallback((): TState => {
    const search = port.get("q") ?? "";
    const sort = port.get("sort");

    const filters: Record<string, string> = {};
    const prefix = port.scope ? `${escapeRegExp(port.scope)}_` : "";
    const filterPattern = new RegExp(`^${prefix}filter\\[(.+)\\]$`);
    port.snapshot().forEach((value, key) => {
      const match = key.match(filterPattern);
      if (match) {
        filters[match[1]] = value;
      }
    });

    return {
      page: parsePositiveInt(port.get("page"), mergedDefaults.page),
      pageSize: parsePositiveInt(
        port.get("pageSize"),
        mergedDefaults.pageSize
      ),
      search: search || mergedDefaults.search,
      sort: sort ?? mergedDefaults.sort,
      filters,
    } as TState;
  }, [port, mergedDefaults]);

  const updateState = useCallback(
    (
      partial: Partial<TState>,
      updateOptions: TableUrlStateUpdateOptions = {}
    ) => {
      const { replace = true, immediate = true } = updateOptions;
      const entries: Record<string, string | null> = {};

      if (partial.page !== undefined) {
        entries.page =
          partial.page > 0 && partial.page !== mergedDefaults.page
            ? String(partial.page)
            : null;
      }
      if (partial.pageSize !== undefined) {
        entries.pageSize =
          partial.pageSize > 0 && partial.pageSize !== mergedDefaults.pageSize
            ? String(partial.pageSize)
            : null;
      }
      if (partial.search !== undefined) {
        entries.q = partial.search || null;
      }
      if (partial.sort !== undefined) {
        entries.sort = partial.sort || null;
      }
      if (partial.filters !== undefined) {
        // Clear existing filter params. Snapshot keys are already scoped, so
        // convert back to logical filter[...] keys — port.set applies the
        // scope prefix itself. Then write the new map.
        const prefix = port.scope ? `${escapeRegExp(port.scope)}_` : "";
        const filterPattern = new RegExp(`^${prefix}filter\\[(.+)\\]$`);
        port.snapshot().forEach((_value, key) => {
          const match = key.match(filterPattern);
          if (match) {
            entries[`filter[${match[1]}]`] = null;
          }
        });
        Object.entries(partial.filters).forEach(([filterKey, value]) => {
          entries[`filter[${filterKey}]`] = value || null;
        });
      }

      port.set(entries, { replace, immediate });
    },
    [port, mergedDefaults]
  );

  return useMemo(
    () => ({ readState, updateState }),
    [readState, updateState]
  );
}
