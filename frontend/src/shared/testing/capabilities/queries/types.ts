export interface QueryOptions {
  container?: HTMLElement;
  exact?: boolean;
  selector?: string;
}

export interface QueryResult<T extends HTMLElement = HTMLElement> {
  element: T | null;
  found: boolean;
}

export interface FieldQueryOptions extends QueryOptions {
  byName?: string;
  byId?: string;
  byRole?: string;
  byLabel?: string;
}

export interface TableQueryOptions extends QueryOptions {
  rowIndex?: number;
  columnName?: string;
  columnIndex?: number;
}