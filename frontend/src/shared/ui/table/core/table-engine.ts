import type {
  Column,
  ColumnFiltersState,
  ColumnPinningState,
  HeaderGroup,
  Row,
  RowModel,
  SortingState,
  TableState,
  VisibilityState,
} from "@tanstack/react-table";

/**
 * ITableEngine — Abstract interface for table data engines.
 *
 * Decouples ZenithTable from TanStack, enabling custom table backends
 * (e.g. virtual grids, server-only pagination, custom data structures).
 *
 * All sub-components MUST consume this interface instead of importing
 * TanStack types directly. This enforces the Dependency Inversion Principle.
 */
export interface ITableEngine<T> {
  // ── Row Model ──────────────────────────────────────────────────────
  getHeaderGroups(): HeaderGroup<T>[];
  getRowModel(): RowModel<T>;
  getPrePaginationRowModel(): RowModel<T>;

  // ── Column Access ──────────────────────────────────────────────────
  getAllColumns(): Column<T, any>[];
  getVisibleLeafColumns(): Column<T, any>[];
  getColumn(id: string): Column<T, any> | undefined;

  // ── Row Access ─────────────────────────────────────────────────────
  getRow(id: string): Row<T> | undefined;

  // ── State ──────────────────────────────────────────────────────────
  getState(): TableState;
  setPageIndex(index: number): void;
  nextPage(): void;
  previousPage(): void;
  setPageSize(size: number): void;
  getCanNextPage(): boolean;
  getCanPreviousPage(): boolean;
  getPageCount(): number;

  // ── Sorting ────────────────────────────────────────────────────────
  setSorting(
    updater: SortingState | ((old: SortingState) => SortingState)
  ): void;

  // ── Filtering ──────────────────────────────────────────────────────
  setGlobalFilter(filter: unknown): void;
  setColumnFilters(
    updater:
      | ColumnFiltersState
      | ((old: ColumnFiltersState) => ColumnFiltersState)
  ): void;
  resetColumnFilters(): void;

  // ── Visibility ─────────────────────────────────────────────────────
  setColumnVisibility(
    updater: VisibilityState | ((old: VisibilityState) => VisibilityState)
  ): void;

  // ── Pinning ────────────────────────────────────────────────────────
  setColumnPinning(
    updater:
      | ColumnPinningState
      | ((old: ColumnPinningState) => ColumnPinningState)
  ): void;
}
