import { createContext, useContext } from "react";

import type { FormDefinition } from "@ui/form/types";

const TableFilterContext = createContext<FormDefinition | null>(null);

export const TableFilterProvider = TableFilterContext.Provider;

export function useTableFilterForm(): FormDefinition | null {
  return useContext(TableFilterContext);
}
