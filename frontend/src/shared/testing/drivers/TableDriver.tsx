import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BaseDriver } from "./BaseDriver";
import { renderWithProviders } from "../test-utils";

/**
 * TableDriver - Semantic GrayBox Test DSL for ZenithTable
 *
 * Models user interactions with ZenithTable without coupling test assertions
 * to brittle internal DOM structures or class names.
 */
export class TableDriver extends BaseDriver {
  protected user: ReturnType<typeof userEvent.setup>;

  constructor(
    container: HTMLElement,
    user: ReturnType<typeof userEvent.setup> = userEvent.setup()
  ) {
    super(container);
    this.user = user;
  }

  /**
   * Renders a ZenithTable or component hierarchy wrapped in providers.
   */
  static async render(
    ui: React.ReactElement,
    options?: { user?: ReturnType<typeof userEvent.setup> }
  ) {
    const user = options?.user ?? userEvent.setup();
    const { container } = renderWithProviders(ui);
    return new TableDriver(container, user);
  }

  // ─── Query & Search ────────────────────────────────────────────────────────

  /**
   * Enters text into the global search toolbar input.
   */
  async search(query: string): Promise<void> {
    const searchInput =
      this.container.querySelector<HTMLInputElement>(
        'input[type="search"], input[placeholder*="Search" i], [data-testid="table-search-input"]'
      ) ?? screen.getByPlaceholderText(/search/i);

    await this.user.clear(searchInput);
    if (query) {
      await this.user.type(searchInput, query);
    }
  }

  /**
   * Clears the current global search input.
   */
  async clearSearch(): Promise<void> {
    await this.search("");
  }

  // ─── Sorting ───────────────────────────────────────────────────────────────

  /**
   * Clicks the header button for a specific column to toggle sorting.
   */
  async sort(columnId: string): Promise<void> {
    const header =
      this.container.querySelector<HTMLElement>(
        `th[data-column-id="${columnId}"] button, [data-testid="sort-${columnId}"]`
      ) ??
      this.container.querySelector<HTMLElement>(
        `th[data-column-id="${columnId}"]`
      );

    if (!header) {
      throw new Error(`[TableDriver] Column header with ID "${columnId}" not found.`);
    }

    await this.user.click(header);
  }

  // ─── Row Selection ─────────────────────────────────────────────────────────

  /**
   * Toggles selection for a specific row by ID.
   */
  async selectRow(rowId: string): Promise<void> {
    const selectBtn =
      this.container.querySelector<HTMLElement>(
        `[data-table-select="cell"][data-table-row="${rowId}"], [data-testid="table-select-${rowId}"]`
      );

    if (!selectBtn) {
      throw new Error(`[TableDriver] Select button for row "${rowId}" not found.`);
    }

    await this.user.click(selectBtn);
  }

  /**
   * Toggles bulk "select all" in the header.
   */
  async selectAll(): Promise<void> {
    const selectAllBtn =
      this.container.querySelector<HTMLElement>(
        '[data-table-select="header"], [data-testid="table-select-all"]'
      );

    if (!selectAllBtn) {
      throw new Error("[TableDriver] Select all header checkbox not found.");
    }

    await this.user.click(selectAllBtn);
  }

  // ─── Pagination ────────────────────────────────────────────────────────────

  /**
   * Clicks the next page pagination button.
   */
  async nextPage(): Promise<void> {
    const nextBtn =
      this.container.querySelector<HTMLButtonElement>(
        '[data-testid="pagination-next"], button[aria-label="Next page"], button[aria-label="Next"]'
      );

    if (!nextBtn) {
      throw new Error("[TableDriver] Next page button not found.");
    }

    await this.user.click(nextBtn);
  }

  /**
   * Clicks the previous page pagination button.
   */
  async prevPage(): Promise<void> {
    const prevBtn =
      this.container.querySelector<HTMLButtonElement>(
        '[data-testid="pagination-prev"], button[aria-label="Previous page"], button[aria-label="Previous"]'
      );

    if (!prevBtn) {
      throw new Error("[TableDriver] Previous page button not found.");
    }

    await this.user.click(prevBtn);
  }

  // ─── DOM Inspection & Query Helpers ────────────────────────────────────────

  /**
   * Returns all rendered table body row elements.
   */
  getRows(): HTMLElement[] {
    return Array.from(
      this.container.querySelectorAll<HTMLElement>("tbody tr[data-table-row]")
    );
  }

  /**
   * Returns total rendered row count in tbody.
   */
  getRowCount(): number {
    return this.getRows().length;
  }

  /**
   * Gets text content of a specific row and column cell.
   */
  getCellText(rowId: string, colId: string): string | null {
    const cell = this.container.querySelector<HTMLElement>(
      `tr[data-table-row="${rowId}"] td[data-column-id="${colId}"]`
    );
    return cell?.textContent?.trim() ?? null;
  }

  /**
   * Returns the count of selected rows.
   */
  getSelectedRowCount(): number {
    return this.container.querySelectorAll(
      'tbody tr[data-table-row][data-state="selected"]'
    ).length;
  }

  /**
   * Asserts whether a loading skeleton or loading indicator is currently displayed.
   */
  isLoading(): boolean {
    return Boolean(
      this.container.querySelector(
        '[data-testid="table-loading-skeleton"], [data-testid="table-loading"], .animate-pulse'
      )
    );
  }

  /**
   * Asserts whether an empty state placeholder is displayed or row count is zero.
   */
  isEmpty(): boolean {
    return (
      this.getRowCount() === 0 ||
      Boolean(
        this.container.querySelector(
          '[data-testid="table-empty-state"], [data-testid="empty-body"]'
        )
      )
    );
  }
}
