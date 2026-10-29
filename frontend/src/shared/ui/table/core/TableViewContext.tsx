import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { ViewMode } from "@ui/table/types";

/**
 * TableViewContext — Layer 5
 *
 * Controls which view is active: "table" | "board" | "list".
 * ZenithTable.View reads this to decide what to render.
 * ZenithTable.ViewSwitcher writes to this.
 */

interface TableViewContextValue {
  activeView: ViewMode;
  setView: (view: ViewMode) => void;
  showIndex: boolean;
  setShowIndex: (show: boolean) => void;
}

const TableViewContext = createContext<TableViewContextValue | null>(null);

export function useTableView(): TableViewContextValue {
  const ctx = useContext(TableViewContext);
  if (!ctx) {
    throw new Error(
      "[ZenithTable] useTableView must be used inside a <ZenithTable> component."
    );
  }
  return ctx;
}

interface TableViewProviderProps {
  defaultView?: ViewMode;
  children: ReactNode;
}

export function TableViewProvider({
  defaultView = "table",
  children,
}: TableViewProviderProps) {
  const [activeView, setView] = useState<ViewMode>(defaultView);
  const [showIndex, setShowIndex] = useState(false);
  const value = useMemo(
    () => ({ activeView, setView, showIndex, setShowIndex }),
    [activeView, showIndex]
  );

  return (
    <TableViewContext.Provider value={value}>
      {children}
    </TableViewContext.Provider>
  );
}
