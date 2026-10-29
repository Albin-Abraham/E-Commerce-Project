import React, { forwardRef } from "react";

import { cn } from "@core/libs/utils";

import { patterns } from "@shared/theme";

/**
 * Zenith Base Table UI
 * Orchestrates high-density data rendering using Zenith design tokens.
 * Supports container queries (@container/zenith-table), card variants, and alignment.
 */

// ── Alignment Map ─────────────────────────────────────────────────────

const ALIGN_MAP = {
  left: "text-left justify-start",
  center: "text-center justify-center",
  right: "text-right justify-end",
};

// ── Polymorphic helper type ──────────────────────────────────────────

type AsProp<T extends React.ElementType> = {
  as?: T;
};

type PolymorphicProps<T extends React.ElementType, P> = P &
  AsProp<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof P>;

// ── Table ─────────────────────────────────────────────────────────────

interface TableOwnProps {
  children: React.ReactNode;
  containerClassName?: string;
  scrollerRef?: React.RefObject<HTMLDivElement | null>;
  /** When true, enables vertical overflow for virtualized scrolling */
  virtualized?: boolean;
  /** Striped rows — alternating background colors */
  striped?: boolean;
  /** Striped columns — alternating column background colors */
  columnStriped?: boolean;
  /** Bordered — show cell borders */
  bordered?: boolean;
  /** Table row variant: default | cards / separated */
  variant?: "default" | "striped" | "bordered" | "separated" | "cards";
  /** Shadow — table container elevation */
  shadow?: boolean | "sm" | "md" | "lg";
}

type TableProps<T extends React.ElementType = "table"> = PolymorphicProps<
  T,
  TableOwnProps
>;

function getShadowClass(shadow: TableOwnProps["shadow"]): string {
  if (!shadow) return "";
  if (shadow === "sm") return "shadow-sm";
  if (shadow === "md") return "shadow-md";
  if (shadow === "lg") return "shadow-lg";
  return "shadow-premium";
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  (
    {
      as,
      children,
      className,
      containerClassName,
      scrollerRef,
      virtualized,
      striped,
      columnStriped,
      bordered,
      variant = "default",
      shadow,
      ...props
    },
    ref
  ) => {
    const Component = as || "table";
    const isSeparated = variant === "separated" || variant === "cards";

    return (
      <div
        className={cn(
          "@container/zenith-table relative flex flex-col flex-1 min-h-0 w-full overflow-hidden bg-card",
          isSeparated && patterns.table.container,
          getShadowClass(shadow),
          containerClassName
        )}
      >
        <div
          ref={scrollerRef}
          className={cn(
            "flex-1 min-h-0 overflow-auto relative bg-card",
            "scrollbar-thin scrollbar-thumb-border/60 hover:scrollbar-thumb-primary/40 scrollbar-track-transparent"
          )}
        >
          <Component
            ref={ref}
            role={props.role ?? "grid"}
            className={cn(
              "w-full text-left",
              isSeparated ? "border-separate border-spacing-y-2 px-2" : "border-collapse",
              striped && "striped",
              columnStriped && "column-striped [&_td:nth-child(even)]:bg-muted/15 dark:[&_td:nth-child(even)]:bg-surface-raised/20 [&_th:nth-child(even)]:bg-muted/15 dark:[&_th:nth-child(even)]:bg-surface-raised/20",
              bordered && "bordered",
              className
            )}
            {...props}
          >
            {children}
          </Component>
        </div>
      </div>
    );
  }
);
Table.displayName = "Table";

// ── THead ─────────────────────────────────────────────────────────────

type THeadProps<T extends React.ElementType = "thead"> = PolymorphicProps<
  T,
  {
    children: React.ReactNode;
    /** Keep header fixed at top during vertical scroll */
    sticky?: boolean;
  }
>;

export const THead = forwardRef<HTMLTableSectionElement, THeadProps>(
  ({ as, children, className, sticky, ...props }, ref) => {
    const Component = as || "thead";
    return (
      <Component
        ref={ref}
        className={cn(
          patterns.table.header,
          sticky && "sticky top-0 z-20 bg-background/95 backdrop-blur-sm",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
THead.displayName = "THead";

// ── TBody ─────────────────────────────────────────────────────────────

type TBodyProps<T extends React.ElementType = "tbody"> = PolymorphicProps<
  T,
  {
    children: React.ReactNode;
  }
>;

export const TBody = forwardRef<HTMLTableSectionElement, TBodyProps>(
  ({ as, children, className, ...props }, ref) => {
    const Component = as || "tbody";
    return (
      <Component
        ref={ref}
        className={cn("divide-y divide-border/30", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
TBody.displayName = "TBody";

export interface ResizeHandleProps {
  onResize?: (delta: number) => void;
  className?: string;
}

export function ResizeHandle({ onResize, className }: ResizeHandleProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const onMouseMove = (moveEvent: MouseEvent) => {
      onResize?.(moveEvent.clientX - startX);
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors select-none",
        className
      )}
    />
  );
}

// ── TH ────────────────────────────────────────────────────────────────

type THProps<T extends React.ElementType = "th"> = PolymorphicProps<
  T,
  {
    children: React.ReactNode;
    align?: "left" | "center" | "right";
    pinned?: "left" | "right";
  }
>;

const THBase = forwardRef<HTMLTableCellElement, THProps>(
  (
    {
      as,
      children,
      className,
      align = "left",
      pinned,
      scope = "col",
      role = "columnheader",
      ...props
    },
    ref
  ) => {
    const Component = as || "th";
    return (
      <Component
        ref={ref}
        role={role}
        scope={Component === "th" ? scope : undefined}
        className={cn(
          patterns.table.headerCell,
          "cq-sm:text-[10px] cq-sm:px-2 relative",
          ALIGN_MAP[align],
          pinned && "sticky z-20 bg-[var(--z-card-bg,var(--card))] backdrop-blur-sm",
          pinned === "left" && "left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
          pinned === "right" && "right-0 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]",
          className
        )}
        style={{
          paddingTop: "var(--table-row-py, var(--space-4))",
          paddingBottom: "var(--table-row-py, var(--space-4))",
          paddingLeft: "var(--table-row-px, var(--space-6))",
          paddingRight: "var(--table-row-px, var(--space-6))",
        }}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
THBase.displayName = "TH";

export const TH = Object.assign(THBase, {
  ResizeHandle,
});


// ── TD ────────────────────────────────────────────────────────────────

type TDProps<T extends React.ElementType = "td"> = PolymorphicProps<
  T,
  {
    children: React.ReactNode;
    align?: "left" | "center" | "right";
    pinned?: "left" | "right";
  }
>;

export const TD = forwardRef<HTMLTableCellElement, TDProps>(
  ({ as, children, className, align = "left", pinned, ...props }, ref) => {
    const Component = as || "td";
    return (
      <Component
        ref={ref}
        role="gridcell"
        className={cn(
          patterns.table.cell,
          "cq-sm:px-2 cq-sm:text-xs",
          ALIGN_MAP[align],
          pinned && "sticky z-10 bg-[var(--z-card-bg,var(--card))]",
          pinned === "left" && "left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]",
          pinned === "right" && "right-0 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]",
          className
        )}
        style={{
          paddingTop: "var(--table-row-py, var(--space-4))",
          paddingBottom: "var(--table-row-py, var(--space-4))",
          paddingLeft: "var(--table-row-px, var(--space-6))",
          paddingRight: "var(--table-row-px, var(--space-6))",
        }}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
TD.displayName = "TD";

// ── TR ────────────────────────────────────────────────────────────────

type TRProps<T extends React.ElementType = "tr"> = PolymorphicProps<
  T,
  {
    children: React.ReactNode;
  }
>;

export const TR = forwardRef<HTMLTableRowElement, TRProps>(
  ({ as, children, className, ...props }, ref) => {
    const Component = as || "tr";
    return (
      <Component
        ref={ref}
        role="row"
        className={cn(patterns.table.row, className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
TR.displayName = "TR";
