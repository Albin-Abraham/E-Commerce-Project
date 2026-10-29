import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import { cn } from "@core/libs/utils";
import { useTableContext } from "../../../core/TableEngineContext";
import { useTableFetch } from "../../../core/TableFetchContext";
import { useTableLayout } from "../../../core/TableLayoutContext";
import type { SearchAlign, SearchVariant, SearchWidth } from "../../../types/layout";

export interface ToolbarSearchProps {
  align?: SearchAlign;
  variant?: SearchVariant;
  width?: SearchWidth;
  placeholder?: string;
  className?: string;
}

const WIDTH_MAP: Record<SearchWidth, string> = {
  sm: "max-w-[200px] sm:max-w-[240px]",
  md: "max-w-xs sm:max-w-sm",
  lg: "max-w-md sm:max-w-lg",
  full: "w-full max-w-full",
};

const ALIGN_MAP: Record<SearchAlign, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  full: "w-full",
};

export function ToolbarSearch({
  align: propAlign,
  variant: propVariant,
  width: propWidth,
  placeholder: propPlaceholder,
  className,
}: ToolbarSearchProps) {
  const { engine } = useTableContext<unknown>();
  const { search, gate } = useTableFetch();
  const { t } = useTranslation("common/base");
  const layout = useTableLayout();

  const align = propAlign ?? layout.search?.align ?? "start";
  const variant = propVariant ?? layout.search?.variant ?? "standard";
  const width = propWidth ?? layout.search?.width ?? "md";
  const placeholder =
    propPlaceholder ??
    layout.search?.placeholder ??
    t("toolbar.searchPlaceholder", "Filter records... (⌘K)");

  const engineSearch = String(engine.getState().globalFilter ?? "");
  const [localValue, setLocalValue] = useState(engineSearch);
  const [isExpanded, setIsExpanded] = useState(variant !== "expandable" || Boolean(engineSearch));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(engineSearch);
    if (engineSearch) setIsExpanded(true);
  }, [engineSearch]);

  // Global ⌘K shortcut listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const commitSearch = (value: string) => {
    engine.setGlobalFilter(value);
    if (gate === "manual") search();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitSearch(localValue);
    }
    if (e.key === "Escape") {
      if (variant === "expandable" && !localValue) {
        setIsExpanded(false);
      }
      inputRef.current?.blur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocalValue(next);
    if (gate !== "manual") {
      commitSearch(next);
    }
  };

  const handleClear = () => {
    setLocalValue("");
    commitSearch("");
    if (variant === "expandable") {
      setIsExpanded(false);
    }
  };

  if (variant === "expandable" && !isExpanded) {
    return (
      <div className={cn("flex items-center", ALIGN_MAP[align], className)}>
        <button
          type="button"
          onClick={() => {
            setIsExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-raised/60 hover:bg-surface border border-border/40 text-xs text-muted-foreground hover:text-foreground transition-all duration-200 shadow-xs"
          title="Search (⌘K)"
        >
          <Search size={14} />
          <span>Search</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-background/80 rounded border border-border/60">
            ⌘K
          </kbd>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 flex-1 relative",
        WIDTH_MAP[width],
        ALIGN_MAP[align],
        className
      )}
    >
      <div className="relative w-full flex items-center">
        <Search
          size={14}
          className="absolute left-3 text-muted-foreground pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full h-8 pl-8 pr-8 rounded-xl text-xs bg-surface border border-border/40",
            "text-foreground placeholder:text-muted-foreground/70",
            "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50",
            "transition-all duration-200 shadow-xs"
          )}
        />
        {localValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <X size={12} />
          </button>
        ) : (
          <kbd className="hidden sm:inline-block absolute right-2.5 px-1 py-0.5 text-[9px] font-mono text-muted-foreground/60 bg-background/60 rounded border border-border/40">
            ⌘K
          </kbd>
        )}
      </div>
    </div>
  );
}
