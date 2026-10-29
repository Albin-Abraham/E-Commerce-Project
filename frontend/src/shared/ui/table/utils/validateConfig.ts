import type { DataSource, TableMeta } from "../types";

/**
 * validateConfig
 *
 * Development-mode validation for ZenithTable configuration.
 * Warns on common mistakes without breaking the app.
 * Only runs in development (process.env.NODE_ENV !== "production").
 */

const isDev =
  typeof process !== "undefined" && process.env?.NODE_ENV !== "production";

/** Wired feature flags */
const VALID_FEATURE_KEYS = new Set(["urlSync"]);

/** Former flags — they never enabled UI. Warn so consumers compose instead. */
const RETIRED_FEATURE_KEYS = new Set([
  "pagination",
  "sorting",
  "filtering",
  "selection",
  "export",
  "serverExport",
  "import",
  "bulkDelete",
  "sendEmail",
  "viewSwitch",
  "inlineEdit",
  "persistState",
]);

/** Known TableMeta top-level keys */
const VALID_META_KEYS = new Set([
  "id",
  "url",
  "features",
  "columns",
  "pagination",
  "ui",
  "striped",
  "bordered",
  "shadow",
  "stickyHeader",
  "compact",
]);

function warn(msg: string) {
  if (isDev) {
    console.warn(`[ZenithTable] ${msg}`);
  }
}

/**
 * Validate TableMeta configuration.
 * Call this in useTableController or useZenithTable.
 */
export function validateMeta(meta: TableMeta): void {
  if (!isDev) return;

  // Required: meta.id
  if (!meta.id || typeof meta.id !== "string") {
    warn(
      "meta.id is required and must be a string. Without it, URL sync and multi-table pages will break."
    );
  }

  if (meta.features) {
    const keys = Object.keys(meta.features);
    for (const key of keys) {
      if (RETIRED_FEATURE_KEYS.has(key)) {
        warn(
          `Feature flag "${key}" is not wired. Compose chrome (Pagination, Toolbar) or TableCore modules instead. The only feature flag is urlSync.`
        );
      } else if (!VALID_FEATURE_KEYS.has(key)) {
        warn(
          `Unknown feature flag "${key}". Did you mean one of: ${Array.from(VALID_FEATURE_KEYS).join(", ")}?`
        );
      }
    }
  }

  // Top-level meta typos
  const metaKeys = Object.keys(meta);
  for (const key of metaKeys) {
    if (!VALID_META_KEYS.has(key)) {
      warn(
        `Unknown meta key "${key}". Valid keys: ${Array.from(VALID_META_KEYS).join(", ")}`
      );
    }
  }
}

/**
 * Validate DataSource configuration.
 * Call this in useTableController.
 */
export function validateSource<T>(source: DataSource<T>): void {
  if (!isDev) return;

  if (!source || typeof source !== "object") {
    warn(
      "source must be an object with a 'type' property ('client' or 'server')."
    );
    return;
  }

  if (source.type === "server") {
    const serverSource = source as Extract<DataSource<T>, { type: "server" }>;
    if (!serverSource.fetcher || typeof serverSource.fetcher !== "function") {
      warn(
        "source.type is 'server' but source.fetcher is missing. Server-side data fetching will fail."
      );
    }
  } else if (source.type === "client") {
    const clientSource = source as Extract<DataSource<T>, { type: "client" }>;
    if (!Array.isArray(clientSource.data)) {
      warn("source.type is 'client' but source.data is not an array.");
    }
  } else {
    warn(
      `Unknown source.type "${(source as any).type}". Expected "client" or "server".`
    );
  }
}

/**
 * Validate column definitions.
 * Call this in useTableController or useZenithTable.
 */
/**
 * Minimal shape required to validate a column.
 *
 * Only `id` is inspected, so both table meta columns and TanStack `ColumnDef`s
 * are accepted.
 */
export interface ValidatableColumn {
  id?: string;
}

export function validateColumns(columns: ValidatableColumn[]): void {
  if (!isDev) return;

  if (!Array.isArray(columns) || columns.length === 0) {
    warn(
      "columns array is empty. The table will render with no visible columns."
    );
    return;
  }

  const ids = new Set<string>();
  for (const col of columns) {
    if (!col.id) {
      warn("Column missing 'id' property. Each column must have a unique id.");
    } else if (ids.has(col.id)) {
      warn(
        `Duplicate column id "${col.id}". Each column must have a unique id.`
      );
    } else {
      ids.add(col.id);
    }
  }
}

/**
 * Run all validations for a table configuration.
 * Exported for use in hooks.
 */
export function validateTableConfig<T>(config: {
  meta?: TableMeta;
  source?: DataSource<T>;
  columns?: ValidatableColumn[];
}): void {
  if (!isDev) return;
  if (config.meta) validateMeta(config.meta);
  if (config.source) validateSource(config.source);
  if (config.columns) validateColumns(config.columns);
}
