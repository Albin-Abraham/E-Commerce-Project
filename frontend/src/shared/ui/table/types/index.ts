import type { ComponentType, ReactNode, RefObject } from "react";

import type { PaginatedResponse } from "@core/http";
import type {
  Cell,
  Column,
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  Table as TanStackTable,
} from "@tanstack/react-table";
// ── FormFieldSchema — links columns to form field definitions ─────────

import type {
  FieldOption,
  FieldProperties,
  FieldType,
  ValidationSettings,
} from "@form-core/domain";
import type { TranslatedText } from "@ui/form/types/i18n-accessibility";

/**
 * ZenithTable Core Type System
 * Extended to support: TableMeta, TableHandle, ParseResult, HookSignature
 */

// ── Existing types (preserved) ────────────────────────────────────────

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface TableColumn<T> {
  id: string;
  header: string | ReactNode;
  accessor: keyof T | ((row: T) => unknown);
  width?: string | number;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  cell?: (value: unknown, row: T) => ReactNode;
  className?: string;
  meta?: Record<string, unknown>;
}

export interface TableState<T> {
  data: T[];
  columns: TableColumn<T>[];
  sorting: SortConfig[];
  pagination: {
    pageIndex: number;
    pageSize: number;
    totalCount: number;
  };
  filters: Record<string, unknown>;
  isLoading: boolean;
  selection: string[];
}

export interface TableInstance<T> {
  state: TableState<T>;
  rows: T[];
  setSorting: (sorting: SortConfig[]) => void;
  setPagination: (page: number, size: number) => void;
  setFilters: (filters: Record<string, unknown>) => void;
  toggleSelection: (id: string) => void;
}

// ── PaginationMeta — numbered pages, labels, page size ────────────────

/**
 * Dynamic context available to all pagination label templates.
 */
export interface PaginationContext {
  from: number;
  to: number;
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  selectedCount: number;
}

/**
 * Label: static string with {variable} templates, or a function.
 */
export type PaginationLabel =
  | string
  | ((ctx: PaginationContext) => string)
  | ((ctx: PaginationContext) => ReactNode);

export type PaginationVariant = "full" | "compact" | "minimal" | "none";

export interface PaginationMeta {
  enabled?: boolean;
  variant?: PaginationVariant;
  showPageNumbers?: boolean;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  maxVisiblePages?: number;
  showFirstLast?: boolean;
  /** Server/template label format e.g. "Displaying {from} to {to} of {total} items" */
  display_format?: PaginationLabel;
  labels?: {
    displayLabel?: PaginationLabel;
    selectedLabel?: PaginationLabel;
    pageInfo?: PaginationLabel;
    page?: string;
    of?: string;
    previous?: string;
    next?: string;
    first?: string;
    last?: string;
    rowsPerPage?: string;
  };
}

// ── UI Slot Props — render prop slots for polymorphism ────────────────

export interface CellSlotProps {
  value: unknown;
  row: Row<unknown>;
  column: Column<unknown, unknown>;
  cell: Cell<unknown, unknown>;
  isSelected: boolean;
  isHovered: boolean;
}

export interface RowSlotProps {
  row: Row<unknown>;
  index: number;
  cells: ReactNode[];
  isSelected: boolean;
  isHovered: boolean;
}

export interface HeaderSlotProps {
  header: import("@tanstack/react-table").Header<unknown, unknown>;
  column: Column<unknown, unknown>;
}

export interface PaginationSlotProps {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  from: number;
  to: number;
}

export interface EmptySlotProps {
  /** Main message to display */
  message?: string;
  /** Optional title/heading */
  title?: string;
  /** Optional description/subtitle */
  description?: string;
  /** Optional icon override (Lucide icon component) */
  icon?: React.ElementType;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline" | "ghost";
    icon?: React.ElementType;
  };
  /** Optional secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline" | "ghost";
  };
  /** Context hint for adaptive messaging */
  context?: "no-data" | "no-results" | "no-permissions" | "offline" | "custom";
  /** Illustration size */
  illustrationSize?: "sm" | "md" | "lg" | "xl";
  /** Custom illustration component */
  illustration?: React.ReactNode;
  /** Whether to show a subtle background pattern */
  showPattern?: boolean;
}

export interface LoadingSlotProps {
  /** Number of skeleton rows to render */
  rows?: number;
  /** Number of skeleton columns */
  columns?: number;
  /** Loading message */
  message?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Show progress indicator */
  showProgress?: boolean;
  /** Current progress (0-1) for determinate progress */
  progress?: number;
  /** Skeleton variant */
  variant?: "rows" | "cards" | "table" | "list";
  /** Minimum time to show loader (ms) to prevent flicker */
  minDuration?: number;
  /** Callback when loading completes */
  onComplete?: () => void;
}

export interface ErrorSlotProps {
  error: Error | null;
  /** Retry callback */
  retry?: () => void;
  /** Error classification for adaptive UI */
  classification?: "network" | "server" | "permission" | "validation" | "not-found" | "timeout" | "unknown";
  /** User-friendly error title override */
  title?: string;
  /** User-friendly error description override */
  description?: string;
  /** Custom error code for support/reference */
  errorCode?: string;
  /** Additional actions beyond retry */
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline" | "destructive";
    icon?: React.ElementType;
  }>;
  /** Show error details toggle */
  showDetails?: boolean;
  /** Callback when error is dismissed */
  onDismiss?: () => void;
  /** Enable auto-retry with backoff */
  autoRetry?: boolean;
  /** Max auto-retry attempts */
  maxRetries?: number;
  /** Base retry delay (ms) */
  baseRetryDelay?: number;
}

export interface RowActionsSlotProps {
  row: Row<unknown>;
  /** The row's original data */
  rowData: unknown;
}

// ── TableMeta — decomposed into focused sub-interfaces (ISP) ─────────
//
// Each sub-interface represents a single responsibility.
// Consumers depend ONLY on the sub-interface they need, not the full TableMeta.
// The main TableMeta composes all sub-interfaces for convenience.

export interface UrlConfig {
  keys: {
    page: string;
    size: string;
    search: string;
    sort: string;
    filter: string;
  };
  format: {
    separator: ":" | "." | "-";
  };
  defaults: {
    page: number;
    size: number;
    search: string;
  };
}

/**
 * Consumer-facing `url` input. Nested `keys` / `defaults` are partial so a
 * caller can override a single URL key (`{ keys: { page: "p" } }`) and let
 * `resolveTableMeta` / `resolveUrlConfig` fill the rest from the defaults.
 * `UrlConfig` itself stays fully required — it is the resolved shape.
 */
export type UrlConfigInput = Partial<Omit<UrlConfig, "keys" | "defaults">> & {
  keys?: Partial<UrlConfig["keys"]>;
  defaults?: Partial<UrlConfig["defaults"]>;
};

/** Only `urlSync` is wired. Modules and chrome are composed, not flagged. */
export interface FeatureFlags {
  urlSync: boolean;
}

export interface VisualConfig {
  stickyHeader?: boolean;
  striped?: boolean;
  columnStriped?: boolean;
  bordered?: boolean;
  shadow?: boolean | "sm" | "md" | "lg";
  compact?: boolean;
  showIndex?: boolean;
  indexLabel?: string;
  enableHeaderFilter?: boolean;
  showSortIcon?: boolean;
}

export interface UIMapping {
  cell?: ComponentType<CellSlotProps>;
  row?: ComponentType<RowSlotProps>;
  header?: ComponentType<HeaderSlotProps>;
  pagination?: ComponentType<PaginationSlotProps>;
  empty?: ComponentType<EmptySlotProps>;
  loading?: ComponentType<LoadingSlotProps>;
  error?: ComponentType<ErrorSlotProps>;
  actions?: ComponentType<RowActionsSlotProps>;
}

/**
 * Semantic descriptor attached to a column.
 *
 * Only `type` is required: it is what Intl formatting and type coercion need.
 * The rest of `FormFieldSchema` is optional because consumers already fall back
 * to the column id when it is missing (see `ColumnFilterPopover`), and a
 * non-editable column never needs a complete form field. The inline-edit path
 * requires a complete `FormFieldSchema` and narrows with
 * `isCompleteFieldSchema`.
 */
export type ColumnFieldSchema = Pick<FormFieldSchema, "type"> &
  Partial<FormFieldSchema>;

export * from "./cell-variants";
import type {
  CellBadgeConfig,
  CellBorder,
  CellIntent,
  CellNumericFormat,
  CellVariant,
} from "./cell-variants";

export interface TableColumnMeta {
  id: string;
  label: string | TranslatedText;
  sortable?: boolean;
  filterable?: boolean;
  pinned?: "left" | "right" | false;
  hidden?: boolean;
  width?: number;
  align?: "left" | "center" | "right";
  renderer?: "text" | "badge" | "avatar" | "currency" | "date" | string;
  /** Atomic cell visual archetype */
  variant?: CellVariant;
  /** Vertical border style */
  border?: CellBorder;
  /** Semantic intent or dynamic resolver */
  intent?: CellIntent | ((value: unknown, row: unknown) => CellIntent);
  /** Numeric / Currency formatting configuration */
  numericFormat?: CellNumericFormat;
  /** Badge mapping table for enum values */
  badgeMap?: Record<string, CellBadgeConfig>;
  /** Enable hover copy-to-clipboard button */
  copyable?: boolean;
  /** Tooltip string or dynamic resolver */
  tooltip?: string | ((value: unknown, row: unknown) => string);
  /** Secondary subtitle for identity variant */
  subtitle?: string | ((row: unknown) => ReactNode);
  /** Leading icon for identity variant */
  icon?: ReactNode | ((row: unknown) => ReactNode);
  /** Highlight column when sorted, filtered, or active */
  highlight?: "sort" | "filter" | "search" | "always";
  /**
   * Semantic data type from the server schema.
   * Describes the field's type for Intl formatting and type-coercion.
   * Does NOT activate inline editing — use `editable: true` for that.
   */
  fieldSchema?: ColumnFieldSchema;
  /**
   * Opt-in inline editing for this column.
   * Requires `fieldSchema` to be defined AND `<InlineEditProvider>` to be
   * present in the component tree. Without the provider, this will throw.
   *
   * @default false
   */
  editable?: boolean;
  fieldRenderer?: string;
  formatOptions?: Record<string, unknown> & {
    currency?: string;
    locale?: string;
    dateFormat?: Intl.DateTimeFormatOptions;
  };
}

export type TableRowVariant =
  | "default"
  | "striped"
  | "bordered"
  | "separated"
  | "cards";

export type RowExpansionMode = "contextual" | "exclusive";

export interface RowExpansionPolicy {
  lockRows?: boolean;
  lockSorting?: boolean;
  lockFiltering?: boolean;
  closeOnOtherClick?: boolean;
}

export interface RowContext<T = any> {
  data: T;
  id: string;
  index: number;
  selected: boolean;
  expanded: boolean;
  locked: boolean;
  row: Row<T>;
  table: {
    activeView: ViewMode;
    meta: TableMeta;
  };
  expansion: {
    isExpanded: boolean;
    toggle: () => void;
    close: () => void;
  };
  actions: {
    lock: () => void;
    unlock: () => void;
  };
}

export interface RowExpansionConfig<T = any> {
  mode?: RowExpansionMode;
  policy?: RowExpansionPolicy;
  render: (props: { context: RowContext<T> }) => ReactNode;
}

export interface TableMeta<TMeta = Record<string, unknown>> {
  id: string;
  url?: UrlConfigInput;
  features?: Partial<FeatureFlags>;
  columns?: TableColumnMeta[];
  pagination?: Partial<PaginationMeta>;
  ui?: UIMapping;
  stickyHeader?: boolean;
  striped?: boolean;
  columnStriped?: boolean;
  bordered?: boolean;
  shadow?: boolean | "sm" | "md" | "lg";
  compact?: boolean;
  variant?: TableRowVariant;
  maxHeight?: string | number;
  showIndex?: boolean;
  indexLabel?: string;
  enableHeaderFilter?: boolean;
  showSortIcon?: boolean;
  expansion?: RowExpansionConfig<any>;
  /** Custom domain metadata */
  meta?: TMeta;
  [key: string]: unknown;
}

// ── TableHandle — imperative DOM handle exposed via forwardRef ────────

export interface TableHandle {
  scrollToTop: () => void;
  scrollToRow: (rowId: string) => void;
  focusFirstCell: () => void;
  getBodyElement: () => HTMLTableSectionElement | null;
  getContainerElement: () => HTMLDivElement | null;
}

// ── TableDOMRefs ─────────────────────────────────────────────────────

export interface TableDOMRefs {
  containerRef: RefObject<HTMLDivElement | null>;
  scrollerRef: RefObject<HTMLDivElement | null>;
  tableRef: RefObject<HTMLTableElement | null>;
  headerRef: RefObject<HTMLTableSectionElement | null>;
  bodyRef: RefObject<HTMLTableSectionElement | null>;
  paginationRef: RefObject<HTMLElement | null>;
}

// ── ParseResult — discriminated union for URL parsers ─────────────────

export interface ParseError {
  code: "MALFORMED" | "EMPTY" | "INVALID_VALUE" | "TOO_LONG";
  field: string;
  raw: string;
  message: string;
}

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ParseError };

// ── HookSignature — typed hook config object ──────────────────────────

export interface HookSignature {
  enabled?: boolean;
}

// ── DataSource — client or server ─────────────────────────────────────

export interface TableQueryParams {
  page: number;
  pageSize: number;
  offset: number;
  sort: { key: string; dir: "asc" | "desc" }[];
  filters: Record<string, unknown>;
  search: string;
}

/**
 * Canonical page payload. The fetcher unwraps the HTTP envelope
 * (`ResponseFactory.parse(response).parsePaginated()`) and returns this shape.
 */
export interface TableServerResponse<T> {
  rows: T[];
  totalCount: number;
}

/** Shared status union for export/import tasks and ProgressModal. */
export type TableTaskStatus =
  | "idle"
  | "uploading"
  | "pending"
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export type TableFetchGate = "auto" | "manual";

import type { QueryDialectAdapter } from "./url/dialects";

export type ServerDataSource<T> = {
  type: "server";
  fetcher: (
    params: TableQueryParams,
    serializedParams?: Record<string, string>,
    signal?: AbortSignal
  ) => Promise<TableServerResponse<T> | PaginatedResponse<T>>;
  /**
   * Proactive eligibility. Return false to skip this attempt (including refetch).
   * Use for required filters: `(p) => Boolean(p.filters.branchId)`.
   */
  guard?: (params: TableQueryParams) => boolean;
  /**
   * Fetch policy.
   * - `auto` (proactive, default): fetch on mount and whenever the query changes, if `guard` allows.
   * - `manual` (reactive): fetch only on `search()` / `refetch()`, if `guard` allows.
   *   After the first successful fetch, page/sort still auto-refetch; filter/search wait for Search.
   */
  gate?: TableFetchGate;
  /** Query dialect for serializing params to backend format (REST, OData, RSQL). */
  dialect?: QueryDialectAdapter;
};

export type DataSource<T> = { type: "client"; data: T[] } | ServerDataSource<T>;

// ── TableActionContext — passed to action callbacks ───────────────────

export interface TableActionContext {
  mode: "MANUAL" | "PAGE" | "ALL";
  selectedIds: string[];
  excludedIds: string[];
  totalCount: number;
  search?: string;
  sort?: { id: string; desc: boolean }[];
  filters?: { id: string; value: unknown }[];
}

// ── TablePlugin contract ──────────────────────────────────────────────

export interface TablePlugin {
  name: string;
  slots?: Record<string, ComponentType<unknown>>;
  onMount?: (table: TanStackTable<unknown>) => void;
  onUnmount?: () => void;
}

// ── ViewMode ──────────────────────────────────────────────────────────

export type ViewMode =
  | "table"
  | "board"
  | "list"
  | "calendar"
  | "timeline"
  | (string & {});

// ── TableFeature Contract (Microkernel Plugin Architecture) ───────────

export interface TableFeatureContext<T = any> {
  tableId: string;
  engine: import("../core/table-engine").ITableEngine<T>;
  domRefs: TableDOMRefs;
  viewMode: ViewMode;
  meta: import("../meta/TableMetaDefaults").ResolvedTableMeta | TableMeta;
}

export interface TableFeature<T = any, TApi = any> {
  name: string;
  setup?: (context: TableFeatureContext<T>) => void | (() => void);
  destroy?: () => void;
  api?: TApi;
}

// ── View Inversion Contract ───────────────────────────────────────────

export type ViewRenderer<T = any> = (
  items: T[],
  engine: import("../core/table-engine").ITableEngine<T>,
  context: {
    rows: Row<T>[];
    totalCount: number;
    meta: import("../meta/TableMetaDefaults").ResolvedTableMeta | TableMeta;
    domRefs: TableDOMRefs;
  }
) => ReactNode;

export interface FormFieldSchema {
  id: string;
  name: string;
  label: string | TranslatedText;
  type: FieldType;
  initialValue?: unknown;
  required?: boolean;
  visible?: boolean;
  enabled?: boolean;
  options?: FieldOption[];
  validation?: ValidationSettings;
  properties?: FieldProperties;
}

// ── Column def helper alias ───────────────────────────────────────────

export type { ColumnDef, SortingState, ColumnFiltersState, TanStackTable };

// ── Backward-compatible type aliases ──────────────────────────────────
// Old names kept for import compatibility during migration.

export type TableUrlMeta = UrlConfig;
export type TableFeatureMeta = FeatureFlags;
export type TableUISlots = UIMapping;
