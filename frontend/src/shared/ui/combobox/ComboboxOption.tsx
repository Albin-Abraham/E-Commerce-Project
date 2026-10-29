import React, { useEffect } from "react";
import { cn } from "@ui/form/utils/form-styles";
import { Check } from "lucide-react";
import { useComboboxContext } from "./ComboboxContext";

export interface ComboboxOptionProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  label?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * ComboboxOption
 *
 * Implements the WAI-ARIA role="option" element.
 * Registers option metadata, handles click selection, and indicates hover/focus highlight.
 */
export const ComboboxOption = React.forwardRef<HTMLDivElement, ComboboxOptionProps>(
  function ComboboxOption(
    { value, label, disabled = false, icon, children, className, onClick, ...rest },
    ref
  ) {
    const {
      value: selectedValue,
      selectOption,
      highlightedValue,
      setHighlightedValue,
      filteredOptions,
      registerOption,
      unregisterOption,
      listboxId,
    } = useComboboxContext();

    const resolvedLabel = label || (typeof children === "string" ? children : value);

    // Register with context
    useEffect(() => {
      registerOption({
        value,
        label: resolvedLabel,
        disabled,
        icon,
      });
      return () => unregisterOption(value);
    }, [disabled, icon, registerOption, resolvedLabel, unregisterOption, value]);

    const isVisible = filteredOptions.some((o) => o.value === value);
    if (!isVisible) {
      return null;
    }

    const isSelected = selectedValue === value;
    const isHighlighted = highlightedValue === value;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      selectOption(value);
      onClick?.(e);
    };

    return (
      <div
        ref={ref}
        id={`${listboxId}-opt-${value}`}
        role="option"
        aria-selected={isSelected}
        aria-disabled={disabled}
        data-highlighted={isHighlighted}
        onClick={handleClick}
        onMouseEnter={() => {
          if (!disabled) {
            setHighlightedValue(value);
          }
        }}
        className={cn(
          "relative flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer select-none transition-colors",
          isSelected && "font-medium text-primary",
          isHighlighted && "bg-primary/10 text-primary",
          !isHighlighted && !isSelected && "text-foreground hover:bg-muted/50",
          disabled && "opacity-40 cursor-not-allowed pointer-events-none",
          className
        )}
        {...rest}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="truncate">{children || resolvedLabel}</span>
        </div>
        {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
      </div>
    );
  }
);

ComboboxOption.displayName = "ComboboxOption";
