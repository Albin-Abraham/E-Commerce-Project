import { useEffect } from "react";

import type { ITableEngine } from "@ui/table/core/table-engine";
import type { UrlConfig } from "@ui/table/types";
import { ParsePipeline } from "@ui/table/url/ParsePipeline";
import type { TableUrlKeyResolver } from "@ui/table/url/TableUrlKeyResolver";
import type { TableUrlPort } from "@ui/table/url/TableUrlPort";
import { resolveUrlConfig } from "@ui/table/meta/TableMetaDefaults";

export interface UseTableUrlReaderOptions {
  enabled?: boolean;
}

/**
 * useTableUrlReader
 *
 * Reads URL params → applies to TanStack table state on mount only.
 * Uses ParsePipeline internally — all parsing is validated and sanitised.
 *
 * The `enabled` flag guards internally — this hook is ALWAYS called
 * unconditionally (no Rules of Hooks violation).
 */
export function useTableUrlReader(
  resolver: TableUrlKeyResolver,
  adapter: TableUrlPort,
  url: Partial<UrlConfig> | undefined,
  engine: ITableEngine<any>,
  options: UseTableUrlReaderOptions = {}
): void {
  const snapshotString = adapter.snapshot().toString();

  useEffect(() => {
    if (!options.enabled || !url) return;

    const pipeline = new ParsePipeline(
      adapter.snapshot(),
      resolver,
      resolveUrlConfig(url)
    );
    const { pageIndex, pageSize, search, sorting, filters } =
      pipeline.extractAll();

    const currentState = engine.getState();

    // 1. Sync globalFilter (search)
    if ((currentState.globalFilter ?? "") !== search) {
      engine.setGlobalFilter(search);
    }

    // 2. Sync sorting (shallow compare to avoid loops)
    const isSortingEqual =
      currentState.sorting.length === sorting.length &&
      currentState.sorting.every(
        (s, i) => s.id === sorting[i].id && s.desc === sorting[i].desc
      );
    if (!isSortingEqual) {
      engine.setSorting(sorting);
    }

    // 3. Sync pagination pageIndex
    if (currentState.pagination.pageIndex !== pageIndex) {
      engine.setPageIndex(pageIndex);
    }

    // 4. Sync pagination pageSize
    if (currentState.pagination.pageSize !== pageSize) {
      engine.setPageSize(pageSize);
    }

    // 5. Sync column filters
    filters.forEach((f) => {
      const currentVal = engine.getColumn(f.id)?.getFilterValue();
      if (currentVal !== f.value) {
        engine.getColumn(f.id)?.setFilterValue(f.value);
      }
    });

    // Clear filters that are not in the URL anymore
    if (currentState.columnFilters) {
      currentState.columnFilters.forEach((f) => {
        const existsInUrl = filters.some((uf) => uf.id === f.id);
        if (!existsInUrl) {
          engine.getColumn(f.id)?.setFilterValue(undefined);
        }
      });
    }

    if (pipeline.hasErrors) {
      console.warn("[ZenithTable] URL parse errors:", pipeline.errors);
    }
  }, [snapshotString, options.enabled, url, resolver, engine]);
}
