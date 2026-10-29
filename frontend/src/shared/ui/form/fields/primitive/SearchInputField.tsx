import React from "react";

import { cn } from "@ui/form/utils/form-styles";
import { CornerDownLeft, Search, X } from "lucide-react";

import { Zenith } from "@shared/theme";

import { TextField } from "./TextField";
import type { AtomicFieldProps } from "./types";

/**
 * SearchInputField
 *
 * A specialized Atomic Adapter for search inputs.
 * Features:
 * - Built-in Search Icon
 * - Integrated Clear button
 * - Submit (Enter) indicator
 * - Consistent Zenith search aesthetics
 */
export const SearchInputField = React.forwardRef<
  HTMLInputElement,
  AtomicFieldProps<string | number> &
    React.InputHTMLAttributes<HTMLInputElement>
>(function (props, ref) {
  const { value, onChange, className, onClear } = props;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    onClear?.();
    // Focus back to input if ref is available
    if (ref && "current" in ref) {
      ref.current?.focus();
    }
  };

  const hasValue = !!value;

  return (
    <div
      className={cn(
        "relative flex items-center w-full px-3 py-1.5 rounded-xl border border-border/70 bg-muted/40 hover:border-border hover:bg-muted/60 focus-within:border-primary focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20 transition-all group/search",
        className
      )}
    >
      <div className="flex items-center pointer-events-none text-muted-foreground group-focus-within/search:text-primary transition-colors shrink-0 mr-2">
        <Search className="w-4 h-4" />
      </div>

      <TextField
        {...(props as any)}
        ref={ref as any}
        className="w-full !p-0 !bg-transparent !border-none !shadow-none !outline-none text-sm text-foreground placeholder:text-muted-foreground/70"
      />

      <div className="flex items-center gap-2 shrink-0 ml-2">
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
            title="Clear search"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {hasValue && (
          <kbd
            className={cn(
              Zenith.patterns.data.snippet,
              "!border-none !shadow-none !bg-primary/20 text-primary !text-[10px] flex items-center gap-1 animate-in fade-in slide-in-from-right-2"
            )}
          >
            <CornerDownLeft className="w-3 h-3" />
          </kbd>
        )}
      </div>
    </div>
  );
});

SearchInputField.displayName = "SearchInputField";
