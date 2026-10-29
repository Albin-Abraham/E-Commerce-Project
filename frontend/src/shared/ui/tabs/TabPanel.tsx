import React from "react";
import { cn } from "@ui/form/utils/form-styles";
import { useTabsContext } from "./TabsContext";

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  lazy?: boolean;
  children: React.ReactNode;
}

/**
 * TabPanel
 *
 * Implements the WAI-ARIA role="tabpanel" content container.
 * Linked to its matching Tab trigger via aria-labelledby and id.
 */
export const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(
  { value, lazy = false, children, className, ...rest },
  ref
) {
  const { value: activeValue, baseId } = useTabsContext();
  const isSelected = activeValue === value;

  if (lazy && !isSelected) {
    return null;
  }

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      hidden={!isSelected}
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg",
        !isSelected && "hidden",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

TabPanel.displayName = "TabPanel";
