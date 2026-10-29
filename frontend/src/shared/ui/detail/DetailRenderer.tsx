import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@core/libs/utils";

import type {
  DetailBadgeIntent,
  DetailFieldConfig,
  DetailKPIConfig,
  DetailSchema,
  DetailTelemetryItem,
} from "./detail.types";

const INTENT_BADGE_CLASSES: Record<DetailBadgeIntent, string> = {
  default: "bg-muted text-muted-foreground border-border/40",
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
};

export interface DetailGridProps<TData = any> {
  schema: DetailSchema<TData>;
  data: TData;
  columns?: 1 | 2 | 3 | 4 | 6;
  variant?: "card" | "subtle" | "borderless";
  className?: string;
}

/**
 * DetailRenderer.Grid
 *
 * Semantic, lightweight key-value matrix derived declaratively from an entity schema.
 * Replaces mode="view" forms with clean, fast, read-only HTML dl/dt/dd elements.
 */
export function DetailGrid<TData = any>({
  schema,
  data,
  columns = 3,
  variant = "card",
  className,
}: DetailGridProps<TData>) {
  if (!data) return null;

  const colGridClasses: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    6: "grid-cols-1 sm:grid-cols-3 lg:grid-cols-6",
  };

  return (
    <dl
      data-testid={`detail-grid-${schema.id}`}
      className={cn(
        "grid gap-3 w-full",
        colGridClasses[columns] || colGridClasses[3],
        className
      )}
    >
      {schema.fields.map((field) => {
        if (field.hidden && field.hidden(data)) return null;

        return (
          <DetailFieldItem
            key={field.id}
            field={field}
            data={data}
            variant={variant}
          />
        );
      })}
    </dl>
  );
}

function DetailFieldItem<TData>({
  field,
  data,
  variant,
}: {
  field: DetailFieldConfig<TData>;
  data: TData;
  variant: "card" | "subtle" | "borderless";
}) {
  let rawValue: any;
  if (typeof field.value === "function") {
    rawValue = field.value(data);
  } else if (typeof field.value === "string") {
    rawValue = (data as any)[field.value];
  } else {
    rawValue = (data as any)[field.id];
  }

  let formattedContent: React.ReactNode = rawValue;

  if (field.render) {
    formattedContent = field.render(rawValue, data);
  } else if (field.format) {
    switch (field.format) {
      case "currency": {
        const num = Number(rawValue);
        formattedContent = isNaN(num)
          ? "—"
          : new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: field.currency || "USD",
            }).format(num);
        break;
      }
      case "number": {
        const num = Number(rawValue);
        formattedContent = isNaN(num) ? "—" : num.toLocaleString();
        break;
      }
      case "percent": {
        const num = Number(rawValue);
        formattedContent = isNaN(num)
          ? "—"
          : `${(num * (num > 1 ? 1 : 100)).toFixed(1)}%`;
        break;
      }
      case "badge": {
        const intent =
          typeof field.badgeIntent === "function"
            ? field.badgeIntent(rawValue, data)
            : field.badgeIntent || "default";
        const label = field.badgeLabel
          ? field.badgeLabel(rawValue, data)
          : String(rawValue ?? "");
        formattedContent = (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border",
              INTENT_BADGE_CLASSES[intent]
            )}
          >
            {label}
          </span>
        );
        break;
      }
      case "mono":
        formattedContent = (
          <span className="font-mono text-xs text-foreground bg-muted/40 px-1.5 py-0.5 rounded">
            {String(rawValue ?? "—")}
          </span>
        );
        break;
      default:
        formattedContent = String(rawValue ?? "—");
    }
  }

  const variantContainerClasses = {
    card: "p-3 rounded-xl bg-surface dark:bg-surface/50 border border-border/40 shadow-2xs",
    subtle: "p-2.5 rounded-lg bg-muted/20 border border-border/20",
    borderless: "p-1.5",
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-1 transition-all",
        variantContainerClasses[variant],
        field.colSpan && `col-span-${field.colSpan}`
      )}
    >
      <dt className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
        {field.icon && <span className="text-primary/80">{field.icon}</span>}
        <span>{field.label}</span>
      </dt>
      <dd className="text-xs font-semibold text-foreground m-0">
        {formattedContent ?? "—"}
      </dd>
    </div>
  );
}

/**
 * DetailRenderer.Telemetry
 *
 * Horizontal strip of metric chips for live operational headers
 */
export function DetailTelemetry({
  items,
  className,
}: {
  items: DetailTelemetryItem[];
  className?: string;
}) {
  return (
    <div
      data-testid="detail-telemetry"
      className={cn("flex items-center gap-2 flex-wrap", className)}
    >
      {items.map((item, idx) => {
        const intent = item.intent || "default";
        return (
          <div
            key={item.id || idx}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold border transition-all",
              INTENT_BADGE_CLASSES[intent]
            )}
          >
            {item.icon && <span>{item.icon}</span>}
            <span className="opacity-70 font-medium">{item.label}:</span>
            <span className="font-extrabold">{item.value}</span>
            {item.badge && (
              <span className="px-1.5 py-0.2 bg-foreground/10 rounded-full text-[10px]">
                {item.badge}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * DetailRenderer.KPI
 *
 * High-impact metric card with trend indicator
 */
export function DetailKPI({
  title,
  value,
  trend,
  trendDirection = "neutral",
  subtitle,
  icon,
  className,
}: DetailKPIConfig & { className?: string }) {
  return (
    <div
      data-testid="detail-kpi-card"
      className={cn(
        "flex flex-col p-4 rounded-2xl bg-card border border-border/40 shadow-xs gap-2",
        className
      )}
    >
      <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
        <span>{title}</span>
        {icon && <div className="text-primary">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-black text-foreground tracking-tight">
          {value}
        </span>
        {trend && (
          <div
            className={cn(
              "inline-flex items-center gap-1 text-xs font-bold",
              trendDirection === "up" && "text-emerald-500",
              trendDirection === "down" && "text-destructive",
              trendDirection === "neutral" && "text-muted-foreground"
            )}
          >
            {trendDirection === "up" && <TrendingUp size={14} />}
            {trendDirection === "down" && <TrendingDown size={14} />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <span className="text-[11px] text-muted-foreground">{subtitle}</span>
      )}
    </div>
  );
}

export const DetailRenderer = {
  Grid: DetailGrid,
  Telemetry: DetailTelemetry,
  KPI: DetailKPI,
};

export default DetailRenderer;
