import React from "react";
import { cn } from "@ui/form/utils/form-styles";
import { useComboboxContext } from "./ComboboxContext";

export interface ComboboxListProps extends React.HTMLAttributes<HTMLDivElement> {
  "aria-label"?: string;
  children?: React.ReactNode;
}

/**
 * ComboboxList
 *
 * Implements the WAI-ARIA role="listbox" popup container.
 * Renders dropdown options when the combobox is open.
 */
export const ComboboxList = React.forwardRef<HTMLDivElement, ComboboxListProps>(
  function ComboboxList({ children, className, "aria-label": ariaLabel, ...rest }, ref) {
    const { isOpen, listboxId, filteredOptions } = useComboboxContext();

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        id={listboxId}
        role="listbox"
        aria-label={ariaLabel || "Options"}
        className={cn(
          "absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-lg custom-scrollbar",
          className
        )}
        {...rest}
      >
        {filteredOptions.length === 0 ? (
          children
        ) : (
          children
        )}
      </div>
    );
  }
);

ComboboxList.displayName = "ComboboxList";
