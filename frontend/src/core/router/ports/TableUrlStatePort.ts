/**
 * TableUrlStatePort
 *
 * Contract for table-oriented URL state operations. A router-backed adapter
 * implements synchronization so pagination, sorting, search, and filters
 * survive refreshes, are shareable, and restore through browser navigation.
 * Transient state (e.g. row selection) stays local to the table.
 */

export interface TableUrlState {
  /** 1-based page index. */
  page: number;
  pageSize: number;
  search: string;
  /** Sort expression, e.g. "name" or "-createdAt" (leading "-" = desc). */
  sort: string | null;
  /** Shareable filter map; serialized as filter[<key>] params. */
  filters: Record<string, string>;
}

export interface TableUrlStateUpdateOptions {
  /** Use history.replace instead of push. Default: true. */
  replace?: boolean;
  /** Flush the update immediately (skip debounce). Default: true. */
  immediate?: boolean;
}

export interface TableUrlStatePort<TState extends TableUrlState = TableUrlState> {
  readState(): TState;

  updateState(
    state: Partial<TState>,
    options?: TableUrlStateUpdateOptions
  ): void;
}

export const DEFAULT_TABLE_URL_STATE: TableUrlState = {
  page: 1,
  pageSize: 10,
  search: "",
  sort: null,
  filters: {},
};
