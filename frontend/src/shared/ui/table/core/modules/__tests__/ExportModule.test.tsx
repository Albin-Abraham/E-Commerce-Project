import React from "react";

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TableEngineContext } from "../../TableEngineContext";
import { TablePhysicsProvider } from "../../TablePhysicsContext";
import { useTablePhysics } from "../../TablePhysicsContext";
import { ExportModule } from "../ExportModule";

function createMockRef() {
  return { current: null } as React.RefObject<HTMLDivElement | null>;
}

function createMockTable(rows: unknown[] = []) {
  return {
    getPrePaginationRowModel: vi.fn().mockReturnValue({
      rows: rows.map((r, i) => ({
        id: String(i),
        original: r,
      })),
    }),
    getColumn: vi.fn().mockReturnValue(undefined),
    resetColumnFilters: vi.fn(),
    setGlobalFilter: vi.fn(),
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

const originalCreateElement = document.createElement.bind(document);

describe("ExportModule", () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURLSpy = vi.fn().mockReturnValue("blob:mock-url");
    revokeObjectURLSpy = vi.fn();
    clickSpy = vi.fn();

    vi.stubGlobal("URL", {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    });

    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        const el = {
          click: clickSpy,
          href: "",
          download: "",
          style: {} as Record<string, string>,
          setAttribute: vi.fn(),
          getAttribute: vi.fn().mockReturnValue(""),
        } as unknown as HTMLAnchorElement;
        return el;
      }
      return originalCreateElement(tag);
    });

    // Mock body.appendChild/removeChild so downloadCSV/downloadBlob work
    vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("useExport", () => {
    it("initializes with loading=false and error=null", () => {
      const table = createMockTable([]);
      const { result } = renderHook(() => ExportModule.useExport(), {
        wrapper: ({ children }) => <Wrapper engine={table}>{children}</Wrapper>,
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("execute exports all rows when no selection", async () => {
      const data = [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
      ];
      const table = createMockTable(data);
      const { result } = renderHook(
        () => ExportModule.useExport({ enabled: true }),
        {
          wrapper: ({ children }) => (
            <Wrapper engine={table}>{children}</Wrapper>
          ),
        }
      );

      await result.current.execute();

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
    });

    it("execute calls onSuccess on completion", async () => {
      const onSuccess = vi.fn();
      const table = createMockTable([{ id: "1", name: "Alice" }]);
      const { result } = renderHook(
        () => ExportModule.useExport({ enabled: true, onSuccess }),
        {
          wrapper: ({ children }) => (
            <Wrapper engine={table}>{children}</Wrapper>
          ),
        }
      );

      await result.current.execute();

      expect(onSuccess).toHaveBeenCalled();
    });

    it("execute does nothing when disabled", async () => {
      const table = createMockTable([{ id: "1", name: "Alice" }]);
      const { result } = renderHook(
        () => ExportModule.useExport({ enabled: false }),
        {
          wrapper: ({ children }) => (
            <Wrapper engine={table}>{children}</Wrapper>
          ),
        }
      );

      await result.current.execute();

      expect(createObjectURLSpy).not.toHaveBeenCalled();
    });

    it("execute exports as JSON when format is json", async () => {
      const table = createMockTable([{ id: "1", name: "Alice" }]);
      const { result } = renderHook(
        () => ExportModule.useExport({ enabled: true, format: "json" }),
        {
          wrapper: ({ children }) => (
            <Wrapper engine={table}>{children}</Wrapper>
          ),
        }
      );

      await result.current.execute();

      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it("execute applies transform function", async () => {
      const transform = vi.fn().mockReturnValue({ label: "transformed" });
      const table = createMockTable([{ id: "1", name: "Alice" }]);
      const { result } = renderHook(
        () => ExportModule.useExport({ enabled: true, transform }),
        {
          wrapper: ({ children }) => (
            <Wrapper engine={table}>{children}</Wrapper>
          ),
        }
      );

      await result.current.execute();

      expect(transform).toHaveBeenCalledWith({ id: "1", name: "Alice" }, 0, [
        { id: "1", name: "Alice" },
      ]);
    });

    it("matches selection by TanStack row.id, not original.id", async () => {
      const transform = vi.fn((r: unknown) => r as Record<string, unknown>);
      const data = [
        { uuid: "aaa", name: "Alice" },
        { uuid: "bbb", name: "Bob" },
      ];
      const table = createMockTable(data);
      const { result } = renderHook(
        () => {
          const exp = ExportModule.useExport({ enabled: true, transform });
          const setBulkSelection = useTablePhysics((s) => s.setBulkSelection);
          return { ...exp, setBulkSelection };
        },
        {
          wrapper: ({ children }) => (
            <Wrapper engine={table}>{children}</Wrapper>
          ),
        }
      );

      act(() => {
        result.current.setBulkSelection(["0"]);
      });

      await result.current.execute();
      expect(transform).toHaveBeenCalledTimes(1);
      expect(transform).toHaveBeenCalledWith(
        { uuid: "aaa", name: "Alice" },
        0,
        [{ uuid: "aaa", name: "Alice" }]
      );
    });
  });
});
