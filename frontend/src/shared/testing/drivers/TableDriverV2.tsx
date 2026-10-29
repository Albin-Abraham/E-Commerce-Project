import type { ColumnDef, TableMeta } from "@tanstack/react-table";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ZenithTable, useTableController } from "@ui/table";
import { expect as vitestExpect } from "vitest";

import { renderWithProviders } from "../test-utils";
import { createQueryCapability } from "../capabilities/queries";
import { createInteractionCapability } from "../capabilities/interactions";
import { createAssertionCapability } from "../capabilities/assertions";
import { createAsyncCapability } from "../capabilities/async";
import { createDiagnosticsCapability } from "../capabilities/diagnostics";
import { createIsolationCapability } from "../infrastructure/isolation";

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

export const SIMPLE_META: TableMeta<any> = {
  id: "test-table",
  features: { urlSync: false },
  pagination: {
    showPageNumbers: true,
    showPageSizeSelector: false,
    showFirstLast: true,
    maxVisiblePages: 7,
  },
};

function TableHarness({
  data,
  meta = SIMPLE_META,
  columns = SIMPLE_COLUMNS as ColumnDef<SimpleRow>[],
  fetcher,
  totalCount,
}: {
  data: SimpleRow[];
  meta?: TableMeta<any>;
  columns?: ColumnDef<SimpleRow>[];
  fetcher?: (params: any) => Promise<any>;
  totalCount?: number;
}) {
  const ctrl = useTableController({
    meta,
    columns,
    source: fetcher ? { type: "server", fetcher } : { type: "client", data },
    totalCount,
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

export interface TableDriverOptions {
  container: HTMLElement;
  user?: ReturnType<typeof userEvent.setup>;
  testId?: string;
  testName?: string;
}

export interface TableDriver {
  container: HTMLElement;
  user: ReturnType<typeof userEvent.setup>;
  testId: string;
  testName: string;
  
  query: ReturnType<typeof createQueryCapability>;
  interact: ReturnType<typeof createInteractionCapability>;
  expect: ReturnType<typeof createAssertionCapability>;
  wait: ReturnType<typeof createAsyncCapability>;
  diagnose: ReturnType<typeof createDiagnosticsCapability>;
  isolate: ReturnType<typeof createIsolationCapability>;
  
  expectMounted: () => Promise<TableDriver>;
  expectRowCount: (n: number) => Promise<TableDriver>;
  expectHeader: (label: string) => Promise<TableDriver>;
  expectCellValue: (value: string) => Promise<TableDriver>;
  expectPaginationVisible: () => Promise<TableDriver>;
  expectPaginationHidden: () => Promise<TableDriver>;
  goToNextPage: () => Promise<TableDriver>;
  goToPrevPage: () => Promise<TableDriver>;
  goToPage: (pageNum: number) => Promise<TableDriver>;
  expectNextDisabled: () => Promise<TableDriver>;
  expectPrevDisabled: () => Promise<TableDriver>;
  expectDisplayLabel: (pattern: string | RegExp) => Promise<TableDriver>;
  expectNoCrash: () => Promise<TableDriver>;
}

export function createTableDriver(options: TableDriverOptions): TableDriver {
  const { container, user = userEvent.setup(), testId = "table-test", testName = "Table Test" } = options;
  
  const query = createQueryCapability(container);
  const interact = createInteractionCapability(container);
  const expect = createAssertionCapability(container);
  const wait = createAsyncCapability(container);
  const diagnose = createDiagnosticsCapability(container);
  const isolate = createIsolationCapability();
  
  const driver: TableDriver = {
    container,
    user,
    testId,
    testName,
    query,
    interact,
    expect,
    wait,
    diagnose,
    isolate,
    
    async expectMounted() {
      await wait.waitFor(() => {
        vitestExpect(query.querySelector("[data-table-root]").element).toBeTruthy();
      });
      return driver;
    },
    
    async expectRowCount(n: number) {
      await wait.waitFor(() => {
        const rows = Array.from(container.querySelectorAll("tbody tr[data-table-row]")) as HTMLElement[];
        vitestExpect(rows).toHaveLength(n);
      });
      return driver;
    },
    
    async expectHeader(label: string) {
      await wait.waitFor(() => {
        const headerCells = Array.from(container.querySelectorAll("thead th")) as HTMLElement[];
        const found = headerCells.some((th) => th.textContent?.trim().includes(label));
        vitestExpect(found, `Header "${label}" not found`).toBe(true);
      });
      return driver;
    },
    
    async expectCellValue(value: string) {
      await wait.waitFor(() => {
        const cells = Array.from(container.querySelectorAll("tbody td"));
        const found = cells.some((td) => td.textContent?.trim() === value);
        vitestExpect(found, `Cell value "${value}" not found in table`).toBe(true);
      });
      return driver;
    },
    
    async expectPaginationVisible() {
      await wait.waitFor(() => {
        vitestExpect(query.querySelector("[data-table-pagination]").element).toBeTruthy();
      });
      return driver;
    },
    
    async expectPaginationHidden() {
      await wait.waitFor(() => {
        const paginationEl = query.querySelector("[data-table-pagination]").element;
        const pageNavGroup = paginationEl?.querySelector('[role="group"]');
        vitestExpect(!paginationEl || !pageNavGroup, "Expected pagination to be hidden").toBe(true);
      });
      return driver;
    },
    
    async goToNextPage() {
      const btn = container.querySelector("[data-testid='table-pagination-next']") as HTMLButtonElement | null;
      vitestExpect(btn, "Next page button not found").toBeTruthy();
      await interact.click(btn!);
      return driver;
    },
    
    async goToPrevPage() {
      const btn = container.querySelector("[data-testid='table-pagination-prev']") as HTMLButtonElement | null;
      vitestExpect(btn, "Previous page button not found").toBeTruthy();
      await interact.click(btn!);
      return driver;
    },
    
    async goToPage(pageNum: number) {
      const btn = container.querySelector(`[data-testid='table-pagination-page-${pageNum}']`) as HTMLButtonElement | null;
      vitestExpect(btn, `Page ${pageNum} button not found`).toBeTruthy();
      await interact.click(btn!);
      return driver;
    },
    
    async expectNextDisabled() {
      await wait.waitFor(() => {
        const btn = container.querySelector("[data-testid='table-pagination-next']") as HTMLButtonElement | null;
        vitestExpect(btn).toBeTruthy();
        vitestExpect(btn!.disabled).toBe(true);
      });
      return driver;
    },
    
    async expectPrevDisabled() {
      await wait.waitFor(() => {
        const btn = container.querySelector("[data-testid='table-pagination-prev']") as HTMLButtonElement | null;
        vitestExpect(btn).toBeTruthy();
        vitestExpect(btn!.disabled).toBe(true);
      });
      return driver;
    },
    
    async expectDisplayLabel(pattern: string | RegExp) {
      await wait.waitFor(() => {
        const paginationEl = query.querySelector("[data-table-pagination]").element;
        const text = paginationEl?.textContent ?? "";
        if (typeof pattern === "string") {
          vitestExpect(text).toContain(pattern);
        } else {
          vitestExpect(text).toMatch(pattern);
        }
      });
      return driver;
    },
    
    async expectNoCrash() {
      await wait.waitFor(() => {
        const errorBoundary = document.querySelector("[data-testid='error-boundary']");
        const errorText = document.body.textContent ?? "";
        vitestExpect(errorBoundary, "An error boundary activated — component crashed").toBeNull();
        vitestExpect(errorText, "Expected no 'Something went wrong' text").not.toContain("Something went wrong");
      });
      return driver;
    },
  };
  
  return driver;
}

export interface RenderTableOptions {
  data: SimpleRow[];
  meta?: TableMeta<any>;
  columns?: ColumnDef<SimpleRow>[];
  fetcher?: (params: any) => Promise<any>;
  totalCount?: number;
  testId?: string;
  testName?: string;
}

export async function renderTable(options: RenderTableOptions): Promise<{ driver: TableDriver; container: HTMLElement; user: ReturnType<typeof userEvent.setup> }> {
  const user = userEvent.setup();
  
  const { container } = renderWithProviders(
    <TableHarness
      data={options.data}
      meta={options.meta}
      columns={options.columns}
      fetcher={options.fetcher}
      totalCount={options.totalCount}
    />
  );
  
  await waitFor(() => {
    if (!container.querySelector("[data-table-root]")) {
      throw new Error("ZenithTable root not mounted yet");
    }
  });
  
  const driver = createTableDriver({
    container,
    user,
    testId: options.testId,
    testName: options.testName,
  });
  
  return { driver, container, user };
}

export function createTableDriverFactory() {
  return {
    create: createTableDriver,
    renderTable,
  };
}

export const tableDriverFactory = createTableDriverFactory();