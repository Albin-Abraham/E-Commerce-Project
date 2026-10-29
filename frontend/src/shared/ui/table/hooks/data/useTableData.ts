import { useCallback, useEffect, useRef, useState } from "react";

import type { ITableEngine } from "@ui/table/core/table-engine";
import type { ResolvedTableMeta } from "@ui/table/meta/TableMetaDefaults";
import type {
  DataSource,
  TableMeta,
  TableQueryParams,
  TableServerResponse,
} from "@ui/table/types";
import type { QueryDialectAdapter } from "@ui/table/types";

function isCanonicalServerResponse<T>(
  res: unknown
): res is TableServerResponse<T> {
  return (
    !!res &&
    typeof res === "object" &&
    Array.isArray((res as TableServerResponse<T>).rows) &&
    typeof (res as TableServerResponse<T>).totalCount === "number"
  );
}

/**
 * The table is HTTP-agnostic. Unwrap the backend envelope in the fetcher with
 * `ResponseFactory.parse(response).parsePaginated()` and return `{ rows, totalCount }`.
 */
function requireTableServerResponse<T>(res: unknown): TableServerResponse<T> {
  if (isCanonicalServerResponse<T>(res)) {
    return { rows: res.rows, totalCount: res.totalCount };
  }

  const looksPaginated =
    !!res &&
    typeof res === "object" &&
    Array.isArray((res as { items?: unknown }).items) &&
    typeof (res as { total?: unknown }).total === "number";

  if (looksPaginated) {
    const p = res as { items: T[]; total: number };
    return {
      rows: p.items,
      totalCount: p.total,
    };
  }

  const looksDataCountEnvelope =
    !!res &&
    typeof res === "object" &&
    Array.isArray((res as { data?: unknown }).data) &&
    typeof (res as { count?: unknown }).count === "number";

  if (looksDataCountEnvelope) {
    const env = res as { data: T[]; count: number };
    return {
      rows: env.data,
      totalCount: env.count,
    };
  }

  throw new Error(
    "[ZenithTable] fetcher must return TableServerResponse ({ rows, totalCount }), PaginatedResponse ({ items, total }), or envelope ({ data, count })."
  );
}

function buildQueryParams(
  pageIndex: number,
  pageSize: number,
  sorting: { id: string; desc: boolean }[],
  filters: { id: string; value: unknown }[],
  search: unknown
): TableQueryParams {
  return {
    page: pageIndex,
    pageSize,
    offset: pageIndex * pageSize,
    sort: sorting.map((s) => ({ key: s.id, dir: s.desc ? "desc" : "asc" })),
    filters: Object.fromEntries(filters.map((f) => [f.id, f.value])),
    search: String(search ?? ""),
  };
}

/**
 * useTableData
 *
 * Data Hook — Handles fetching logic for client or server DataSources.
 * Server fetchers must return `{ rows, totalCount }` (unwrap HTTP envelopes
 * with ResponseFactory in the fetcher, not here).
 * Includes AbortController for race condition prevention and mounted guards.
 *
 * STABILITY CONTRACT — client sources:
 * ─────────────────────────────────────
 * The parent (useTableController) initialises `data` via useState(source.data),
 * so on first render the TanStack table already has the correct data — we must
 * NOT call setData() again on mount, which would cause:
 *
 *   setData → React setState → re-render → useTablePhysics(Zustand) selector
 *   fires → forceStoreRerender → updateStoreInstance → re-render → repeat
 *
 * Solution: for client sources we skip calling setData entirely unless the
 * source.data array identity actually changes (i.e. the parent loaded new data).
 * We track the previous data ref and only call setData when it differs.
 *
 * STABILITY CONTRACT — server sources:
 * ────────────────────────────────────
 * source is kept in a ref so closures never go stale without making the
 * full object a dependency (which is new every render).
 */
export function useTableData<T>(
  source: DataSource<T>,
  _meta: ResolvedTableMeta | TableMeta | Required<TableMeta>,
  engine: ITableEngine<T>,
  setData: (data: T[]) => void
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  // Initialise totalCount from source length for client sources.
  const [totalCount, setTotalCount] = useState<number>(
    source.type === "client" ? source.data.length : 0
  );

  // Keep latest source in a ref — closures read from this, not captures.
  const sourceRef = useRef(source);
  sourceRef.current = source;

  // CLIENT: track the previous data array identity so we only call setData
  // when the parent genuinely provides a NEW array (e.g. after re-fetch).
  // On mount this is initialised to source.data so the first render is skipped.
  const prevClientDataRef = useRef<T[] | null>(
    source.type === "client" ? source.data : null
  );

  const { pageIndex, pageSize } = engine.getState().pagination;
  const sorting = engine.getState().sorting;
  const filters = engine.getState().columnFilters;
  const globalSearch = engine.getState().globalFilter ?? "";

  const hasFetchedRef = useRef(false);
  const [hasFetched, setHasFetched] = useState(false);

  const gateMode: "auto" | "manual" =
    source.type === "server" ? (source.gate ?? "auto") : "auto";

  const snapshotQuery = (pageIndexOverride?: number) => {
    const s = engine.getState();
    return {
      pageIndex: pageIndexOverride ?? s.pagination.pageIndex,
      pageSize: s.pagination.pageSize,
      sorting: s.sorting,
      filters: s.columnFilters,
      search: s.globalFilter ?? "",
    };
  };

  const fetchData = useCallback(
    async (
      signal?: AbortSignal,
      intent: "auto" | "refetch" = "auto",
      pageIndexOverride?: number
    ) => {
      const src = sourceRef.current;

      if (src.type === "client") {
        if (!signal?.aborted) {
          if (src.data !== prevClientDataRef.current) {
            prevClientDataRef.current = src.data;
            setData(src.data);
            setTotalCount(src.data.length);
          }
        }
        return;
      }

      const q = snapshotQuery(pageIndexOverride);
      const params: TableQueryParams = buildQueryParams(
        q.pageIndex,
        q.pageSize,
        q.sorting,
        q.filters,
        q.search
      );

      // Guard: proactive eligibility (required filters, etc.)
      if (src.guard && src.guard(params) === false) {
        return;
      }

      // Gate: reactive policy — manual waits for search/refetch until first success
      const gate = src.gate ?? "auto";
      if (gate === "manual" && intent === "auto" && !hasFetchedRef.current) {
        return;
      }

      // Serialize params using dialect adapter if provided
      let serializedParams: Record<string, string> | undefined;
      if (src.dialect) {
        serializedParams = src.dialect.serialize(params);
      }

      if (!signal?.aborted) setLoading(true);
      if (!signal?.aborted) setError(null);
      try {
        const res = await src.fetcher(params, serializedParams, signal);
        if (signal?.aborted || !mountedRef.current) return;

        const mapped = requireTableServerResponse<T>(res);
        setData(mapped.rows);
        setTotalCount(mapped.totalCount);
        hasFetchedRef.current = true;
        setHasFetched(true);
      } catch (err) {
        if (signal?.aborted || !mountedRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!signal?.aborted && mountedRef.current) setLoading(false);
      }
      // sourceRef is a ref — read at call time. engine.getState() is live.
    },
    [source.type, source.type === "client" ? source.data : undefined, engine]
  );

  const run = useCallback(
    (intent: "auto" | "refetch", pageIndexOverride?: number) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      return fetchData(controller.signal, intent, pageIndexOverride);
    },
    [fetchData]
  );

  const refetch = useCallback(() => run("refetch"), [run]);

  const search = useCallback(() => {
    engine.setPageIndex(0);
    return run("refetch", 0);
  }, [engine, run]);

  const filterKey = gateMode === "auto" ? filters : undefined;
  const searchKey = gateMode === "auto" ? globalSearch : undefined;

  useEffect(() => {
    mountedRef.current = true;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetchData(controller.signal, "auto");
    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [fetchData, pageIndex, pageSize, sorting, filterKey, searchKey]);

  const canFetch =
    source.type !== "server" ||
    !source.guard ||
    source.guard(
      buildQueryParams(pageIndex, pageSize, sorting, filters, globalSearch)
    ) !== false;

  return { totalCount, loading, error, refetch, search, canFetch, hasFetched };
}
