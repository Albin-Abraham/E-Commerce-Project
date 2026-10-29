import React from "react";
import { cn } from "@ui/form/utils/form-styles";
import { useTabsContext } from "./TabsContext";

export interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
}

/**
 * Tab
 *
 * Implements the WAI-ARIA role="tab" trigger button.
 * Coordinates aria-selected, aria-controls, and roving tabindex.
 */
export const Tab = React.forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { value, disabled = false, children, className, onClick, ...rest },
  forwardedRef
) {
  const { value: activeValue, baseId, roving, orientation } = useTabsContext();
  const isSelected = activeValue === value;
  const itemProps = roving.getItemProps(value, { disabled });

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={isSelected}
      aria-controls={`${baseId}-panel-${value}`}
      disabled={disabled}
      tabIndex={itemProps.tabIndex}
      onKeyDown={itemProps.onKeyDown}
      onClick={(e) => {
        itemProps.onClick(e);
        onClick?.(e);
      }}
      ref={(node) => {
        itemProps.ref(node);
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }
      }}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        orientation === "horizontal"
          ? isSelected
            ? "text-primary border-b-2 border-primary -mb-px rounded-t-md"
            : "text-foreground/60 hover:text-foreground border-b-2 border-transparent rounded-t-md"
          : isSelected
            ? "text-primary border-r-2 border-primary -mr-px bg-primary/5 rounded-l-md"
            : "text-foreground/60 hover:text-foreground border-r-2 border-transparent rounded-l-md",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

Tab.displayName = "Tab";
