export * from "./types";
export * from "./impl/dom-queries";
export * from "./impl/form-queries";
export * from "./impl/table-queries";

import type { QueryOptions, FieldQueryOptions, TableQueryOptions } from "./types";
import * as domQueries from "./impl/dom-queries";
import * as formQueries from "./impl/form-queries";
import * as tableQueries from "./impl/table-queries";

export function createQueryCapability(container: HTMLElement) {
  const ctx = { container };

  return {
    // DOM Queries
    queryByRole: <T extends HTMLElement = HTMLElement>(role: string, options?: QueryOptions) =>
      domQueries.queryByRole<T>(ctx.container, role, options),
    getByRole: <T extends HTMLElement = HTMLElement>(role: string, options?: QueryOptions) =>
      domQueries.getByRole<T>(ctx.container, role, options),
    findByRole: <T extends HTMLElement = HTMLElement>(role: string, options?: QueryOptions) =>
      domQueries.findByRole<T>(ctx.container, role, options),
    
    queryByLabel: <T extends HTMLElement = HTMLElement>(label: string | RegExp, options?: QueryOptions) =>
      domQueries.queryByLabel<T>(ctx.container, label, options),
    getByLabel: <T extends HTMLElement = HTMLElement>(label: string | RegExp, options?: QueryOptions) =>
      domQueries.getByLabel<T>(ctx.container, label, options),
    
    queryByText: <T extends HTMLElement = HTMLElement>(text: string | RegExp, options?: QueryOptions) =>
      domQueries.queryByText<T>(ctx.container, text, options),
    getByText: <T extends HTMLElement = HTMLElement>(text: string | RegExp, options?: QueryOptions) =>
      domQueries.getByText<T>(ctx.container, text, options),
    
    queryByTestId: <T extends HTMLElement = HTMLElement>(testId: string, options?: QueryOptions) =>
      domQueries.queryByTestId<T>(ctx.container, testId, options),
    getByTestId: <T extends HTMLElement = HTMLElement>(testId: string) =>
      domQueries.getByTestId<T>(ctx.container, testId),
    
    queryByPlaceholder: <T extends HTMLElement = HTMLElement>(placeholder: string | RegExp, options?: QueryOptions) =>
      domQueries.queryByPlaceholder<T>(ctx.container, placeholder, options),
    queryByDisplayValue: <T extends HTMLElement = HTMLElement>(value: string | RegExp, options?: QueryOptions) =>
      domQueries.queryByDisplayValue<T>(ctx.container, value, options),
    
    queryAllByRole: <T extends HTMLElement = HTMLElement>(role: string, options?: QueryOptions) =>
      domQueries.queryAllByRole<T>(ctx.container, role, options),
    queryAllByText: <T extends HTMLElement = HTMLElement>(text: string | RegExp, options?: QueryOptions) =>
      domQueries.queryAllByText<T>(ctx.container, text, options),
    queryAllByTestId: <T extends HTMLElement = HTMLElement>(testId: string) =>
      domQueries.queryAllByTestId<T>(ctx.container, testId),
    
    querySelector: <T extends HTMLElement = HTMLElement>(selector: string) =>
      domQueries.querySelector<T>(ctx.container, selector),
    querySelectorAll: <T extends HTMLElement = HTMLElement>(selector: string) =>
      domQueries.querySelectorAll<T>(ctx.container, selector),
    
    // Form Queries
    queryFormField: (options: FieldQueryOptions) =>
      formQueries.queryFormField(ctx.container, options),
    queryFormFields: (selector?: string) =>
      formQueries.queryFormFields(ctx.container, selector),
    getFormFieldByName: (name: string) =>
      formQueries.getFormFieldByName(ctx.container, name),
    getFormFieldById: (id: string) =>
      formQueries.getFormFieldById(ctx.container, id),
    getFormFieldByRole: (role: string) =>
      formQueries.getFormFieldByRole(ctx.container, role),
    getFormFieldByLabel: (label: string) =>
      formQueries.getFormFieldByLabel(ctx.container, label),
    isFieldVisible: (options: FieldQueryOptions) =>
      formQueries.isFieldVisible(ctx.container, options),
    isFieldDisabled: (options: FieldQueryOptions) =>
      formQueries.isFieldDisabled(ctx.container, options),
    isFieldRequired: (options: FieldQueryOptions) =>
      formQueries.isFieldRequired(ctx.container, options),
    getFieldValue: (options: FieldQueryOptions) =>
      formQueries.getFieldValue(ctx.container, options),
    getFieldAttribute: (options: FieldQueryOptions, attribute: string) =>
      formQueries.getFieldAttribute(ctx.container, options, attribute),
    getFieldValidationState: (options: FieldQueryOptions) =>
      formQueries.getFieldValidationState(ctx.container, options),
    getFieldError: (options: FieldQueryOptions) =>
      formQueries.getFieldError(ctx.container, options),
    
    // Table Queries
    queryTable: (selector?: string) =>
      tableQueries.queryTable(ctx.container, selector),
    getTableStructure: (selector?: string) =>
      tableQueries.getTableStructure(ctx.container, selector),
    getTableRows: (selector?: string) =>
      tableQueries.getTableRows(ctx.container, selector),
    getTableRow: (options: TableQueryOptions) =>
      tableQueries.getTableRow(ctx.container, options),
    getTableCell: (options: TableQueryOptions) =>
      tableQueries.getTableCell(ctx.container, options),
    getCellByColumnName: (rowIndex: number, columnName: string) =>
      tableQueries.getCellByColumnName(ctx.container, rowIndex, columnName),
    getSelectedRows: (selector?: string) =>
      tableQueries.getSelectedRows(ctx.container, selector),
    getExpandedRows: (selector?: string) =>
      tableQueries.getExpandedRows(ctx.container, selector),
    getEditingRows: (selector?: string) =>
      tableQueries.getEditingRows(ctx.container, selector),
    getColumnIndexByName: (columnName: string) =>
      tableQueries.getColumnIndexByName(ctx.container, columnName),
    getColumnValues: (columnName: string) =>
      tableQueries.getColumnValues(ctx.container, columnName),
    isTableEmpty: (selector?: string) =>
      tableQueries.isTableEmpty(ctx.container, selector),
    getTablePagination: () =>
      tableQueries.getTablePagination(ctx.container),
    getTableSortState: (columnName: string) =>
      tableQueries.getTableSortState(ctx.container, columnName),
  };
}

export type QueryCapability = ReturnType<typeof createQueryCapability>;