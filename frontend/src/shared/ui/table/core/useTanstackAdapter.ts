import { useMemo, useState } from "react";

import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type {
  ColumnDef,
  PaginationState,
  SortingState,
  TableOptions,
  VisibilityState,
} from "@tanstack/react-table";

import { TanStackAdapter } from "./TanStackAdapter";
import type { ITableEngine } from "./table-engine";

function pinnedFromColumns<T>(columns: ColumnDef<T, unknown>[]): {
  left: string[];
  right: string[];
} {
  const left: string[] = [];
  const right: string[] = [];
  for (const col of columns) {
    const pinned = (
      col.meta as { pinned?: "left" | "right" | false } | undefined
    )?.pinned;
    const id = col.id ?? (col as { accessorKey?: string }).accessorKey;
    if (!id) continue;
    if (pinned === "left") left.push(String(id));
    if (pinned === "right") right.push(String(id));
  }
  return { left, right };
}

/**
 * useTanstackAdapter
 *
 * Internal: wraps TanStack Table and returns an ITableEngine.
 * Used by useTableController — not part of the public API.
 *
 * Design principle (MDAP Architecture):
 * - Sorting, pagination, and column visibility are controlled state because
 *   the URL reader/writer needs React-level re-renders to persist them.
 * - globalFilter and columnFilters are passed as TanStack `initialState` only.
 *   TanStack manages them internally. The URL reader hydrates them once on mount
 *   via engine.setGlobalFilter() / engine.getColumn().setFilterValue(), which
 *   calls table.setGlobalFilter() directly on the TanStack instance — no external
 *   useState needed.
 */

interface TanstackAdapterOptions<T> extends Omit<
  TableOptions<T>,
  "getCoreRowModel"
> {
  data: T[];
  columns: ColumnDef<T, any>[];
  initialState?: {
    sorting?: SortingState;
    pagination?: PaginationState;
  };
  pinnedColumns?: {
    left?: string[];
    right?: string[];
  };
  defaultPageSize?: number;
  pageCount?: number;
}

export function useTanstackAdapter<T>({
  data,
  columns,
  initialState,
  pinnedColumns,
  defaultPageSize = 10,
  pageCount: pageCountProp,
  ...options
}: TanstackAdapterOptions<T>) {
  // Only the state that needs external read access requires useState.
  // TanStack manages globalFilter + columnFilters internally via its own reducer.
  const [sorting, setSorting] = useState<SortingState>(
    initialState?.sorting || []
  );
  const [pagination, setPagination] = useState<PaginationState>(
    initialState?.pagination || { pageIndex: 0, pageSize: defaultPageSize }
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const inferredPinning = useMemo(() => pinnedFromColumns(columns), [columns]);
  const columnPinning = {
    left: pinnedColumns?.left ?? inferredPinning.left,
    right: pinnedColumns?.right ?? inferredPinning.right,
  };

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCountProp,
    // Server owns sort / filter / page. The table never slices or re-orders locally.
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableMultiSort: true,
    enableColumnPinning: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    // globalFilter and columnFilters are intentionally OMITTED from state{} and
    // have no onXxxChange handlers — this is TanStack's fully-uncontrolled mode.
    // table.setGlobalFilter() / column.setFilterValue() mutate TanStack's internal
    // state directly and trigger TanStack's own re-render. The URL reader calls
    // these on mount; the URL writer reads engine.getState().globalFilter to persist.
    // No external useState or useEffect needed — this is the MDAP principle.
    state: {
      columnVisibility,
      sorting,
      pagination,
      columnPinning,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    onColumnPinningChange: () => {},
    ...options,
  });

  const engine: ITableEngine<T> = useMemo(
    () => new TanStackAdapter(table),
    [table]
  );

  return {
    engine,
    state: {
      sorting,
      pagination,
      columnVisibility,
    },
    actions: {
      setSorting,
      setPagination,
      setColumnVisibility,
    },
  };
}
