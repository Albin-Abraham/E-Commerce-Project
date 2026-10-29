import { createContext, useContext } from "react";
import type { ComboboxContextValue } from "./types";

export const ComboboxContext = createContext<ComboboxContextValue | null>(null);

export function useComboboxContext(): ComboboxContextValue {
  const context = useContext(ComboboxContext);
  if (!context) {
    throw new Error(
      "Combobox composite components must be rendered inside a <Combobox /> container"
    );
  }
  return context;
}
