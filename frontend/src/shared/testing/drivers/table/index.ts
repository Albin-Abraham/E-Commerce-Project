/**
 * Table Driver - Semantic Layer for Table Testing
 * 
 * Provides semantic operations for ZenithTable testing.
 */

import { expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BaseDriver } from '../base';

export class TableDriver extends BaseDriver {
  protected user: ReturnType<typeof userEvent.setup>;

  constructor(
    container: HTMLElement,
    user: ReturnType<typeof userEvent.setup> = userEvent.setup()
  ) {
    super(container);
    this.user = user;
  }

  // --- Table Selection ---

  public getTableRoot() {
    return this.query('[data-table-root]') || this.container.querySelector('[data-table-root]');
  }

  public getTableBody() {
    return this.query('[data-table-body]') || this.getTableRoot()?.querySelector('[data-table-body]');
  }

  public getTableHeader() {
    return this.query('[data-table-header]') || this.getTableRoot()?.querySelector('[data-table-header]');
  }

  public getTableToolbar() {
    return this.query('[data-table-toolbar]') || this.getTableRoot()?.querySelector('[data-table-toolbar]');
  }

  public getTablePagination() {
    return this.query('[data-table-pagination]') || this.getTableRoot()?.querySelector('[data-table-pagination]');
  }

  // --- Row Operations ---

  public getRows() {
    return this.queryAll('[data-table-row]');
  }

  public getRow(index: number) {
    const rows = this.getRows();
    return rows[index] || null;
  }

  public getRowById(id: string) {
    return this.query(`[data-table-row][data-row-id="${id}"]`);
  }

  public getSelectedRows() {
    return this.queryAll('[data-table-row][data-selected="true"]');
  }

  public getExpandedRows() {
    return this.queryAll('[data-table-row][data-expanded="true"]');
  }

  public getEditingRows() {
    return this.queryAll('[data-table-row][data-editing="true"]');
  }

  // --- Cell Operations ---

  public getCell(rowIndex: number, columnName: string) {
    const row = this.getRow(rowIndex);
    if (!row) return null;
    return row.querySelector(`[data-column="${columnName}"]`) as HTMLElement | null;
  }

  public getCellValue(rowIndex: number, columnName: string): string | null {
    const cell = this.getCell(rowIndex, columnName);
    return cell?.textContent?.trim() || null;
  }

  // --- Semantic Interactions ---

  public async search(query: string) {
    const toolbar = this.getTableToolbar();
    if (!toolbar) throw new Error('Table toolbar not found');

    const searchInput = toolbar.querySelector('input[type="search"], input[placeholder*="Search" i]') as HTMLInputElement;
    if (!searchInput) throw new Error('Search input not found in toolbar');

    await this.user.clear(searchInput);
    await this.user.type(searchInput, query);
    
    // Wait for search to complete
    await this.waitFor(() => {}, 500);
  }

  public async sortBy(columnName: string, direction: 'asc' | 'desc' = 'asc') {
    const header = this.getTableHeader();
    if (!header) throw new Error('Table header not found');

    const columnHeader = header.querySelector(`[data-column="${columnName}"]`) as HTMLElement;
    if (!columnHeader) throw new Error(`Column "${columnName}" not found in header`);

    const sortButton = columnHeader.querySelector('[data-sort-button]') as HTMLElement;
    if (!sortButton) throw new Error(`Sort button not found for column "${columnName}"`);

    // Check current sort direction
    const currentDirection = sortButton.getAttribute('data-sort-direction');
    const needsToggle = currentDirection !== direction;

    if (needsToggle) {
      await this.user.click(sortButton);
      await this.waitFor(() => {}, 300);
    }
  }

  public async selectRow(index: number) {
    const row = this.getRow(index);
    if (!row) throw new Error(`Row at index ${index} not found`);

    const checkbox = row.querySelector('input[type="checkbox"][data-select-row]') as HTMLInputElement;
    if (!checkbox) throw new Error(`Selection checkbox not found for row ${index}`);

    if (!checkbox.checked) {
      await this.user.click(checkbox);
    }
  }

  public async selectRowById(id: string) {
    const row = this.getRowById(id);
    if (!row) throw new Error(`Row with ID "${id}" not found`);

    const checkbox = row.querySelector('input[type="checkbox"][data-select-row]') as HTMLInputElement;
    if (!checkbox) throw new Error(`Selection checkbox not found for row "${id}"`);

    if (!checkbox.checked) {
      await this.user.click(checkbox);
    }
  }

  public async clickRowAction(rowIndex: number, actionName: string) {
    const row = this.getRow(rowIndex);
    if (!row) throw new Error(`Row at index ${rowIndex} not found`);

    const actionButton = row.querySelector(`[data-action="${actionName}"]`) as HTMLElement;
    if (!actionButton) throw new Error(`Action "${actionName}" not found in row ${rowIndex}`);

    await this.user.click(actionButton);
  }

  public async expandRow(rowIndex: number) {
    const row = this.getRow(rowIndex);
    if (!row) throw new Error(`Row at index ${rowIndex} not found`);

    const expandButton = row.querySelector('[data-expand-row]') as HTMLElement;
    if (!expandButton) throw new Error(`Expand button not found for row ${rowIndex}`);

    if (row.getAttribute('data-expanded') !== 'true') {
      await this.user.click(expandButton);
      await this.waitFor(() => {}, 300);
    }
  }

  public async collapseRow(rowIndex: number) {
    const row = this.getRow(rowIndex);
    if (!row) throw new Error(`Row at index ${rowIndex} not found`);

    const expandButton = row.querySelector('[data-expand-row]') as HTMLElement;
    if (!expandButton) throw new Error(`Expand button not found for row ${rowIndex}`);

    if (row.getAttribute('data-expanded') === 'true') {
      await this.user.click(expandButton);
      await this.waitFor(() => {}, 300);
    }
  }

  public async startEditing(rowIndex: number, columnName: string) {
    const cell = this.getCell(rowIndex, columnName);
    if (!cell) throw new Error(`Cell at row ${rowIndex}, column "${columnName}" not found`);

    const editButton = cell.querySelector('[data-edit-cell]') as HTMLElement;
    if (!editButton) throw new Error(`Edit button not found for cell at row ${rowIndex}, column "${columnName}"`);

    await this.user.click(editButton);
    await this.waitFor(() => {}, 200);
  }

  // --- Assertions ---

  public async expectRowCount(expectedCount: number) {
    const rows = this.getRows();
    expect(rows.length).toBe(expectedCount);
  }

  public async expectRowCountAtLeast(minCount: number) {
    const rows = this.getRows();
    expect(rows.length).toBeGreaterThanOrEqual(minCount);
  }

  public async expectCellValue(rowIndex: number, columnName: string, expectedValue: string) {
    const actual = this.getCellValue(rowIndex, columnName);
    expect(actual).toBe(expectedValue);
  }

  public async expectRowSelected(index: number) {
    const row = this.getRow(index);
    expect(row).toHaveAttribute('data-selected', 'true');
  }

  public async expectRowNotSelected(index: number) {
    const row = this.getRow(index);
    expect(row).not.toHaveAttribute('data-selected', 'true');
  }

  public async expectSorted(columnName: string, direction: 'asc' | 'desc') {
    const header = this.getTableHeader();
    if (!header) throw new Error('Table header not found');

    const columnHeader = header.querySelector(`[data-column="${columnName}"]`) as HTMLElement;
    const sortButton = columnHeader?.querySelector('[data-sort-button]') as HTMLElement;
    
    expect(sortButton).toHaveAttribute('data-sort-direction', direction);
  }

  public async expectFiltered(filterText: string) {
    const searchInput = this.getTableToolbar()?.querySelector('input[type="search"]') as HTMLInputElement;
    expect(searchInput?.value).toBe(filterText);
  }

  public async expectNoRows() {
    const rows = this.getRows();
    expect(rows.length).toBe(0);
  }

  public async expectLoading() {
    const root = this.getTableRoot();
    expect(root).toHaveAttribute('data-loading', 'true');
  }

  public async expectNotLoading() {
    const root = this.getTableRoot();
    expect(root).not.toHaveAttribute('data-loading', 'true');
  }

  public async expectEmptyState(message?: string) {
    const emptyState = this.query('[data-empty-state]');
    expect(emptyState).toBeInTheDocument();
    if (message) {
      expect(emptyState).toHaveTextContent(message);
    }
  }

  public async expectErrorState(message?: string) {
    const errorState = this.query('[data-error-state]');
    expect(errorState).toBeInTheDocument();
    if (message) {
      expect(errorState).toHaveTextContent(message);
    }
  }
}