import React, { createContext, useContext, useMemo } from "react";
import type { TableSurfaceLayoutConfig, ZenithTablePreset } from "../types/layout";

export const PRESET_CONFIGS: Record<
  ZenithTablePreset,
  TableSurfaceLayoutConfig
> = {
  crud: {
    toolbar: { layout: "inline", align: "between" },
    search: { align: "start", width: "md", variant: "standard" },
    filters: { placement: "toolbar", align: "start" },
    pagination: { position: "bottom", align: "between", variant: "full" },
    selectionDisplay: "toolbar",
  },
  analytics: {
    toolbar: { layout: "split", align: "between" },
    search: { align: "start", width: "sm", variant: "standard" },
    filters: { placement: "bar", align: "start" },
    pagination: { position: "both", align: "split-three", variant: "full" },
    selectionDisplay: "both",
  },
  minimal: {
    toolbar: { layout: "compact", align: "between" },
    search: { align: "start", variant: "expandable", width: "sm" },
    filters: { placement: "toolbar", align: "end" },
    pagination: { position: "bottom", align: "center", variant: "compact" },
    selectionDisplay: "floating-hud",
  },
  "master-detail": {
    toolbar: { layout: "inline", align: "between" },
    search: { align: "start", width: "md" },
    filters: { placement: "sidebar" },
    pagination: { position: "bottom", align: "between", variant: "compact" },
    selectionDisplay: "toolbar",
  },
};

export interface TableLayoutContextValue {
  layout: TableSurfaceLayoutConfig;
}

const TableLayoutContext = createContext<TableLayoutContextValue>({
  layout: {},
});

export interface TableLayoutProviderProps {
  children: React.ReactNode;
  layout?: TableSurfaceLayoutConfig;
  preset?: ZenithTablePreset;
}

export function TableLayoutProvider({
  children,
  layout,
  preset,
}: TableLayoutProviderProps) {
  const resolvedLayout = useMemo(() => {
    const activePreset = preset ?? layout?.preset;
    const base = activePreset ? PRESET_CONFIGS[activePreset] : {};
    return {
      ...base,
      ...layout,
      toolbar: { ...base.toolbar, ...layout?.toolbar },
      search: { ...base.search, ...layout?.search },
      filters: { ...base.filters, ...layout?.filters },
      pagination: { ...base.pagination, ...layout?.pagination },
    };
  }, [layout, preset]);

  return (
    <TableLayoutContext.Provider value={{ layout: resolvedLayout }}>
      {children}
    </TableLayoutContext.Provider>
  );
}

export function useTableLayout(): TableSurfaceLayoutConfig {
  return useContext(TableLayoutContext).layout;
}
