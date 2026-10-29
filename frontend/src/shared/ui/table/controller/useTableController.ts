import { useEffect, useMemo, useState } from "react";

import type { ColumnDef } from "@tanstack/react-table";

import type { ITableEngine } from "@ui/table/core/table-engine";
import { useTanstackAdapter } from "@ui/table/core/useTanstackAdapter";
import { useTableData } from "@ui/table/hooks/data/useTableData";
import { metaBehaviorKey, resolveTableMeta, type ResolvedTableMeta } from "@ui/table/meta/TableMetaDefaults";
import type { DataSource, TableMeta } from "@ui/table/types";
import { TableUrl, TableUrlKeyResolver } from "@ui/table/url/TableUrl";
import type { TableUrlPort } from "@ui/table/url/TableUrlPort";
import { validateTableConfig } from "@ui/table/utils/validateConfig";

export interface TableControllerConfig<T> {
  meta: TableMeta;
  columns: ColumnDef<T>[];
  source: DataSource<T>;
  /** Override total rows (drives engine pageCount). Client `data` stays the current page. */
  totalCount?: number;
  /** Stable row identity for selection across server pages. Default: row index. */
  getRowId?: (originalRow: T, index: number) => string;
  /** Injected URL adapter for custom routing or testing. Defaults to TableUrl.Adapters.useReactRouter(). */
  urlAdapter?: TableUrlPort;
}

export interface TableController<T> {
  engine: ITableEngine<T>;
  meta: ResolvedTableMeta;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  /** Apply current filters and fetch (resets to page 0). Use with `gate: "manual"`. */
  search: () => void;
  /** False when `source.guard(params)` blocked eligibility. */
  canFetch: boolean;
  /** True after at least one successful server fetch. */
  hasFetched: boolean;
  totalCount: number;
}

export function useTableController<T>(
  config: TableControllerConfig<T>
): TableController<T> {
  // Dev-mode validation (only runs in development)
  validateTableConfig(config);

  // Memoize on a stable serialization of behavior fields — NOT object identity.
  // Inline `{ id, features }` literals must not re-resolve every render (loop),
  // but features / url / pagination changes must apply.
  const _metaKey = metaBehaviorKey(config.meta);
  const _meta = useMemo(
    () => resolveTableMeta(config.meta),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_metaKey]
  );

  // URL Infrastructure
  const defaultUrlAdapter = TableUrl.Adapters.useReactRouter();
  const _urlAdapter = config.urlAdapter ?? defaultUrlAdapter;
  const _resolver = useMemo(() => new TableUrlKeyResolver(_meta), [_meta.id]);

  // Data State
  const [data, setData] = useState<T[]>(
    config.source.type === "client" ? config.source.data : []
  );

  // Page count: override or fetched total. Client without override is one page
  // (data is the current slice — do not invent pages from data.length).
  const defaultPageSize =
    _meta.url?.defaults?.size ?? _meta.pagination?.pageSizeOptions?.[0] ?? 10;
  const [pageCount, setPageCount] = useState<number>(() => {
    if (typeof config.totalCount === "number") {
      return defaultPageSize > 0
        ? Math.ceil(config.totalCount / defaultPageSize)
        : 0;
    }
    return config.source.type === "client" ? 1 : 0;
  });

  // TanStack Engine Wrapper
  const { engine } = useTanstackAdapter({
    data,
    columns: config.columns,
    pageCount,
    defaultPageSize,
    getRowId: config.getRowId,
  });

  // Data Fetching
  const {
    totalCount: fetchedTotal,
    loading,
    error,
    refetch,
    search,
    canFetch,
    hasFetched,
  } = useTableData(config.source, _meta, engine, setData);

  const totalCount = config.totalCount ?? fetchedTotal;
  const pageSize = engine.getState().pagination.pageSize;

  const effectiveTotalCount =
    config.source.type === "client" && config.totalCount === undefined
      ? data.length
      : totalCount;

  // Sync totalCount → pageCount for TanStack Table navigation and clamp pageIndex
  useEffect(() => {
    const calculatedPageCount =
      pageSize > 0 ? Math.max(1, Math.ceil(effectiveTotalCount / pageSize)) : 1;
    setPageCount(calculatedPageCount);

    const currentPageIndex = engine.getState().pagination.pageIndex;
    if (currentPageIndex >= calculatedPageCount) {
      engine.setPageIndex(Math.max(0, calculatedPageCount - 1));
    }
  }, [effectiveTotalCount, pageSize, engine]);

  // URL Sync (Reads on mount, Writes on state change)
  TableUrl.useReader(_resolver, _urlAdapter, _meta.url!, engine, {
    enabled: _meta.features.urlSync,
  });
  TableUrl.useWriter(_resolver, _urlAdapter, _meta.url!, engine, {
    enabled: _meta.features.urlSync,
  });

  return {
    engine,
    meta: _meta,
    loading,
    error,
    refetch,
    search,
    canFetch,
    hasFetched,
    totalCount,
  };
}
