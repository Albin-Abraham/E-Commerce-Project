import { createContext, useContext } from "react";

import type {
  TableChromeFlags,
  TableExportBehavior,
  TableImportBehavior,
  TableImportSurface,
} from "./table-entity";

export interface TableChromeValue extends Required<TableChromeFlags> {
  serverExport: TableExportBehavior | null;
  tableImport: TableImportBehavior | null;
  importSurface: TableImportSurface | null;
}

const DEFAULT_CHROME: TableChromeValue = {
  exportBtn: false,
  importBtn: false,
  deleteBtn: false,
  filterStatusBadge: false,
  serverExport: null,
  tableImport: null,
  importSurface: null,
};

const TableChromeContext = createContext<TableChromeValue>(DEFAULT_CHROME);

export const TableChromeProvider = TableChromeContext.Provider;

export function useTableChrome(): TableChromeValue {
  return useContext(TableChromeContext);
}
