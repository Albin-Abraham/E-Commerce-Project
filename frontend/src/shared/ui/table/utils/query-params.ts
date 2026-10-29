import type { TableState } from "@tanstack/react-table";

import type { TableQueryParams } from "../types";

/**
 * Extracts standard TableQueryParams from the raw TanStack TableState.
 * Useful for building API payloads for data fetching, bulk exports, or external sync.
 */
export function extractQueryParams(state: TableState): TableQueryParams {
  return {
    page: state.pagination.pageIndex,
    pageSize: state.pagination.pageSize,
    offset: state.pagination.pageIndex * state.pagination.pageSize,
    sort: state.sorting.map((s) => ({
      key: s.id,
      dir: s.desc ? "desc" : "asc",
    })),
    filters: Object.fromEntries(
      state.columnFilters.map((f) => [f.id, f.value])
    ),
    search: String(state.globalFilter ?? ""),
  };
}
