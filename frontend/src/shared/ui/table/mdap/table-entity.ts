import type { ColumnDef } from "@tanstack/react-table";
import type { FormDefinition } from "@ui/form/types";

import type {
  ImportFileValidationRules,
  UseImportSignature,
} from "../core/modules/ImportModule";
import type {
  ExportFormat,
  ServerExportCreateResponse,
  ServerExportParams,
} from "../core/modules/ServerExportModule";
import type { ExportTaskStatusResult } from "../hooks/useExportTask";
import type {
  DataSource,
  FeatureFlags,
  FormFieldSchema,
  PaginationMeta,
  ServerDataSource,
  TableColumnMeta,
  TableFetchGate,
  TableMeta,
  TableQueryParams,
  UrlConfig,
} from "../types";

/**
 * MDAP Layer 1 — Content.
 * Columns are TableColumnMeta JSON. Filters are MDAP form fields
 * (select, autocomplete, date, …) compiled into a FormDefinition.
 */
export interface TableContentDefinition<T> {
  columns: TableColumnMeta[];
  /** Toolbar / dropdown filters. Field `name: "search"` writes globalFilter. */
  filters?: FormFieldSchema[];
  getRowId?: (row: T, index: number) => string;
}

/**
 * Server-side export fetchers. Compiled onto CompiledTableDef.serverExport;
 * still consumed with TableCore.ServerExport.useServerExport.
 */
export interface TableExportBehavior {
  createExport: (
    params: ServerExportParams
  ) => Promise<ServerExportCreateResponse>;
  getStatus: (taskId: string) => Promise<ExportTaskStatusResult>;
  downloadFile: (taskId: string, filename?: string) => Promise<void>;
  filename?: string;
  formats?: ExportFormat[];
}

/**
 * Import fetchers. Compiled onto CompiledTableDef.import;
 * still consumed with TableCore.Import.useImport or useImportTask.
 * `useMDAPTable` does not auto-mount the plugin or ProgressModal.
 */
export interface TableImportBehavior {
  uploadFile: UseImportSignature["uploadFile"];
  getStatus: UseImportSignature["getStatus"];
  onRefresh?: () => void;
  fileValidation?: ImportFileValidationRules;
  additionalData?: Record<string, unknown>;
}

/**
 * How import is opened. Not a feature flag.
 * `page` requires `onImport` (navigate / open a route).
 */
export type TableImportSurface =
  | { mode: "modal" }
  | { mode: "page"; onImport: () => void };

/**
 * MDAP Layer 4 — Behavior.
 * Fetcher / guard / gate / export / import live here. DataSource is compiler output.
 */
export interface TableBehaviorDefinition<T> {
  client?: { data: T[]; totalCount?: number };
  server?: {
    fetcher: ServerDataSource<T>["fetcher"];
    guard?: (params: TableQueryParams) => boolean;
    gate?: TableFetchGate;
  };
  export?: TableExportBehavior;
  import?: TableImportBehavior;
}

/**
 * Named chrome slots compiled onto `CompiledTableDef.chrome`.
 */
export interface TableChromeFlags {
  /** Toolbar Export button. Default: `Boolean(behavior.export)`. */
  exportBtn?: boolean;
  /** Toolbar Import button. Default: `Boolean(behavior.import)`. */
  importBtn?: boolean;
  /** Toolbar Delete button. Default: `false`. */
  deleteBtn?: boolean;
  /** Filter count badge — Toolbar and FilterBar (`^2`). Default: `Boolean(content.filters)`. */
  filterStatusBadge?: boolean;
}

/**
 * MDAP Layer 2 — Surface.
 * Chrome and URL. Not visual tokens.
 */
export interface TableSurfaceDefinition {
  pagination?: boolean | Partial<PaginationMeta>;
  toolbar?: boolean;
  filterBar?: boolean;
  selectionActionBar?: boolean;
  /** Modal overlay vs navigate to an import page. Optional — feature may compose without it. */
  import?: TableImportSurface;
  /** Override inferred `{exportBtn}` / `{importBtn}` / `{deleteBtn}` / `{filterStatusBadge}`. */
  exportBtn?: boolean;
  importBtn?: boolean;
  deleteBtn?: boolean;
  filterStatusBadge?: boolean;
  url?: Partial<UrlConfig>;
  features?: Partial<FeatureFlags>;
}

/**
 * MDAP Layer 5 — Presentation.
 */
export interface TablePresentationDefinition {
  striped?: boolean;
  bordered?: boolean;
  shadow?: TableMeta["shadow"];
  stickyHeader?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * MDAP table entity. Author this; compile to UseZenithTableConfig.
 */
export interface TableEntity<T> {
  id: string;
  name: string;
  content: TableContentDefinition<T>;
  behavior?: TableBehaviorDefinition<T>;
  surface?: TableSurfaceDefinition;
  presentation?: TablePresentationDefinition;
}

/**
 * Flattened runtime — input to useZenithTable / useTableController.
 * Structurally compatible with UseZenithTableConfig.
 */
export interface CompiledTableDef<T> {
  meta: TableMeta;
  columns: ColumnDef<T>[];
  source: DataSource<T>;
  totalCount?: number;
  getRowId?: (row: T, index: number) => string;
  pagination?: boolean;
  toolbar?: boolean;
  filterBar?: boolean;
  selectionActionBar?: boolean;
  className?: string;
  striped?: boolean;
  bordered?: boolean;
  shadow?: TableMeta["shadow"];
  stickyHeader?: boolean;
  /** MDAP FormDefinition for FilterBar and column-filter popovers. */
  filterForm?: FormDefinition;
  serverExport?: TableExportBehavior;
  import?: TableImportBehavior;
  importSurface?: TableImportSurface;
  /** Inferred chrome slots for Toolbar / FilterBar. */
  chrome?: TableChromeFlags;
}
