import React from "react";
import type { TableColumnMeta } from "../types";
import { formatDate } from "@shared/utils";

export interface BadgeStatusConfig {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning" | "info"
    | string;
  label?: string;
  className?: string;
}

export type StatusResolverFn = (
  value: unknown,
  row: Record<string, any>
) => BadgeStatusConfig | string;

export type ICellRendererStrategy = (
  value: unknown,
  meta: TableColumnMeta,
  row?: any
) => React.ReactNode;

export function resolveBadgeStatus(
  value: unknown,
  meta: TableColumnMeta,
  row: Record<string, any> = {}
): BadgeStatusConfig {
  const customResolver = meta.formatOptions?.statusResolver as
    | StatusResolverFn
    | undefined;
  if (typeof customResolver === "function") {
    const res = customResolver(value, row);
    if (typeof res === "string") {
      return { label: res, variant: "default" };
    }
    return res;
  }

  const strVal = String(value ?? "");
  const lowerVal = strVal.toLowerCase();

  if (
    ["active", "success", "completed", "enabled", "approved"].includes(lowerVal)
  ) {
    return {
      label: strVal,
      variant: "success",
      className:
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    };
  }
  if (
    ["inactive", "pending", "warning", "queued", "processing"].includes(lowerVal)
  ) {
    return {
      label: strVal,
      variant: "warning",
      className:
        "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
    };
  }
  if (
    ["destructive", "failed", "error", "disabled", "rejected"].includes(
      lowerVal
    )
  ) {
    return {
      label: strVal,
      variant: "destructive",
      className:
        "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20",
    };
  }

  return {
    label: strVal,
    variant: "default",
    className: "bg-primary/10 text-primary border-primary/20",
  };
}

export const defaultCellRenderers: Record<string, ICellRendererStrategy> = {
  badge: (value, meta, row) => {
    const status = resolveBadgeStatus(value, meta, row || {});
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${
          status.className || "bg-primary/10 text-primary border-primary/20"
        }`}
      >
        {status.label || String(value ?? "")}
      </span>
    );
  },
  currency: (value, meta) => {
    const currencyCode = (meta.formatOptions?.currency as string) ?? "USD";
    const locale = (meta.formatOptions?.locale as string) ?? undefined;
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
    });
    return (
      <span className="font-mono text-right block w-full">
        {value != null && !isNaN(Number(value))
          ? formatter.format(Number(value))
          : "-"}
      </span>
    );
  },
  avatar: (value) => (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
        {String(value ?? "")
          .charAt(0)
          .toUpperCase()}
      </div>
      <span>{String(value ?? "")}</span>
    </div>
  ),
  date: (value) => {
    const formatted = formatDate(value, "DD-MM-YYYY HH:mm:ss");
    return (
      <span
        className="truncate block w-full whitespace-nowrap text-[11px] font-mono text-muted-foreground"
        title={formatted}
      >
        {formatted}
      </span>
    );
  },
  text: (value) => (
    <span className="truncate block w-full" title={String(value ?? "")}>
      {value !== null && value !== undefined ? String(value) : ""}
    </span>
  ),
};
