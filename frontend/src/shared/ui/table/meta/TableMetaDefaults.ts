import { isArray, mergeWith } from "lodash-es";

import type {
  FeatureFlags,
  PaginationMeta,
  TableColumnMeta,
  TableMeta,
  UIMapping,
  UrlConfig,
  UrlConfigInput,
} from "@ui/table/types";

/**
 * Default TableMeta configuration.
 * Every field has a safe default — consumers only override what they need.
 */
/**
 * The fully-resolved pagination shape: `PaginationMeta` keeps every key
 * optional for consumers, but these defaults ship all of them, so consumers of
 * `DEFAULT_TABLE_META.pagination` should not have to re-guard `.labels`.
 */
type ResolvedPaginationMeta = Required<Omit<PaginationMeta, "labels" | "display_format">> & {
  display_format?: PaginationMeta["display_format"];
  labels: Required<NonNullable<PaginationMeta["labels"]>>;
};

/**
 * A `TableMeta` with every key present and every nested partial flattened.
 *
 * This is the canonical post-`resolveTableMeta` type. `Required<TableMeta>` is
 * NOT equivalent: `Required<T>` only strips `undefined` from the top level, so
 * the nested `Partial<UrlConfig>` / `Partial<PaginationMeta>` survive and leave
 * `.url.keys` possibly-undefined — which is what forced consumers into `!` and
 * `as` casts. Use this instead.
 */
export type ResolvedTableMeta = {
  id: string;
  url: UrlConfig;
  features: FeatureFlags;
  columns: TableColumnMeta[];
  pagination: ResolvedPaginationMeta;
  stickyHeader: boolean;
  striped: boolean;
  columnStriped?: boolean;
  bordered: boolean;
  shadow: boolean | "sm" | "md" | "lg";
  compact: boolean;
  showIndex?: boolean;
  indexLabel?: string;
  enableHeaderFilter?: boolean;
  showSortIcon?: boolean;
  ui: UIMapping;
};

/**
 * Spelled out property-by-property rather than via `Required<TableMeta>`:
 * `Required<T>` only strips `undefined` from the top level, so the nested
 * `Partial<UrlConfig>` / `Partial<PaginationMeta>` would survive and leave
 * `DEFAULT_TABLE_META.url.keys` possibly-undefined for every consumer.
 *
 * `ui` stays a plain `UIMapping` — every slot is optional by design, so the
 * default is an empty mapping rather than a set of stub components; consumers
 * override only the slots they need and `resolveTableMeta` deep-merges.
 */
export const DEFAULT_TABLE_META: ResolvedTableMeta = {
  id: "",
  // Visual defaults — the unstyled baseline every table starts from.
  stickyHeader: true,
  striped: false,
  columnStriped: false,
  bordered: false,
  shadow: false,
  compact: false,
  showIndex: false,
  indexLabel: "SL NO",
  enableHeaderFilter: true,
  showSortIcon: true,
  ui: {},
  url: {
    keys: {
      page: "page",
      size: "size",
      search: "search",
      sort: "sort",
      filter: "filter",
    },
    format: { separator: ":" },
    defaults: { page: 0, size: 10, search: "" },
  },
  features: {
    urlSync: true,
  },
  columns: [],
  pagination: {
    enabled: true,
    variant: "full",
    display_format: undefined,
    showPageNumbers: true,
    showPageSizeSelector: false,
    pageSizeOptions: [10, 25, 50, 100],
    maxVisiblePages: 7,
    showFirstLast: true,
    labels: {
      displayLabel: "Showing {from}-{to} of {total} records",
      selectedLabel: "{selectedCount} selected",
      pageInfo: "{page} of {totalPages}",
      page: "Page",
      of: "of",
      previous: "Previous",
      next: "Next",
      first: "First",
      last: "Last",
      rowsPerPage: "Rows per page",
    },
  },
};

function serializeBehaviorValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val !== "object") return String(val);
  if (Array.isArray(val)) {
    return `[${val.map(serializeBehaviorValue).join(",")}]`;
  }
  const entries = Object.entries(val as Record<string, unknown>)
    .filter(([_, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${k}:${serializeBehaviorValue(v)}`).join(",")}}`;
}

/**
 * Stable primitive key for the meta fields that change table behavior.
 * Used as a useMemo dependency so inline `{ id, features }` objects do not
 * re-resolve every render, while url/feature/pagination edits still apply.
 *
 * Deterministic and zero-dependency (no JSON.stringify).
 */
export function metaBehaviorKey(meta: TableMeta): string {
  return serializeBehaviorValue({
    id: meta.id,
    url: meta.url,
    features: meta.features,
    pagination: meta.pagination,
  });
}


/**
 * resolveTableMeta
 *
 * Deep-merges consumer meta with defaults.
 * Throws if `meta.id` is missing or empty — required for URL key namespacing.
 */
export function resolveTableMeta<TMeta = Record<string, unknown>>(
  meta: TableMeta<TMeta>
): ResolvedTableMeta & TMeta {
  if (!meta.id || meta.id.trim() === "") {
    throw new Error(
      "[ZenithTable] meta.id is required and must be unique per page. " +
        "It is used to namespace URL params (e.g. orders:page, orders:sort). " +
        "Without it, two tables on the same page will overwrite each other's URL state."
    );
  }

  return mergeWith(
    {},
    DEFAULT_TABLE_META,
    meta,
    (objVal: unknown, srcVal: unknown) => {
      // Arrays are replaced, not concatenated. This ensures columns[] overrides correctly.
      if (isArray(objVal) && isArray(srcVal)) {
        return srcVal;
      }
    }
  ) as ResolvedTableMeta & TMeta;
}

/**
 * resolveUrlConfig
 *
 * Merges a (possibly partial) `TableMeta["url"]` over the defaults and
 * guarantees a complete `UrlConfig`.
 *
 * Needed because `Required<TableMeta>` only strips `undefined` from a property
 * — it does not unwrap the property's own `Partial<>`, so
 * `Required<TableMeta>["url"]` is still `Partial<UrlConfig>`. Callers that need
 * every key present (the URL reader/writer, ParsePipeline) used to paper over
 * that with `!` and `as` casts, which crashed on a partial meta.
 */
export function resolveUrlConfig(url?: UrlConfigInput): UrlConfig {
  return mergeWith(
    {},
    DEFAULT_TABLE_META.url as UrlConfig,
    url ?? {},
    (objVal: unknown, srcVal: unknown) => {
      if (isArray(objVal) && isArray(srcVal)) {
        return srcVal;
      }
    }
  ) as UrlConfig;
}

/**
 * Utility to combine top-level ZenithTable props into TableMeta cleanly without repetition (DRY principle).
 * Filters out undefined props so user defaults in meta are preserved when props are not provided.
 */
export function resolveTablePropsMeta(
  meta?: TableMeta,
  props?: {
    striped?: boolean;
    columnStriped?: boolean;
    bordered?: boolean;
    shadow?: boolean | "sm" | "md" | "lg";
    stickyHeader?: boolean;
    showIndex?: boolean;
    indexLabel?: string;
    enableHeaderFilter?: boolean;
    showSortIcon?: boolean;
    density?: "compact" | "comfortable";
  }
): TableMeta {
  const baseMeta: TableMeta = meta || { id: "table" };
  if (!props) return baseMeta;

  const overrides: Record<string, unknown> = {};
  if (props.striped !== undefined) overrides.striped = props.striped;
  if (props.columnStriped !== undefined) overrides.columnStriped = props.columnStriped;
  if (props.bordered !== undefined) overrides.bordered = props.bordered;
  if (props.shadow !== undefined) overrides.shadow = props.shadow;
  if (props.stickyHeader !== undefined) overrides.stickyHeader = props.stickyHeader;
  if (props.showIndex !== undefined) overrides.showIndex = props.showIndex;
  if (props.indexLabel !== undefined) overrides.indexLabel = props.indexLabel;
  if (props.enableHeaderFilter !== undefined) overrides.enableHeaderFilter = props.enableHeaderFilter;
  if (props.showSortIcon !== undefined) overrides.showSortIcon = props.showSortIcon;
  if (props.density !== undefined) overrides.compact = props.density === "compact";

  return {
    ...baseMeta,
    ...overrides,
  };
}

