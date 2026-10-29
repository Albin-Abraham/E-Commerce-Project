import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import type { TableFetchGate } from "@ui/table/types";

/**
 * Fetch policy + in-flight state for chrome inside <ZenithTable>.
 * Guard/gate live on the data source; this context only exposes the
 * controller actions and status so Toolbar/Body do not own extra state.
 */
export interface TableFetchContextValue {
  search: () => void;
  refetch: () => void;
  canFetch: boolean;
  hasFetched: boolean;
  gate: TableFetchGate;
  loading: boolean;
  error: Error | null;
}

const DEFAULT_FETCH: TableFetchContextValue = {
  search: () => {},
  refetch: () => {},
  canFetch: true,
  hasFetched: false,
  gate: "auto",
  loading: false,
  error: null,
};

const TableFetchContext = createContext<TableFetchContextValue>(DEFAULT_FETCH);

export function useTableFetch(): TableFetchContextValue {
  return useContext(TableFetchContext);
}

export function TableFetchProvider({
  value,
  children,
}: {
  value: Partial<TableFetchContextValue>;
  children: ReactNode;
}) {
  const resolved = useMemo<TableFetchContextValue>(
    () => ({ ...DEFAULT_FETCH, ...value }),
    [
      value.search,
      value.refetch,
      value.canFetch,
      value.hasFetched,
      value.gate,
      value.loading,
      value.error,
    ]
  );

  return (
    <TableFetchContext.Provider value={resolved}>
      {children}
    </TableFetchContext.Provider>
  );
}
