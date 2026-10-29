import type { ColumnDef } from "@tanstack/react-table";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ZenithTable, useTableController } from "@ui/table";
import type { TableMeta } from "@ui/table";
import type { TableUrlPort } from "@ui/table/url/TableUrlPort";
import { TableUrl } from "@ui/table/url/TableUrl";
import { expect } from "vitest";

import { renderWithProviders } from "../test-utils";
import { BaseDriver } from "./BaseDriver";

// ─── Minimal fixture types ───────────────────────────────────────────────────

export interface SimpleRow {
  id: string;
  name: string;
  age: number;
}

export const SIMPLE_COLUMNS: ColumnDef<SimpleRow>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "age", header: "Age" },
];

export const SIMPLE_META: TableMeta = {
  id: "test-table",
  features: { urlSync: false },
  pagination: {
    showPageNumbers: true,
    showPageSizeSelector: false,
    showFirstLast: true,
    maxVisiblePages: 7,
  },
};

// ─── Harness component ───────────────────────────────────────────────────────

/**
 * Inner harness — must be a component so hooks work correctly.
 */
function TableHarness({
  data,
  meta = SIMPLE_META,
  columns = SIMPLE_COLUMNS as ColumnDef<SimpleRow>[],
  fetcher,
  totalCount,
  urlAdapter,
}: {
  data: SimpleRow[];
  meta?: TableMeta;
  columns?: ColumnDef<SimpleRow>[];
  fetcher?: (params: any) => Promise<any>;
  totalCount?: number;
  urlAdapter?: TableUrlPort;
}) {
  const ctrl = useTableController({
    meta,
    columns,
    source: fetcher ? { type: "server", fetcher } : { type: "client", data },
    totalCount,
    urlAdapter: urlAdapter ?? (meta?.features?.urlSync ? TableUrl.Adapters.createMock() : undefined),
  });

  return (
    <ZenithTable
      engine={ctrl.engine}
      meta={ctrl.meta}
      totalCount={ctrl.totalCount}
      loading={ctrl.loading}
      error={ctrl.error}
      search={ctrl.search}
      refetch={ctrl.refetch}
      canFetch={ctrl.canFetch}
      hasFetched={ctrl.hasFetched}
    >
      <ZenithTable.View>
        <ZenithTable.Header />
        <ZenithTable.Body />
      </ZenithTable.View>
      <ZenithTable.Pagination />
    </ZenithTable>
  );
}

// ─── Driver ──────────────────────────────────────────────────────────────────

/**
 * ZenithTableDriver
 *
 * Wraps all DOM interaction with ZenithTable.
 * Tests only call driver methods — zero raw screen/fireEvent in test files.
 */
export class ZenithTableDriver extends BaseDriver {
  protected user: ReturnType<typeof userEvent.setup>;

  constructor(
    container: HTMLElement,
    user: ReturnType<typeof userEvent.setup>
  ) {
    super(container);
    this.user = user;
  }

  // ── Static factory ───────────────────────────────────────────────────────

  /**
   * @param data      - client source data (ignored when fetcher is provided)
   * @param meta      - table meta config
   * @param columns   - column defs
   * @param fetcher   - optional server fetcher — if provided, uses server source mode
   * @param totalCount - optional total count override
   * @param urlAdapter - optional URL adapter for testing (uses mock when urlSync is true)
   */
  static async render(
    data: SimpleRow[],
    meta?: TableMeta,
    columns?: ColumnDef<SimpleRow>[],
    fetcher?: (params: any) => Promise<any>,
    totalCount?: number,
    urlAdapter?: TableUrlPort
  ) {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <TableHarness
        data={data}
        meta={meta}
        columns={columns}
        fetcher={fetcher}
        totalCount={totalCount}
        urlAdapter={urlAdapter}
      />
    );
    // Let the initial render settle
    await waitFor(() => {
      if (!container.querySelector("[data-table-root]")) {
        throw new Error("ZenithTable root not mounted yet");
      }
    });
    return { driver: new ZenithTableDriver(container, user), container, user };
  }

  // ── DOM Selectors ────────────────────────────────────────────────────────

  private get tableRoot() {
    return this.container.querySelector(
      "[data-table-root]"
    ) as HTMLElement | null;
  }

  private get paginationEl() {
    return this.container.querySelector(
      "[data-table-pagination]"
    ) as HTMLElement | null;
  }

  private allRows(): HTMLElement[] {
    // Use data-table-row attribute to select ONLY data rows.
    // The empty-state uses a plain <tr> without this attribute.
    return Array.from(
      this.container.querySelectorAll("tbody tr[data-table-row]")
    ) as HTMLElement[];
  }

  private allHeaderCells(): HTMLElement[] {
    return Array.from(
      this.container.querySelectorAll("thead th")
    ) as HTMLElement[];
  }

  // ── Table structure assertions ───────────────────────────────────────────

  /**
   * Assert that the table root is mounted in the DOM.
   */
  async expectMounted() {
    await waitFor(() => {
      expect(this.tableRoot).toBeTruthy();
    });
    return this;
  }

  /**
   * Assert that exactly N data rows are rendered.
   */
  async expectRowCount(n: number) {
    await waitFor(() => {
      expect(this.allRows()).toHaveLength(n);
    });
    return this;
  }

  /**
   * Assert that a header column with the given label exists.
   */
  async expectHeader(label: string) {
    await waitFor(() => {
      const found = this.allHeaderCells().some((th) =>
        th.textContent?.trim().includes(label)
      );
      expect(found, `Header "${label}" not found`).toBe(true);
    });
    return this;
  }

  /**
   * Assert that a specific cell value appears in the rendered table body.
   */
  async expectCellValue(value: string) {
    await waitFor(() => {
      const cells = Array.from(this.container.querySelectorAll("tbody td"));
      const found = cells.some((td) => td.textContent?.trim() === value);
      expect(found, `Cell value "${value}" not found in table`).toBe(true);
    });
    return this;
  }

  // ── Pagination assertions ────────────────────────────────────────────────

  /**
   * Assert the pagination nav is in the DOM.
   */
  async expectPaginationVisible() {
    await waitFor(() => {
      expect(this.paginationEl).toBeTruthy();
    });
    return this;
  }

  /**
   * Assert the pagination nav is NOT in the DOM (e.g. only 1 page).
   */
  async expectPaginationHidden() {
    // Pagination component always renders, but page navigation buttons only
    // appear when totalPages > 1.
    await waitFor(() => {
      // Either the pagination el is absent OR there are no page nav buttons
      const pageNavGroup = this.paginationEl?.querySelector('[role="group"]');
      expect(
        !this.paginationEl || !pageNavGroup,
        "Expected pagination to be hidden"
      ).toBe(true);
    });
    return this;
  }

  /**
   * Click the "Next page" button.
   */
  async goToNextPage() {
    const btn = this.container.querySelector(
      "[data-testid='table-pagination-next']"
    ) as HTMLButtonElement | null;
    expect(btn, "Next page button not found").toBeTruthy();
    await this.user.click(btn!);
    return this;
  }

  /**
   * Click the "Previous page" button.
   */
  async goToPrevPage() {
    const btn = this.container.querySelector(
      "[data-testid='table-pagination-prev']"
    ) as HTMLButtonElement | null;
    expect(btn, "Previous page button not found").toBeTruthy();
    await this.user.click(btn!);
    return this;
  }

  /**
   * Click a specific numbered page button.
   */
  async goToPage(pageNum: number) {
    const btn = this.container.querySelector(
      `[data-testid='table-pagination-page-${pageNum}']`
    ) as HTMLButtonElement | null;
    expect(btn, `Page ${pageNum} button not found`).toBeTruthy();
    await this.user.click(btn!);
    return this;
  }

  /**
   * Assert the "Next" button is disabled (last page).
   */
  async expectNextDisabled() {
    await waitFor(() => {
      const btn = this.container.querySelector(
        "[data-testid='table-pagination-next']"
      ) as HTMLButtonElement | null;
      expect(btn).toBeTruthy();
      expect(btn!.disabled).toBe(true);
    });
    return this;
  }

  /**
   * Assert the "Previous" button is disabled (first page).
   */
  async expectPrevDisabled() {
    await waitFor(() => {
      const btn = this.container.querySelector(
        "[data-testid='table-pagination-prev']"
      ) as HTMLButtonElement | null;
      expect(btn).toBeTruthy();
      expect(btn!.disabled).toBe(true);
    });
    return this;
  }

  /**
   * Assert the display label text (e.g. "Showing 1-10 of 25 records").
   */
  async expectDisplayLabel(pattern: string | RegExp) {
    await waitFor(() => {
      const text = this.paginationEl?.textContent ?? "";
      if (typeof pattern === "string") {
        expect(text).toContain(pattern);
      } else {
        expect(text).toMatch(pattern);
      }
    });
    return this;
  }

  // ── No-crash assertion ───────────────────────────────────────────────────

  /**
   * Assert no React error boundary or "Something went wrong" UI is in the DOM.
   * Catches the TypeError: Cannot convert undefined or null to object crash.
   */
  async expectNoCrash() {
    await waitFor(() => {
      const errorBoundary = document.querySelector(
        "[data-testid='error-boundary']"
      );
      const errorText = document.body.textContent ?? "";
      expect(
        errorBoundary,
        "An error boundary activated — component crashed"
      ).toBeNull();
      expect(
        errorText,
        "Expected no 'Something went wrong' text"
      ).not.toContain("Something went wrong");
    });
    return this;
  }
}
