import type { ReactNode } from "react";

/**
 * Item in a sibling quick-switch dropdown menu
 */
export interface BreadcrumbDropdownItem {
  id?: string;
  label: string;
  href?: string;
  description?: string;
  icon?: ReactNode;
  badge?: string | number;
  active?: boolean;
  onClick?: () => void;
}

/**
 * High-fidelity breadcrumb navigation item
 */
export interface BreadcrumbItem {
  id?: string;
  label: ReactNode;
  path?: string;
  icon?: ReactNode;
  active?: boolean;
  badge?: string | number;
  intent?: "create" | "edit" | "view" | "list" | "manage" | "dashboard";
  /** Sibling routes for instant cross-navigation */
  items?: BreadcrumbDropdownItem[];
  /** Custom click handler (e.g. opens modal or triggers command) */
  onClick?: () => void;
  /** Arbitrary domain metadata */
  metadata?: Record<string, unknown>;
}

export type BreadcrumbsProp =
  | BreadcrumbItem[]
  | ((autoResolvedCrumbs: BreadcrumbItem[]) => BreadcrumbItem[]);

export type BreadcrumbState =
  | { status: "loading"; crumbs: BreadcrumbItem[] }
  | { status: "ready"; crumbs: BreadcrumbItem[] };
