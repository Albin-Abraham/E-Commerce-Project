import React from "react";

import { cn } from "@ui/form/utils/form-styles";
import { Search, X } from "lucide-react";

import type { AtomicFieldProps } from "./types";

/**
 * TableFilterField
 *
 * A high-performance Atomic Adapter specialized for data grid filtering.
 * Features:
 * - Compact footprint (h-8.5) for toolbar integration
 * - Integrated Clear button (visible when populated)
 * - Minimalist search icon & theme-aware borders
 */
export const TableFilterField = React.forwardRef<
  HTMLInputElement,
  AtomicFieldProps<string | number> &
    React.InputHTMLAttributes<HTMLInputElement>
>(function TableFilterField(
  {
    name,
    type,
    component,
    id,
    label: _label,
    disabled,
    readOnly,
    required,
    field,
    value,
    onChange,
    className,
    onClear,
    placeholder = "Filter records... (⌘K)",
    layout: _layout,
    styles: _styles,
    error: _error,
    errorMessage: _errorMessage,
    componentProps: _componentProps,
    ...rest
  },
  ref
) {
  const resolvedName = name ?? field?.name;
  const resolvedType = type ?? field?.type ?? "table-filter";
  const resolvedId = id ?? field?.id ?? resolvedName;
  const resolvedComponent =
    typeof component === "string"
      ? component
      : typeof field?.component === "string"
        ? field.component
        : "table-filter";

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
    onClear?.();
    if (ref && "current" in ref) {
      ref.current?.focus();
    }
  };

  const hasValue = Boolean(value);

  return (
    <div className="relative flex items-center w-full group/filter max-w-xs">
      <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-muted-foreground/60 group-focus-within/filter:text-primary transition-colors z-10">
        <Search className="w-3.5 h-3.5" />
      </div>

      <input
        ref={ref}
        id={resolvedId}
        name={resolvedName}
        type="text"
        value={value ?? ""}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-required={required}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        data-field-name={resolvedName}
        data-field-type={resolvedType}
        data-field-component={resolvedComponent}
        className={cn(
          "w-full h-8.5 pl-8 pr-8 text-xs font-medium rounded-lg",
          "border border-border/60 hover:border-border dark:border-border/40 dark:hover:border-border/70",
          "bg-surface-raised/40 dark:bg-surface-raised/20 focus:bg-background dark:focus:bg-surface",
          "focus:border-primary text-foreground shadow-2xs outline-none transition-all",
          className
        )}
        {...rest}
      />

      {hasValue && (
        <div className="absolute right-2 flex items-center z-10 animate-in fade-in zoom-in-95">
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-muted rounded-full text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
            title="Clear filter"
            aria-label="Clear filter"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
});

TableFilterField.displayName = "TableFilterField";

