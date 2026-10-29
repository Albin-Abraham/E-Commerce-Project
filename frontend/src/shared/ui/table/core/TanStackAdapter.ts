import type {
  Column,
  ColumnFiltersState,
  ColumnPinningState,
  HeaderGroup,
  Row,
  RowModel,
  SortingState,
  TableState,
  Table as TanStackTable,
  VisibilityState,
} from "@tanstack/react-table";

import type { ITableEngine } from "./table-engine";

/**
 * TanStackAdapter
 *
 * Wraps a TanStack Table instance to implement the ITableEngine interface.
 * This adapter preserves full compatibility while enabling future migration
 * to alternative table engines.
 */
export class TanStackAdapter<T> implements ITableEngine<T> {
  constructor(private table: TanStackTable<T>) {}

  getHeaderGroups(): HeaderGroup<T>[] {
    return this.table.getHeaderGroups();
  }

  getAllColumns(): Column<T, any>[] {
    return this.table.getAllColumns();
  }

  getVisibleLeafColumns(): Column<T, any>[] {
    return this.table.getVisibleLeafColumns();
  }

  getRowModel(): RowModel<T> {
    return this.table.getRowModel();
  }

  getPrePaginationRowModel(): RowModel<T> {
    return this.table.getPrePaginationRowModel();
  }

  getState(): TableState {
    return this.table.getState();
  }

  setPageIndex(index: number): void {
    this.table.setPageIndex(index);
  }

  nextPage(): void {
    this.table.nextPage();
  }

  previousPage(): void {
    this.table.previousPage();
  }

  setPageSize(size: number): void {
    this.table.setPageSize(size);
  }

  getCanNextPage(): boolean {
    return this.table.getCanNextPage();
  }

  getCanPreviousPage(): boolean {
    return this.table.getCanPreviousPage();
  }

  getPageCount(): number {
    return this.table.getPageCount();
  }

  setSorting(
    updater: SortingState | ((old: SortingState) => SortingState)
  ): void {
    this.table.setSorting(updater);
  }

  setGlobalFilter(filter: unknown): void {
    this.table.setGlobalFilter(filter);
  }

  setColumnFilters(
    updater:
      | ColumnFiltersState
      | ((old: ColumnFiltersState) => ColumnFiltersState)
  ): void {
    this.table.setColumnFilters(updater);
  }

  resetColumnFilters(): void {
    this.table.resetColumnFilters();
  }

  setColumnVisibility(
    updater: VisibilityState | ((old: VisibilityState) => VisibilityState)
  ): void {
    this.table.setColumnVisibility(updater);
  }

  setColumnPinning(
    updater:
      | ColumnPinningState
      | ((old: ColumnPinningState) => ColumnPinningState)
  ): void {
    this.table.setColumnPinning(updater);
  }

  getColumn(id: string): Column<T, unknown> | undefined {
    return this.table.getColumn(id);
  }

  getRow(id: string): Row<T> | undefined {
    return this.table.getRow(id);
  }
}
