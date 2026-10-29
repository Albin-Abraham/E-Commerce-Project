import type { ReactNode } from "react";

export type DetailFormat =
  | "text"
  | "currency"
  | "number"
  | "percent"
  | "date"
  | "datetime"
  | "badge"
  | "mono"
  | "custom";

export type DetailBadgeIntent =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface DetailFieldConfig<TData = any> {
  id: string;
  label: string;
  /** Value resolver or accessor key from data */
  value?: keyof TData | ((data: TData) => ReactNode);
  /** Leading icon */
  icon?: ReactNode;
  /** Formatting archetype */
  format?: DetailFormat;
  /** Currency code if format === 'currency' (defaults to USD) */
  currency?: string;
  /** Badge intent resolver if format === 'badge' */
  badgeIntent?: DetailBadgeIntent | ((value: any, data: TData) => DetailBadgeIntent);
  /** Badge label resolver */
  badgeLabel?: (value: any, data: TData) => string;
  /** Column span in grid layout (1, 2, 3, etc.) */
  colSpan?: number;
  /** Conditionally hide field */
  hidden?: (data: TData) => boolean;
  /** Custom renderer */
  render?: (value: any, data: TData) => ReactNode;
}

export interface DetailSchema<TData = any> {
  id: string;
  title?: string;
  subtitle?: string;
  fields: DetailFieldConfig<TData>[];
}

export interface DetailTelemetryItem {
  id?: string;
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  intent?: DetailBadgeIntent;
  badge?: string | number;
}

export interface DetailKPIConfig {
  id?: string;
  title: string;
  value: ReactNode;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  subtitle?: string;
  icon?: ReactNode;
}
