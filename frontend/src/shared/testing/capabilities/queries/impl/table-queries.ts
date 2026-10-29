import type { TableQueryOptions, QueryResult } from "../types";
import { querySelector, getContainer } from "./dom-queries";

export interface TableQueryResult {
  table: HTMLTableElement | null;
  header: HTMLTableSectionElement | null;
  body: HTMLTableSectionElement | null;
  footer: HTMLTableSectionElement | null;
  rows: HTMLTableRowElement[];
  headerCells: HTMLTableCellElement[];
}

export interface RowQueryResult {
  row: HTMLTableRowElement | null;
  cells: HTMLTableCellElement[];
  isSelected: boolean;
  isExpanded: boolean;
  isEditing: boolean;
}

export interface CellQueryResult {
  cell: HTMLTableCellElement | null;
  columnName: string | null;
  columnIndex: number;
  rowIndex: number;
  content: string;
  isEditable: boolean;
  isEditing: boolean;
}

export function queryTable(
  container: HTMLElement | undefined,
  selector: string = "table, [role='grid'], [data-table]"
): QueryResult<HTMLTableElement> {
  return querySelector(container, selector);
}

export function getTableStructure(
  container: HTMLElement | undefined,
  selector?: string
): TableQueryResult {
  const tableResult = queryTable(container, selector);
  const table = tableResult.element;
  
  if (!table) {
    return { table: null, header: null, body: null, footer: null, rows: [], headerCells: [] };
  }

  const header = table.tHead;
  const body = table.tBodies[0] ?? null;
  const footer = table.tFoot ?? null;
  const rows = body ? Array.from(body.rows) : Array.from(table.rows);
  const headerCells = header ? Array.from(header.rows[0]?.cells ?? []) : [];

  return { table, header, body, footer, rows, headerCells };
}

export function getTableRows(
  container: HTMLElement | undefined,
  selector?: string
): HTMLTableRowElement[] {
  const { rows } = getTableStructure(container, selector);
  return rows;
}

export function getTableRow(
  container: HTMLElement | undefined,
  options: TableQueryOptions
): RowQueryResult {
  const rows = getTableRows(container);
  const index = options.rowIndex ?? 0;
  const row = rows[index] ?? null;
  
  if (!row) {
    return { row: null, cells: [], isSelected: false, isExpanded: false, isEditing: false };
  }

  const cells = Array.from(row.cells);
  const isSelected = row.getAttribute("aria-selected") === "true" || row.classList.contains("selected");
  const isExpanded = row.getAttribute("aria-expanded") === "true";
  const isEditing = row.querySelector("[contenteditable='true'], input, select, textarea") !== null;

  return { row, cells, isSelected, isExpanded, isEditing };
}

export function getTableCell(
  container: HTMLElement | undefined,
  options: TableQueryOptions
): CellQueryResult {
  const rowResult = getTableRow(container, options);
  const { row, cells } = rowResult;
  
  if (!row || cells.length === 0) {
    return { cell: null, columnName: null, columnIndex: -1, rowIndex: options.rowIndex ?? 0, content: "", isEditable: false, isEditing: false };
  }

  const colIndex = options.columnIndex ?? 0;
  const cell = cells[colIndex] ?? null;
  
  if (!cell) {
    return { cell: null, columnName: null, columnIndex: colIndex, rowIndex: options.rowIndex ?? 0, content: "", isEditable: false, isEditing: false };
  }

  const { headerCells } = getTableStructure(container);
  const columnName = headerCells[colIndex]?.textContent?.trim() ?? null;
  const content = cell.textContent?.trim() ?? "";
  const isEditable = cell.getAttribute("contenteditable") === "true" || cell.querySelector("input, select, textarea") !== null;
  const isEditing = cell.querySelector("input, select, textarea") !== null || cell.getAttribute("data-editing") === "true";

  return { cell, columnName, columnIndex: colIndex, rowIndex: options.rowIndex ?? 0, content, isEditable, isEditing };
}

export function getCellByColumnName(
  container: HTMLElement | undefined,
  rowIndex: number,
  columnName: string
): CellQueryResult {
  const { headerCells } = getTableStructure(container);
  const columnIndex = headerCells.findIndex(th => th.textContent?.trim() === columnName);
  
  if (columnIndex === -1) {
    return { cell: null, columnName, columnIndex: -1, rowIndex, content: "", isEditable: false, isEditing: false };
  }
  
  return getTableCell(container, { rowIndex, columnIndex });
}

export function getSelectedRows(
  container: HTMLElement | undefined,
  selector?: string
): HTMLTableRowElement[] {
  const rows = getTableRows(container, selector);
  return rows.filter(row => 
    row.getAttribute("aria-selected") === "true" || row.classList.contains("selected")
  );
}

export function getExpandedRows(
  container: HTMLElement | undefined,
  selector?: string
): HTMLTableRowElement[] {
  const rows = getTableRows(container, selector);
  return rows.filter(row => row.getAttribute("aria-expanded") === "true");
}

export function getEditingRows(
  container: HTMLElement | undefined,
  selector?: string
): HTMLTableRowElement[] {
  const rows = getTableRows(container, selector);
  return rows.filter(row => row.querySelector("[contenteditable='true'], input, select, textarea") !== null);
}

export function getColumnIndexByName(
  container: HTMLElement | undefined,
  columnName: string
): number {
  const { headerCells } = getTableStructure(container);
  return headerCells.findIndex(th => th.textContent?.trim() === columnName);
}

export function getColumnValues(
  container: HTMLElement | undefined,
  columnName: string
): string[] {
  const columnIndex = getColumnIndexByName(container, columnName);
  if (columnIndex === -1) return [];
  
  const rows = getTableRows(container);
  return rows.map(row => row.cells[columnIndex]?.textContent?.trim() ?? "");
}

export function isTableEmpty(
  container: HTMLElement | undefined,
  selector?: string
): boolean {
  const rows = getTableRows(container, selector);
  return rows.length === 0 || (rows.length === 1 && rows[0].cells.length === 0);
}

export function getTablePagination(
  container: HTMLElement | undefined
): { currentPage: number; totalPages: number; pageSize: number; totalItems: number } | null {
  const root = getContainer(container);
  const pagination = root.querySelector("[data-pagination], .pagination, [role='navigation']");
  
  if (!pagination) return null;
  
  const currentPage = parseInt(pagination.getAttribute("data-current-page") ?? "1", 10);
  const totalPages = parseInt(pagination.getAttribute("data-total-pages") ?? "1", 10);
  const pageSize = parseInt(pagination.getAttribute("data-page-size") ?? "10", 10);
  const totalItems = parseInt(pagination.getAttribute("data-total-items") ?? "0", 10);
  
  return { currentPage, totalPages, pageSize, totalItems };
}

export function getTableSortState(
  container: HTMLElement | undefined,
  columnName: string
): "asc" | "desc" | "none" {
  const columnIndex = getColumnIndexByName(container, columnName);
  if (columnIndex === -1) return "none";
  
  const { headerCells } = getTableStructure(container);
  const header = headerCells[columnIndex];
  
  if (!header) return "none";
  if (header.getAttribute("aria-sort") === "ascending") return "asc";
  if (header.getAttribute("aria-sort") === "descending") return "desc";
  return "none";
}