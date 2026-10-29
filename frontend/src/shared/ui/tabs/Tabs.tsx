import React, { useId, useState } from "react";
import { cn } from "@ui/form/utils/form-styles";
import { useRovingFocus } from "../a11y/useRovingFocus";
import { TabsContext } from "./TabsContext";

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  activation?: "automatic" | "manual";
  children: React.ReactNode;
  scope?: string;
}

/**
 * Tabs
 *
 * Composite root component for accessible WAI-ARIA tabbed interfaces.
 * Coordinates roving focus, selection state, and accessible relationship IDs.
 */
export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    value: controlledValue,
    defaultValue = "",
    onValueChange,
    orientation = "horizontal",
    activation = "automatic",
    scope,
    children,
    className,
    id: propId,
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const baseId = propId || `tabs-${generatedId.replace(/:/g, "")}`;
  const [internalValue, setInternalValue] = useState(defaultValue);

  const activeValue = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = (newVal: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newVal);
    }
    onValueChange?.(newVal);
  };

  const roving = useRovingFocus({
    orientation,
    activation,
    loop: true,
    defaultActiveId: activeValue,
    onActiveChange: (id) => {
      if (activation === "automatic") {
        handleValueChange(id);
      }
    },
    onSelect: (id) => {
      handleValueChange(id);
    },
    scope: scope || `tabs:${baseId}`,
  });

  // Keep roving focus in sync when activeValue changes via selection
  React.useEffect(() => {
    if (activeValue && roving.activeId !== activeValue && activation === "automatic") {
      roving.setActiveId(activeValue);
    }
  }, [activeValue, activation, roving]);

  return (
    <TabsContext.Provider
      value={{
        value: activeValue,
        setValue: handleValueChange,
        orientation,
        activation,
        baseId,
        roving,
      }}
    >
      <div
        ref={ref}
        id={baseId}
        data-orientation={orientation}
        className={cn(
          "w-full flex",
          orientation === "vertical" ? "flex-row gap-6" : "flex-col gap-4",
          className
        )}
        {...rest}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
});

Tabs.displayName = "Tabs";
