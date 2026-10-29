import React from "react";

import { cn } from "@core/libs/utils";
import type { RowContext } from "../../types";

export interface RowActionItem<T = any> {
  id: string;
  label: string;
  icon?: React.ElementType;
  variant?: "default" | "destructive" | "outline" | "secondary";
  disabled?: boolean;
  onClick: (context: RowContext<T>) => void;
}

export interface RowActionPanelProps<T = any> {
  context: RowContext<T>;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: RowActionItem<T>[];
  children?: React.ReactNode;
  className?: string;
}

/**
 * RowActionPanel (Standard Compound Preset)
 *
 * Enterprise contextual action bar rendered inside an ExpandedActionRow.
 * Receives the row context and provides standard action buttons plus custom content slots.
 */
export function RowActionPanel<T = any>({
  context,
  title,
  subtitle,
  actions = [],
  children,
  className,
}: RowActionPanelProps<T>) {
  return (
    <div className={cn("flex flex-col gap-4 text-foreground", className)}>
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-border/30">
        <div>
          <div className="text-sm font-bold text-foreground">
            {title ?? `Actions for Row #${context.index + 1}`}
          </div>
          {subtitle && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {subtitle}
            </div>
          )}
        </div>

        {actions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {actions.map((act) => {
              const Icon = act.icon;
              const isDestructive = act.variant === "destructive";
              const isOutline = act.variant === "outline";

              return (
                <button
                  key={act.id}
                  disabled={act.disabled || context.locked}
                  onClick={() => act.onClick(context)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 shadow-xs",
                    isDestructive
                      ? "bg-destructive text-white hover:bg-destructive/90"
                      : isOutline
                        ? "bg-surface border border-border/50 hover:border-foreground/30 text-foreground"
                        : "bg-primary text-white hover:bg-primary/90",
                    (act.disabled || context.locked) &&
                      "opacity-40 cursor-not-allowed pointer-events-none"
                  )}
                >
                  {Icon && <Icon size={13} />}
                  <span>{act.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {children && <div className="pt-1">{children}</div>}
    </div>
  );
}
