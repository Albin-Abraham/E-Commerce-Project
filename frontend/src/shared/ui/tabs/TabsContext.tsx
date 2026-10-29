import { createContext, useContext } from "react";
import type { UseRovingFocusReturn } from "../a11y/useRovingFocus";

export interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  orientation: "horizontal" | "vertical";
  activation: "automatic" | "manual";
  baseId: string;
  roving: UseRovingFocusReturn;
}

export const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs composite components must be rendered within a <Tabs /> container");
  }
  return context;
}
