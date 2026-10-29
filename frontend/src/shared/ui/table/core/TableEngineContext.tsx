import { createContext, useContext } from "react";

import type { ITableEngine } from "./table-engine";

/**
 * TableEngineContext — Layer 1
 *
 * Provides the table engine instance to all compound components.
 * Uses ITableEngine<T> as the canonical type — consumers must never
 * import or reference TanStack types directly.
 */

export interface TableEngineContextValue<T> {
  engine: ITableEngine<T>;
}

export const TableEngineContext =
  createContext<TableEngineContextValue<unknown> | null>(null);

export function useTableContext<T>(): TableEngineContextValue<T> {
  const context = useContext(TableEngineContext);
  if (!context) {
    throw new Error(
      "[ZenithTable] useTableContext must be used inside a <ZenithTable> component."
    );
  }
  return context as TableEngineContextValue<T>;
}

/**
 * Typed accessor for the engine directly.
 * Prefer this over useTableContext when you only need the engine.
 */
export function useTableEngine<T = unknown>(): ITableEngine<T> {
  return useTableContext<T>().engine;
}
