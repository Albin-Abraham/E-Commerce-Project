import React from "react";

import { cn } from "@core/libs/utils";
import { useTableLayout } from "@ui/table/core/TableLayoutContext";
import { useTablePhysics } from "@ui/table/core/TablePhysicsContext";
import { createTableCompound } from "@ui/table/core/createTableCompound";
import type { ToolbarAlign, ToolbarLayout } from "@ui/table/types/layout";

import {
  ToolbarActions,
  ToolbarCenter,
  ToolbarColumns,
  ToolbarDensity,
  ToolbarEnd,
  ToolbarFilterPills,
  ToolbarFilters,
  type ToolbarSectionProps,
  ToolbarSelectionBanner,
  ToolbarSelectionType,
  ToolbarSlot,
  ToolbarSort,
  ToolbarStart,
} from "./toolbar/ToolbarPrimitives";
import {
  ToolbarSearch,
  type ToolbarSearchProps,
} from "./toolbar/ToolbarSearch";

export interface ZenithTableToolbarProps {
  children?: React.ReactNode;
  className?: string;
  layout?: ToolbarLayout;
  align?: ToolbarAlign;
}

const ALIGN_CLASS: Record<ToolbarAlign, string> = {
  between: "justify-between",
  start: "justify-start",
  end: "justify-end",
  center: "justify-center",
};

function ZenithTableToolbarRoot({
  children,
  className,
  layout: propLayout,
  align: propAlign,
}: ZenithTableToolbarProps) {
  const globalLayout = useTableLayout();
  const layout = propLayout ?? globalLayout.toolbar?.layout ?? "inline";
  const align = propAlign ?? globalLayout.toolbar?.align ?? "between";

  const selectedRows = useTablePhysics((s) => s.selectedRows);
  const selectionMode = useTablePhysics((s) => s.selectionMode);
  const hasSelection = selectedRows.size > 0 || selectionMode !== "MANUAL";
  const selectionDisplay = globalLayout.selectionDisplay ?? "toolbar";

  // If custom children are provided, render user-defined layout
  if (children) {
    return (
      <div
        data-testid="table-toolbar"
        className={cn(
          "sticky top-0 z-30 shrink-0 w-full",
          "bg-card/90 backdrop-blur-md",
          "border-b border-border/40",
          "flex flex-col gap-2.5 px-4 py-3 transition-all duration-200",
          hasSelection && "bg-primary/[0.04] dark:bg-primary/[0.08]",
          className
        )}
      >
        {children}
      </div>
    );
  }

  // Preset Layout: Stacked (Search & Filter top row, controls bottom row)
  if (layout === "stacked") {
    return (
      <div
        data-testid="table-toolbar"
        className={cn(
          "sticky top-0 z-30 shrink-0 w-full bg-card/90 backdrop-blur-md border-b border-border/40 flex flex-col gap-2.5 px-4 py-3 transition-all duration-200",
          hasSelection && "bg-primary/[0.04] dark:bg-primary/[0.08]",
          className
        )}
      >
        <div
          className={cn(
            "flex items-center gap-4 w-full flex-wrap",
            ALIGN_CLASS[align]
          )}
        >
          <ToolbarStart>
            <ToolbarSearch width="lg" />
            <ToolbarFilters />
          </ToolbarStart>
          <ToolbarEnd>
            <ToolbarActions />
          </ToolbarEnd>
        </div>
        <div className="flex items-center justify-between gap-2 w-full pt-1 border-t border-border/30 flex-wrap">
          <ToolbarFilterPills />
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <ToolbarSort />
            <ToolbarColumns />
            <ToolbarSelectionType />
            <ToolbarDensity />
          </div>
        </div>
        {selectionDisplay !== "floating-hud" && <ToolbarSelectionBanner />}
      </div>
    );
  }

  // Preset Layout: Split (Search left, Filter Pills center, Controls right)
  if (layout === "split") {
    return (
      <div
        data-testid="table-toolbar"
        className={cn(
          "sticky top-0 z-30 shrink-0 w-full bg-card/90 backdrop-blur-md border-b border-border/40 flex flex-col gap-2.5 px-4 py-3 transition-all duration-200",
          hasSelection && "bg-primary/[0.04] dark:bg-primary/[0.08]",
          className
        )}
      >
        <div
          className={cn(
            "flex items-center gap-4 w-full flex-wrap",
            ALIGN_CLASS[align]
          )}
        >
          <ToolbarStart>
            <ToolbarSearch width="sm" />
            <ToolbarFilters />
          </ToolbarStart>
          <ToolbarCenter>
            <ToolbarFilterPills />
          </ToolbarCenter>
          <ToolbarEnd>
            <ToolbarSort />
            <ToolbarColumns />
            <ToolbarActions />
            <ToolbarDensity />
          </ToolbarEnd>
        </div>
        {selectionDisplay !== "floating-hud" && <ToolbarSelectionBanner />}
      </div>
    );
  }

  // Preset Layout: Compact (Dense layout with expandable search)
  if (layout === "compact") {
    return (
      <div
        data-testid="table-toolbar"
        className={cn(
          "sticky top-0 z-30 shrink-0 w-full bg-card/90 backdrop-blur-md border-b border-border/40 flex items-center gap-2 px-3 py-2 transition-all duration-200 flex-wrap",
          ALIGN_CLASS[align],
          hasSelection && "bg-primary/[0.04] dark:bg-primary/[0.08]",
          className
        )}
      >
        <ToolbarStart>
          <ToolbarSearch variant="expandable" width="sm" />
          <ToolbarFilters />
        </ToolbarStart>
        <ToolbarEnd>
          <ToolbarSort />
          <ToolbarColumns />
          <ToolbarActions />
          <ToolbarDensity />
        </ToolbarEnd>
        {selectionDisplay !== "floating-hud" && <ToolbarSelectionBanner />}
      </div>
    );
  }

  // Default Option B Inline Layout
  return (
    <div
      data-testid="table-toolbar"
      className={cn(
        "sticky top-0 z-30 shrink-0 w-full",
        "bg-card/90 backdrop-blur-md",
        "border-b border-border/40",
        "flex flex-col gap-2.5 px-4 py-3 transition-all duration-200",
        hasSelection && "bg-primary/[0.04] dark:bg-primary/[0.08]",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-4 w-full flex-wrap",
          ALIGN_CLASS[align]
        )}
      >
        <ToolbarStart>
          <ToolbarSearch width="md" />
        </ToolbarStart>

        <ToolbarEnd>
          <ToolbarFilters />
          <ToolbarSort />
          <ToolbarColumns />
          <ToolbarActions />
          <ToolbarSelectionType />
          <ToolbarDensity />
        </ToolbarEnd>
      </div>

      {/* Selection Banner */}
      {selectionDisplay !== "floating-hud" && <ToolbarSelectionBanner />}
    </div>
  );
}

ZenithTableToolbarRoot.displayName = "ZenithTableToolbarRoot";

export const ZenithTableToolbar = createTableCompound(ZenithTableToolbarRoot, {
  Start: ToolbarStart,
  Center: ToolbarCenter,
  End: ToolbarEnd,
  Slot: ToolbarSlot,
  Search: ToolbarSearch,
  Filters: ToolbarFilters,
  Sort: ToolbarSort,
  Columns: ToolbarColumns,
  Actions: ToolbarActions,
  Density: ToolbarDensity,
  SelectionType: ToolbarSelectionType,
  SelectionBanner: ToolbarSelectionBanner,
  FilterPills: ToolbarFilterPills,
});

export type { ToolbarSearchProps, ToolbarSectionProps };
