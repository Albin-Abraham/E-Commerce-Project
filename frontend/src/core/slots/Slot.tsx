import React from "react";

import { slotRegistry } from "./registry";

interface SlotProps {
  name: string;
  fallback?: React.ReactNode;
  slotProps?: any;
}

/**
 * Slot Component
 *
 * Renders all components registered for a specific slot name.
 * Components are rendered in order of their priority.
 */
export const Slot: React.FC<SlotProps> = ({
  name,
  fallback,
  slotProps = {},
}) => {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    const unsubscribe = slotRegistry.subscribe(() => {
      forceUpdate();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const entries = slotRegistry.getEntries(name);

  if (entries.length === 0) {
    return <>{fallback}</>;
  }

  return (
    <>
      {entries.map((entry) => {
        const { component: Component, id } = entry;

        // If it's a function (Component), render it with props
        if (typeof Component === "function") {
          return <Component key={id} {...slotProps} />;
        }

        // If it's already a React element
        return <React.Fragment key={id}>{Component}</React.Fragment>;
      })}
    </>
  );
};
