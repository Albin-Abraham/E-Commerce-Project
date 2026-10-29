import React, { useEffect } from "react";

import { render, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TableEngineContext } from "../../TableEngineContext";
import {
  TablePhysicsProvider,
  useTablePhysics,
} from "../../TablePhysicsContext";
import { ServerExportModule } from "../ServerExportModule";

function createMockRef() {
  return { current: null } as React.RefObject<HTMLDivElement | null>;
}

function createMockEngine() {
  return {
    getPrePaginationRowModel: vi.fn().mockReturnValue({
      rows: [{ id: "1" }, { id: "2" }],
    }),
    getState: vi.fn().mockReturnValue({
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [],
      columnFilters: [],
      globalFilter: "",
    }),
  };
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <TablePhysicsProvider containerRef={createMockRef()}>
      <TableEngineContext.Provider
        value={{ engine: createMockEngine() as never }}
      >
        {children}
      </TableEngineContext.Provider>
    </TablePhysicsProvider>
  );
}

describe("ServerExportModule", () => {
  it("mounts without referencing an undefined table identifier", () => {
    expect(() => {
      renderHook(
        () =>
          ServerExportModule.useServerExport({
            enabled: true,
            createExport: vi.fn(),
            getStatus: vi.fn(),
            downloadFile: vi.fn(),
          }),
        { wrapper: Wrapper }
      );
    }).not.toThrow();
  });

  it("resolveExportParams via executeExport does not throw", async () => {
    const createExport = vi
      .fn()
      .mockResolvedValue({ task_id: "t1", status: "completed" });
    const { result } = renderHook(
      () =>
        ServerExportModule.useServerExport({
          enabled: true,
          createExport,
          getStatus: vi.fn(),
          downloadFile: vi.fn(),
        }),
      { wrapper: Wrapper }
    );

    await result.current.executeExport("csv", "all");
    expect(createExport).toHaveBeenCalled();
  });

  it("passes live filters and search into createExport", async () => {
    const engine = {
      getPrePaginationRowModel: vi
        .fn()
        .mockReturnValue({ rows: [{ id: "1" }] }),
      getState: vi.fn().mockReturnValue({
        pagination: { pageIndex: 2, pageSize: 25 },
        sorting: [{ id: "name", desc: false }],
        columnFilters: [{ id: "role", value: "admin" }],
        globalFilter: "john",
      }),
    };
    const createExport = vi
      .fn()
      .mockResolvedValue({ task_id: "t1", status: "completed" });

    function FilterWrapper({ children }: { children: React.ReactNode }) {
      return (
        <TablePhysicsProvider containerRef={createMockRef()}>
          <TableEngineContext.Provider value={{ engine: engine as never }}>
            {children}
          </TableEngineContext.Provider>
        </TablePhysicsProvider>
      );
    }

    const { result } = renderHook(
      () =>
        ServerExportModule.useServerExport({
          enabled: true,
          createExport,
          getStatus: vi.fn(),
          downloadFile: vi.fn(),
        }),
      { wrapper: FilterWrapper }
    );

    await result.current.executeExport("csv", "all");
    expect(createExport).toHaveBeenCalledWith(
      expect.objectContaining({
        ids: "select_all",
        search: "john",
        filters: { role: "admin" },
      })
    );
    const payload = createExport.mock.calls[0][0];
    expect(payload.page).toBeUndefined();
    expect(payload.page_size).toBeUndefined();
  });

  it("sends select_all plus excluded_ids for ALL + selected scope", async () => {
    const engine = createMockEngine();
    const createExport = vi
      .fn()
      .mockResolvedValue({ task_id: "t1", status: "completed" });

    function SeedAllAndExclude() {
      const setSelectionMode = useTablePhysics((s) => s.setSelectionMode);
      const toggleSelection = useTablePhysics((s) => s.toggleSelection);
      useEffect(() => {
        setSelectionMode("ALL");
        toggleSelection("ex-1", true);
      }, [setSelectionMode, toggleSelection]);
      return null;
    }

    function Harness() {
      const api = ServerExportModule.useServerExport({
        enabled: true,
        createExport,
        getStatus: vi.fn(),
        downloadFile: vi.fn(),
      });
      const selectionMode = useTablePhysics((s) => s.selectionMode);
      const excludedRows = useTablePhysics((s) => s.excludedRows);
      if (selectionMode !== "ALL" || !excludedRows.has("ex-1")) return null;
      return (
        <button
          type="button"
          data-testid="run-export"
          onClick={() => void api.executeExport("csv", "selected")}
        >
          export
        </button>
      );
    }

    const { getByTestId } = render(
      <TablePhysicsProvider containerRef={createMockRef()}>
        <TableEngineContext.Provider value={{ engine: engine as never }}>
          <SeedAllAndExclude />
          <Harness />
        </TableEngineContext.Provider>
      </TablePhysicsProvider>
    );

    await waitFor(() => {
      getByTestId("run-export").click();
    });

    await waitFor(() => {
      expect(createExport).toHaveBeenCalledWith(
        expect.objectContaining({
          ids: "select_all",
          excluded_ids: "ex-1",
        })
      );
    });
  });
});
