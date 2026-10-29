import React from "react";

import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { resolveTableMeta } from "../../../meta/TableMetaDefaults";
import { ZenithTable } from "../../../ui/ZenithTable";
import { TableEngineContext } from "../../TableEngineContext";
import { TablePhysicsProvider } from "../../TablePhysicsContext";
import { SelectionModule } from "../SelectionModule";

function createMockRef() {
  return { current: null } as React.RefObject<HTMLDivElement | null>;
}

function createMockTable(overrides: Record<string, unknown> = {}) {
  return {
    getRowModel: vi.fn().mockReturnValue({ rows: [] }),
    getColumn: vi.fn().mockReturnValue(undefined),
    ...overrides,
  } as Record<string, unknown>;
}

function Wrapper({
  children,
  engine,
}: {
  children: React.ReactNode;
  engine?: Record<string, unknown>;
}) {
  return (
    <TablePhysicsProvider containerRef={createMockRef()}>
      <TableEngineContext.Provider
        value={{ engine: (engine ?? createMockTable()) as never }}
      >
        {children}
      </TableEngineContext.Provider>
    </TablePhysicsProvider>
  );
}

describe("SelectionModule", () => {
  describe("columnDef", () => {
    it("returns column def with id _select", () => {
      const def = SelectionModule.columnDef();
      expect(def.id).toBe("_select");
    });

    it("column has size 48", () => {
      const def = SelectionModule.columnDef();
      expect(def.size).toBe(48);
    });

    it("column has sorting disabled", () => {
      const def = SelectionModule.columnDef();
      expect(def.enableSorting).toBe(false);
    });

    it("column has resizing disabled", () => {
      const def = SelectionModule.columnDef();
      expect(def.enableResizing).toBe(false);
    });
  });

  describe("useSelection", () => {
    it("returns initial selection state", () => {
      const { result } = renderHook(() => SelectionModule.useSelection(), {
        wrapper: ({ children }) => <Wrapper>{children}</Wrapper>,
      });

      expect(result.current.selectedIds).toEqual([]);
      expect(result.current.selectionMode).toBe("MANUAL");
    });

    it("toggle selects a row", () => {
      const { result } = renderHook(() => SelectionModule.useSelection(), {
        wrapper: ({ children }) => <Wrapper>{children}</Wrapper>,
      });

      act(() => {
        result.current.toggle("row-1");
      });

      expect(result.current.isSelected("row-1")).toBe(true);
      expect(result.current.selectedIds).toContain("row-1");
    });

    it("clearAll resets selection", () => {
      const { result } = renderHook(() => SelectionModule.useSelection(), {
        wrapper: ({ children }) => <Wrapper>{children}</Wrapper>,
      });

      act(() => {
        result.current.toggle("row-1");
      });

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.selectedIds).toEqual([]);
    });

    it("selectAll sets mode to ALL", () => {
      const { result } = renderHook(() => SelectionModule.useSelection(), {
        wrapper: ({ children }) => <Wrapper>{children}</Wrapper>,
      });

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectionMode).toBe("ALL");
    });

    it("does not emit onSelectionChange with an empty array in ALL mode", async () => {
      const onSelectionChange = vi.fn();
      const { result } = renderHook(
        () =>
          SelectionModule.useSelection({ enabled: true, onSelectionChange }),
        { wrapper: ({ children }) => <Wrapper>{children}</Wrapper> }
      );

      act(() => {
        result.current.toggle("row-1");
      });
      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenCalledWith(["row-1"]);
      });
      onSelectionChange.mockClear();

      act(() => {
        result.current.selectAll();
      });

      await waitFor(() => {
        expect(result.current.selectionMode).toBe("ALL");
      });
      expect(onSelectionChange).not.toHaveBeenCalled();
    });
  });

  describe("header checkbox cycle", () => {
    it("empty → PAGE (checked) → ALL; exclude unchecks the cell", () => {
      const engine = {
        getRowModel: vi
          .fn()
          .mockReturnValue({ rows: [{ id: "1" }, { id: "2" }] }),
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
      };
      const meta = resolveTableMeta({
        id: "sel-cycle",
        features: { urlSync: false },
      });

      render(
        <ZenithTable engine={engine as never} meta={meta}>
          <SelectionModule.Header />
          <SelectionModule.Cell rowId="1" />
          <SelectionModule.Cell rowId="2" />
        </ZenithTable>
      );

      const header = screen.getByTestId("table-select-all");
      expect(header).not.toBeChecked();

      fireEvent.click(header);
      expect(header).toBeChecked();
      expect(screen.getByTestId("table-select-1")).toBeChecked();

      fireEvent.click(header);
      expect(header).toBeChecked();
      expect(screen.getByTestId("table-select-1")).toBeChecked();

      fireEvent.click(screen.getByTestId("table-select-1"));
      expect(screen.getByTestId("table-select-1")).not.toBeChecked();
      expect(header).toHaveAttribute("aria-checked", "mixed");
    });
  });
});
