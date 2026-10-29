import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import {
  metaBehaviorKey,
  resolveTableMeta,
  resolveUrlConfig,
  type ResolvedTableMeta,
} from "@ui/table/meta/TableMetaDefaults";
import type { TableMeta, UrlConfig } from "@ui/table/types";

/**
 * TableMetaContext
 *
 * Makes the resolved TableMeta and domain metadata available to any compound component,
 * cell, or feature hook without prop drilling.
 */

const TableMetaContext = createContext<any>(null);

/**
 * Hook to access the fully resolved TableMeta along with any custom domain metadata.
 */
export function useTableMeta<
  TMeta = Record<string, unknown>,
>(): ResolvedTableMeta & TMeta {
  const ctx = useContext(TableMetaContext);
  if (!ctx) {
    throw new Error(
      "[ZenithTable] useTableMeta must be used inside a <ZenithTable> component."
    );
  }
  return ctx as ResolvedTableMeta & TMeta;
}

/**
 * Ergonomic alias for useTableMeta with typed domain metadata.
 *
 * @example
 * ```tsx
 * interface MyMeta {
 *   canApprove: boolean;
 *   onApprove: (id: string) => void;
 * }
 * const { canApprove, onApprove } = useMeta<MyMeta>();
 * ```
 */
export const useMeta = useTableMeta;

function isResolvedUrlConfig(url: UrlConfig | UrlConfigInput): url is UrlConfig {
  return (
    url !== undefined &&
    typeof url === "object" &&
    "keys" in url &&
    url.keys !== undefined &&
    "page" in url.keys &&
    "size" in url.keys &&
    "search" in url.keys &&
    "sort" in url.keys &&
    "filter" in url.keys
  );
}

export interface TableMetaProviderProps<TMeta extends Record<string, unknown> = Record<string, unknown>> {
  meta: TableMeta<TMeta> | (ResolvedTableMeta & TMeta);
  children: ReactNode;
}

export function TableMetaProvider<TMeta extends Record<string, unknown> = Record<string, unknown>>({
  meta,
  children,
}: TableMetaProviderProps<TMeta>) {
  const behaviorKey = metaBehaviorKey(meta);
  // Depend on a stable serialization, not object identity (inline literals)
  // and not id-only (features / url / pagination must still apply).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resolved = useMemo(() => {
    // If meta is already resolved (has complete UrlConfig), skip re-resolution
    if (isResolvedUrlConfig(meta.url)) {
      return meta as ResolvedTableMeta & TMeta;
    }
    return resolveTableMeta<TMeta>(meta);
  }, [behaviorKey]);
  return (
    <TableMetaContext.Provider value={resolved}>
      {children}
    </TableMetaContext.Provider>
  );
}

export { resolveTableMeta, resolveUrlConfig };
