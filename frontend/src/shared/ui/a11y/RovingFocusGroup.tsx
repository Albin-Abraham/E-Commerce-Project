import React, { createContext, useContext } from "react";
import {
  useRovingFocus,
  type UseRovingFocusOptions,
  type UseRovingFocusReturn,
} from "./useRovingFocus";

export interface RovingFocusContextValue extends UseRovingFocusReturn {
  orientation: "horizontal" | "vertical" | "both";
  loop: boolean;
}

const RovingFocusContext = createContext<RovingFocusContextValue | null>(null);

export function useRovingFocusContext(): RovingFocusContextValue {
  const ctx = useContext(RovingFocusContext);
  if (!ctx) {
    throw new Error("useRovingFocusContext must be used within a <RovingFocusGroup />");
  }
  return ctx;
}

export interface RovingFocusGroupProps extends UseRovingFocusOptions {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  role?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/**
 * RovingFocusGroup
 *
 * Compound container managing keyboard roving tabindex across child focusable elements.
 */
export const RovingFocusGroup: React.FC<RovingFocusGroupProps> = ({
  children,
  className,
  as: Component = "div",
  role,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  orientation = "horizontal",
  loop = true,
  ...options
}) => {
  const roving = useRovingFocus({ orientation, loop, ...options });
  const containerProps = roving.getContainerProps();

  return (
    <RovingFocusContext.Provider value={{ ...roving, orientation, loop }}>
      <Component
        role={role}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-orientation={orientation === "both" ? undefined : orientation}
        className={className}
        onKeyDown={containerProps.onKeyDown}
        tabIndex={containerProps.tabIndex}
      >
        {children}
      </Component>
    </RovingFocusContext.Provider>
  );
};

RovingFocusGroup.displayName = "RovingFocusGroup";
