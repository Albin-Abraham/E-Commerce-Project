import React from "react";

import { useTableContext } from "@ui/table/core/TableEngineContext";
import { useTablePhysics } from "@ui/table/core/TablePhysicsContext";
import type { TableActionContext } from "@ui/table/types";
import { SelectionBarModes } from "./SelectionCore";

export { SelectionBarModes };

interface SelectionBarActionProps {
  label: string;
  icon?: React.ElementType;
  onClick?: (context: TableActionContext) => void;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  className?: string;
  disabled?: boolean;
}

export function SelectionBarAction({
  label,
  icon: Icon,
  onClick,
  variant = "primary",
  loading,
  className,
  disabled,
}: SelectionBarActionProps) {
  const selectedRows = useTablePhysics((s) => s.selectedRows);
  const excludedRows = useTablePhysics((s) => s.excludedRows);
  const selectionMode = useTablePhysics((s) => s.selectionMode);
  const totalDataCount = useTablePhysics((s) => s.totalDataCount);

  let engineState: any = null;
  try {
    const tableContext = useTableContext();
    if (tableContext?.engine && typeof tableContext.engine.getState === "function") {
      engineState = tableContext.engine.getState();
    }
  } catch {
    // Safely handled if outside TableEngineContext
  }

  const variants = {
    primary: "bg-primary text-white hover:shadow-lg hover:shadow-primary/20",
    secondary:
      "bg-surface-raised border border-border/40 text-foreground hover:bg-surface shadow-sm",
    danger: "bg-danger text-white hover:shadow-lg hover:shadow-danger/20",
  };

  const handleAction = () => {
    if (onClick) {
      onClick({
        mode: selectionMode,
        selectedIds: Array.from(selectedRows),
        excludedIds: Array.from(excludedRows),
        totalCount: totalDataCount,
        search: String(engineState?.globalFilter ?? ""),
        sort: (engineState?.sorting ?? []) as { id: string; desc: boolean }[],
        filters: (engineState?.columnFilters ?? []) as { id: string; value: unknown }[],
      });
    }
  };

  return (
    <button
      onClick={handleAction}
      disabled={loading || disabled}
      className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-[var(--motion-medium)] disabled:opacity-50 ${variants[variant]} ${className ?? ""}`}
    >
      {loading ? (
        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        Icon && <Icon size={14} />
      )}
      {label}
    </button>
  );
}

export function SelectionBarActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex items-center gap-2">{children}</div>;
}

