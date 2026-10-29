import React from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  Circle,
  LayoutGrid,
  ListChecks,
  Table as TableIcon,
  X,
} from "lucide-react";
import { cn } from "@core/libs/utils";
import { useTableContext } from "../../../core/TableEngineContext";
import { useTablePhysics } from "../../../core/TablePhysicsContext";
import { useTableChrome } from "../../../mdap/TableChromeContext";
import { ActiveFilterPills } from "../ActiveFilterPills";
import { FilterStatusBadge } from "../FilterStatusBadge";
import { ToolbarChromeSlots } from "../ToolbarChromeSlots";
import { ToolbarColumnVisibilityDropdown } from "../ToolbarColumnVisibilityDropdown";
import { ToolbarFilterPopover } from "../ToolbarFilterPopover";
import { ToolbarSortPopover } from "../ToolbarSortPopover";

export interface ToolbarSectionProps {
  children?: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end" | "between";
}

export function ToolbarStart({ children, className, align = "start" }: ToolbarSectionProps) {
  const alignClass =
    align === "center"
      ? "justify-center"
      : align === "end"
        ? "justify-end"
        : align === "between"
          ? "justify-between"
          : "justify-start";

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", alignClass, className)}>
      {children}
    </div>
  );
}

export function ToolbarCenter({ children, className }: ToolbarSectionProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2 flex-1 flex-wrap", className)}>
      {children}
    </div>
  );
}

export function ToolbarEnd({ children, className, align = "end" }: ToolbarSectionProps) {
  const alignClass =
    align === "center"
      ? "justify-center"
      : align === "start"
        ? "justify-start"
        : align === "between"
          ? "justify-between"
          : "justify-end";

  return (
    <div className={cn("flex items-center gap-2 flex-wrap ml-auto", alignClass, className)}>
      {children}
    </div>
  );
}

export function ToolbarSlot({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center gap-2", className)}>{children}</div>;
}

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  icon?: React.ElementType;
  label: string;
}

function ToggleButton({ active, onClick, icon: Icon, label }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
        active
          ? "bg-surface shadow-xs text-primary font-extrabold"
          : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
      }`}
    >
      {Icon && <Icon size={12} />}
      {label}
    </button>
  );
}

export function ToolbarDensity({ className }: { className?: string }) {
  const { t } = useTranslation("common/base");
  const density = useTablePhysics((s) => s.density);
  const setDensity = useTablePhysics((s) => s.setDensity);

  return (
    <div className={cn("flex items-center gap-1 bg-surface-raised/60 p-1 rounded-xl border border-border/40 shadow-xs", className)}>
      <ToggleButton
        active={density === "comfortable"}
        onClick={() => setDensity("comfortable")}
        icon={LayoutGrid}
        label={t("toolbar.comfortable", "Comfortable")}
      />
      <ToggleButton
        active={density === "compact"}
        onClick={() => setDensity("compact")}
        icon={TableIcon}
        label={t("toolbar.compact", "Compact")}
      />
    </div>
  );
}

export function ToolbarSelectionType({ className }: { className?: string }) {
  const { t } = useTranslation("common/base");
  const selectionType = useTablePhysics((s) => s.selectionType);
  const setSelectionType = useTablePhysics((s) => s.setSelectionType);

  return (
    <div className={cn("flex items-center gap-1 bg-surface-raised/60 p-1 rounded-xl border border-border/40 shadow-xs", className)}>
      <ToggleButton
        active={selectionType === "multiple"}
        onClick={() => setSelectionType("multiple")}
        icon={ListChecks}
        label={t("toolbar.multi", "Multi")}
      />
      <ToggleButton
        active={selectionType === "single"}
        onClick={() => setSelectionType("single")}
        icon={Circle}
        label={t("toolbar.single", "Single")}
      />
    </div>
  );
}

export function ToolbarFilters({ showBadge }: { showBadge?: boolean }) {
  const chrome = useTableChrome();
  const displayBadge = showBadge ?? chrome.filterStatusBadge;
  return (
    <div className="flex items-center gap-2">
      <ToolbarFilterPopover />
      {displayBadge ? <FilterStatusBadge /> : null}
    </div>
  );
}

export function ToolbarSort() {
  return <ToolbarSortPopover />;
}

export function ToolbarColumns() {
  return <ToolbarColumnVisibilityDropdown />;
}

export function ToolbarActions() {
  return <ToolbarChromeSlots />;
}

export function ToolbarFilterPills() {
  return <ActiveFilterPills />;
}

export function ToolbarSelectionBanner({ className }: { className?: string }) {
  const { engine } = useTableContext<unknown>();
  const { t } = useTranslation("common/base");
  const selectedRows = useTablePhysics((s) => s.selectedRows);
  const excludedRows = useTablePhysics((s) => s.excludedRows);
  const selectionMode = useTablePhysics((s) => s.selectionMode);
  const totalDataCount = useTablePhysics((s) => s.totalDataCount);
  const resetSelection = useTablePhysics((s) => s.resetSelection);
  const setBulkSelection = useTablePhysics((s) => s.setBulkSelection);
  const setSelectionMode = useTablePhysics((s) => s.setSelectionMode);

  const hasSelection = selectedRows.size > 0 || selectionMode !== "MANUAL";
  if (!hasSelection) return null;

  const selectedCount =
    selectionMode === "ALL"
      ? Math.max(0, totalDataCount - excludedRows.size)
      : selectedRows.size;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-3.5 py-1.5 bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200 w-full flex-wrap",
        className
      )}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
          <CheckCircle2 size={16} />
          <span>
            {t("toolbar.selectedCount", "{{count}} Selected", {
              count: selectedCount,
            })}
          </span>
        </div>

        {/* Scope Switcher: This Page | Whole Data */}
        <div className="flex items-center gap-1 bg-background/80 dark:bg-background/40 p-0.5 rounded-lg border border-border/40 text-[10px]">
          <button
            type="button"
            onClick={() => {
              if (engine && typeof engine.getRowModel === "function") {
                const rows = engine.getRowModel().rows;
                if (rows) setBulkSelection(rows.map((r: any) => r.id));
              }
            }}
            className={cn(
              "px-2.5 py-1 rounded-md font-bold uppercase transition-all",
              selectionMode === "PAGE"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {t("toolbar.thisPage", "This Page")}
          </button>
          <button
            type="button"
            onClick={() => setSelectionMode("ALL")}
            className={cn(
              "px-2.5 py-1 rounded-md font-bold uppercase transition-all",
              selectionMode === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {t("toolbar.wholeData", "Whole Data")}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={resetSelection}
        className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-destructive transition-colors ml-auto"
      >
        <X size={14} />
        <span>{t("toolbar.clearSelection", "Clear")}</span>
      </button>
    </div>
  );
}
