import { useEffect, useMemo } from "react";

import { debounce } from "lodash-es";

import type { ITableEngine } from "@ui/table/core/table-engine";
import type { UrlConfig } from "@ui/table/types";
import { AppendPipeline } from "@ui/table/url/AppendPipeline";
import type { TableUrlKeyResolver } from "@ui/table/url/TableUrlKeyResolver";
import type { TableUrlPort } from "@ui/table/url/TableUrlPort";
import { SortUrlCategory } from "@ui/table/url/categories/SortUrlCategory";
import { SearchParser } from "@ui/table/url/parser/SearchParser";
import { resolveUrlConfig } from "@ui/table/meta/TableMetaDefaults";

export interface UseTableUrlWriterOptions {
  enabled?: boolean;
}

/**
 * useTableUrlWriter
 *
 * Writes table state → URL on every relevant state change.
 * Uses AppendPipeline: clone → clear owned keys → set singles → appendAll multi.
 *
 * COMPACT FORMAT:
 *   Sort:    -name (desc), name (asc) — multiple values under sort key
 *   Filter:  colId:value — multiple values under filter key
 *   Search:  trimmed, whitespace-collapsed via SearchParser.format()
 *
 * CRITICAL: build() returns URLSearchParams — never Object.fromEntries().
 *
 * The `enabled` flag guards internally — this hook is ALWAYS called
 * unconditionally (no Rules of Hooks violation).
 */
export function useTableUrlWriter(
  resolver: TableUrlKeyResolver,
  adapter: TableUrlPort,
  url: Partial<UrlConfig> | undefined,
  engine: ITableEngine<any>,
  options: UseTableUrlWriterOptions = {}
): void {
  const state = engine.getState();

  const debouncedSetUrl = useMemo(
    () =>
      debounce((entries: Record<string, string | string[]>) => {
        adapter.set(entries);
      }, 150),
    [adapter]
  );

  useEffect(() => {
    if (!options.enabled || !url) return;

    const { pageIndex, pageSize } = state.pagination;
    const resolved = resolveUrlConfig(url);
    const defaults = resolved.defaults;
    const sortConfig = {
      separator: resolved.format.separator,
      maxFields: 5,
    };

    const sortStrings = SortUrlCategory.serialize(state.sorting, sortConfig);
    const searchFormatted = SearchParser.format(
      String(state.globalFilter ?? "")
    );

    // Pipeline: clone → clear → set/append → build URLSearchParams
    const pipeline = new AppendPipeline(adapter.snapshot(), resolver);

    pipeline
      .set(
        resolver.key("page"),
        pageIndex !== defaults.page ? String(pageIndex) : null
      )
      .set(
        resolver.key("size"),
        pageSize !== defaults.size ? String(pageSize) : null
      )
      .set(resolver.key("search"), searchFormatted || null)
      .appendAll(resolver.key("sort"), sortStrings);

    // TD1: delegate filter serialization to AppendPipeline.setFilter()
    // (previously: inline forEach loop with raw string concatenation)
    state.columnFilters.forEach((f) => {
      pipeline.setFilter(String(f.id), f.value != null ? String(f.value) : null);
    });

    // TD2: delegate deletion-diffing + entries conversion to AppendPipeline.toEntries()
    // (previously: 18-line manual Set/forEach block in the hook body)
    const entries = pipeline.toEntries(resolver.ownedKeys(adapter.snapshot()));
    debouncedSetUrl(entries);
  }, [
    state.pagination.pageIndex,
    state.pagination.pageSize,
    state.sorting,
    state.globalFilter,
    state.columnFilters,
    options.enabled,
    debouncedSetUrl,
    // resolver and meta are stable refs — intentionally excluded
  ]);
}
