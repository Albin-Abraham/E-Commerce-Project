import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@testing/test-utils";
import { describe, expect, it, vi } from "vitest";

import { resolveTableMeta } from "../../../meta/TableMetaDefaults";
import { ZenithTable } from "../../ZenithTable";

function createMockEngine(overrides: Record<string, unknown> = {}) {
  return {
    getRowModel: vi.fn().mockReturnValue({ rows: [] }),
    getHeaderGroups: vi.fn().mockReturnValue([]),
    getAllColumns: vi.fn().mockReturnValue([]),
    getState: vi.fn().mockReturnValue({
      sorting: [],
      pagination: { pageIndex: 0, pageSize: 10 },
      columnFilters: [],
      globalFilter: "",
    }),
    getPrePaginationRowModel: vi.fn().mockReturnValue({ rows: [] }),
    getPageCount: vi.fn().mockReturnValue(1),
    getCanPreviousPage: vi.fn().mockReturnValue(false),
    getCanNextPage: vi.fn().mockReturnValue(false),
    setGlobalFilter: vi.fn(),
    resetColumnFilters: vi.fn(),
    ...overrides,
  };
}

const meta = resolveTableMeta({ id: "users", features: { urlSync: false } });

describe("ZenithTableToolbar", () => {
  it("Enter applies search via engine.setGlobalFilter, not pathname_search", async () => {
    const setGlobalFilter = vi.fn();
    const engine = createMockEngine({ setGlobalFilter });
    const user = userEvent.setup();

    renderWithProviders(
      <ZenithTable engine={engine as never} meta={meta}>
        <ZenithTable.Toolbar />
      </ZenithTable>
    );

    const input = await screen.findByPlaceholderText(/Filter records/);
    await user.type(input, "alice");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(setGlobalFilter).toHaveBeenCalledWith("alice");
    });
    expect(window.location.search).not.toMatch(/_search=/);
    expect(window.location.search).not.toMatch(/(?:^|[?&])search=/);
  });

  it("Enter calls search() when gate is manual", async () => {
    const setGlobalFilter = vi.fn();
    const search = vi.fn();
    const engine = createMockEngine({ setGlobalFilter });
    const user = userEvent.setup();

    renderWithProviders(
      <ZenithTable
        engine={engine as never}
        meta={meta}
        gate="manual"
        search={search}
      >
        <ZenithTable.Toolbar />
      </ZenithTable>
    );

    const input = await screen.findByPlaceholderText(/Filter records/);
    await user.type(input, "alice");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(setGlobalFilter).toHaveBeenCalledWith("alice");
    });
    expect(search).toHaveBeenCalled();
  });

  it("renders exportBtn when chrome.exportBtn and serverExport are set", () => {
    const engine = createMockEngine();
    renderWithProviders(
      <ZenithTable
        engine={engine as never}
        meta={meta}
        chrome={{ exportBtn: true }}
        serverExport={{
          createExport: vi.fn().mockResolvedValue({ task_id: "t1" }),
          getStatus: vi
            .fn()
            .mockResolvedValue({ status: "completed", progress: 100 }),
          downloadFile: vi.fn(),
        }}
      >
        <ZenithTable.Toolbar />
      </ZenithTable>
    );
    expect(screen.getByTestId("table-export-btn")).toBeInTheDocument();
  });

  it("renders filterStatusBadge when there is an active search", () => {
    const engine = createMockEngine({
      getState: vi.fn().mockReturnValue({
        sorting: [],
        pagination: { pageIndex: 0, pageSize: 10 },
        columnFilters: [],
        globalFilter: "alice",
      }),
    });
    renderWithProviders(
      <ZenithTable
        engine={engine as never}
        meta={meta}
        chrome={{ filterStatusBadge: true }}
      >
        <ZenithTable.Toolbar />
      </ZenithTable>
    );
    expect(screen.getByTestId("table-filter-status-badge")).toHaveTextContent(
      "1 filter"
    );
  });
});
