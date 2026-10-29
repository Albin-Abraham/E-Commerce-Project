import React from "react";
import { cn } from "@ui/form/utils/form-styles";
import { ChevronDown, X } from "lucide-react";
import { useComboboxContext } from "./ComboboxContext";

export interface ComboboxInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  clearable?: boolean;
  showChevron?: boolean;
  startIcon?: React.ReactNode;
}

/**
 * ComboboxInput
 *
 * Implements the WAI-ARIA role="combobox" input control.
 * Coordinates aria-expanded, aria-activedescendant, aria-controls, and keyboard events.
 */
export const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>(
  function ComboboxInput(
    {
      className,
      clearable = true,
      showChevron = true,
      startIcon,
      placeholder = "Search or select...",
      ...rest
    },
    forwardedRef
  ) {
    const {
      isOpen,
      setIsOpen,
      searchQuery,
      setSearchQuery,
      highlightedValue,
      inputRef,
      listboxId,
      inputProps,
      selectOption,
      value,
    } = useComboboxContext();

    const activeDescendantId =
      isOpen && highlightedValue
        ? `${listboxId}-opt-${highlightedValue}`
        : undefined;

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSearchQuery("");
      selectOption("");
      inputRef.current?.focus();
    };

    return (
      <div className="relative flex items-center w-full">
        {startIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-foreground/40">
            {startIcon}
          </div>
        )}
        <input
          ref={(node) => {
            (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            if (typeof forwardedRef === "function") {
              forwardedRef(node);
            } else if (forwardedRef) {
              (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }
          }}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeDescendantId}
          value={searchQuery}
          id={inputProps.id}
          onKeyDown={inputProps.onKeyDown}
          onChange={inputProps.onChange}
          onFocus={inputProps.onFocus}
          onBlur={inputProps.onBlur}
          placeholder={placeholder}
          className={cn(
            "w-full h-10 px-3 text-sm rounded-lg bg-surface border border-border transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
            startIcon && "pl-9",
            (clearable || showChevron) && "pr-14",
            className
          )}
          {...rest}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {clearable && (searchQuery || value) && (
            <button
              type="button"
              aria-label="Clear selection"
              onClick={handleClear}
              tabIndex={-1}
              className="p-1 rounded-md text-foreground/40 hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {showChevron && (
            <button
              type="button"
              tabIndex={-1}
              aria-label={isOpen ? "Close options" : "Open options"}
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 rounded-md text-foreground/40 hover:text-foreground focus:outline-none"
            >
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
          )}
        </div>
      </div>
    );
  }
);

ComboboxInput.displayName = "ComboboxInput";
