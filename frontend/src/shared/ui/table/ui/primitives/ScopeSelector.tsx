import React from "react";

/**
 * ScopeSelector — Headless component for choosing export/selection scope.
 *
 * Renders scope options (e.g. "Current Page" vs "All Filtered Data").
 * Consumers provide their own layout via render props.
 */

export interface ScopeOption {
  type: string;
  label: string;
  count: number;
}

export interface ScopeSelectorRenderProps {
  options: ScopeOption[];
  select: (type: string) => void;
}

export interface ScopeSelectorProps {
  options: ScopeOption[];
  onSelect: (type: string) => void;
  /** Children as render prop */
  children?: (props: ScopeSelectorRenderProps) => React.ReactNode;
  /** Default option type to highlight */
  defaultType?: string;
}

export function ScopeSelector({
  options,
  onSelect,
  children,
  defaultType,
}: ScopeSelectorProps) {
  if (children) {
    return <>{children({ options, select: onSelect })}</>;
  }

  return (
    <DefaultScopeSelector
      options={options}
      onSelect={onSelect}
      defaultType={defaultType}
    />
  );
}

/**
 * DefaultScopeSelector — Pre-built scope selection UI.
 */
export function DefaultScopeSelector({
  options,
  onSelect,
  defaultType,
}: {
  options: ScopeOption[];
  onSelect: (type: string) => void;
  defaultType?: string;
}) {
  return (
    <div className="flex flex-col gap-2 p-1">
      {options.map((option) => (
        <button
          key={option.type}
          onClick={() => onSelect(option.type)}
          className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
            option.type === defaultType
              ? "border-primary/40 bg-primary/5 shadow-sm"
              : "border-border/40 hover:border-primary/20 hover:bg-surface"
          }`}
        >
          <span className="text-sm font-medium">{option.label}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {option.count.toLocaleString()} rows
          </span>
        </button>
      ))}
    </div>
  );
}
