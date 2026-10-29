import React from "react";
import { cn } from "@ui/form/utils/form-styles";
import { useTabsContext } from "./TabsContext";

export interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  children: React.ReactNode;
}

/**
 * TabList
 *
 * Implements the WAI-ARIA role="tablist" element container.
 * Passes aria-orientation and connects keyboard navigation to the roving focus engine.
 */
export const TabList = React.forwardRef<HTMLDivElement, TabListProps>(function TabList(
  { children, className, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...rest },
  ref
) {
  const { orientation, roving } = useTabsContext();
  const containerProps = roving.getContainerProps();

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      onKeyDown={containerProps.onKeyDown}
      className={cn(
        "flex",
        orientation === "vertical"
          ? "flex-col items-stretch border-r border-border pr-2 gap-1"
          : "flex-row items-end border-b border-border gap-1 overflow-x-auto scrollbar-none",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

TabList.displayName = "TabList";
