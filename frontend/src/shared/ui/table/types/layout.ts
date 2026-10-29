import type { ReactNode } from "react";

export type ToolbarLayout = "inline" | "stacked" | "split" | "compact";
export type ToolbarAlign = "between" | "start" | "end" | "center";

export type SearchAlign = "start" | "center" | "end" | "full";
export type SearchVariant = "standard" | "minimal" | "expandable";
export type SearchWidth = "sm" | "md" | "lg" | "full";

export type FilterPlacement = "toolbar" | "bar" | "inline" | "sidebar";
export type FilterAlign = "start" | "end" | "center";

export type PaginationPosition = "bottom" | "top" | "both";
export type PaginationAlign =
  | "between"
  | "center"
  | "start"
  | "end"
  | "split-three";

export type ZenithTablePreset =
  | "crud"
  | "analytics"
  | "minimal"
  | "master-detail";

export interface TableSurfaceLayoutConfig {
  preset?: ZenithTablePreset;
  toolbar?: {
    layout?: ToolbarLayout;
    align?: ToolbarAlign;
    sticky?: boolean;
    className?: string;
  };
  search?: {
    align?: SearchAlign;
    variant?: SearchVariant;
    width?: SearchWidth;
    placeholder?: string;
    expandable?: boolean;
  };
  filters?: {
    placement?: FilterPlacement;
    align?: FilterAlign;
    collapsibleOnMobile?: boolean;
  };
  pagination?: {
    position?: PaginationPosition;
    align?: PaginationAlign;
    variant?: "full" | "compact" | "minimal" | "none";
    sticky?: boolean;
    className?: string;
  };
  selectionDisplay?: "toolbar" | "floating-hud" | "both";
  sidebar?: ReactNode;
}
