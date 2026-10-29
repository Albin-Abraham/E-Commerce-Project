import React from "react";

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TableDOMRefs } from "@ui/table/types";
import {
  TableDOMProvider,
  buildTableHandle,
  useTableDOM,
  useTableDOMRefs,
} from "../TableDOMContext";

function createMockRefs(): TableDOMRefs {
  return {
    containerRef: { current: null },
    scrollerRef: { current: null },
    tableRef: { current: null },
    headerRef: { current: null },
    bodyRef: { current: null },
    paginationRef: { current: null },
  };
}

function DOMWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TableDOMProvider refs={createMockRefs() as never}>
      {children}
    </TableDOMProvider>
  );
}

describe("TableDOMContext", () => {
  it("throws when useTableDOM used outside provider", () => {
    expect(() => {
      renderHook(() => useTableDOM());
    }).toThrow("useTableDOM must be used inside a <ZenithTable> component");
  });

  it("provides DOM refs to children", () => {
    const { result } = renderHook(() => useTableDOM(), {
      wrapper: DOMWrapper,
    });

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.scrollerRef).toBeDefined();
    expect(result.current.tableRef).toBeDefined();
    expect(result.current.headerRef).toBeDefined();
    expect(result.current.bodyRef).toBeDefined();
    expect(result.current.paginationRef).toBeDefined();
  });

  it("useTableDOMRefs returns stable refs", () => {
    const { result, rerender } = renderHook(() => useTableDOMRefs());

    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("useTableDOMRefs creates all 6 refs", () => {
    const { result } = renderHook(() => useTableDOMRefs());

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.scrollerRef).toBeDefined();
    expect(result.current.tableRef).toBeDefined();
    expect(result.current.headerRef).toBeDefined();
    expect(result.current.bodyRef).toBeDefined();
    expect(result.current.paginationRef).toBeDefined();
  });

  describe("buildTableHandle", () => {
    it("returns handle with expected methods", () => {
      const refs = createMockRefs();
      const handle = buildTableHandle(refs as never);

      expect(typeof handle.scrollToTop).toBe("function");
      expect(typeof handle.scrollToRow).toBe("function");
      expect(typeof handle.focusFirstCell).toBe("function");
      expect(typeof handle.getBodyElement).toBe("function");
      expect(typeof handle.getContainerElement).toBe("function");
    });

    it("getBodyElement returns bodyRef.current", () => {
      const refs = createMockRefs();
      const mockBody = document.createElement("tbody");
      refs.bodyRef = { current: mockBody };
      const handle = buildTableHandle(refs as never);

      expect(handle.getBodyElement()).toBe(mockBody);
    });

    it("getContainerElement returns containerRef.current", () => {
      const refs = createMockRefs();
      const mockContainer = document.createElement("div");
      refs.containerRef = { current: mockContainer };
      const handle = buildTableHandle(refs as never);

      expect(handle.getContainerElement()).toBe(mockContainer);
    });

    it("scrollToTop does not throw when scrollerRef is null", () => {
      const refs = createMockRefs();
      const handle = buildTableHandle(refs as never);

      expect(() => handle.scrollToTop()).not.toThrow();
    });

    it("scrollToRow does not throw when row not found", () => {
      const refs = createMockRefs();
      refs.bodyRef = { current: document.createElement("tbody") };
      const handle = buildTableHandle(refs as never);

      expect(() => handle.scrollToRow("nonexistent")).not.toThrow();
    });

    it("focusFirstCell does not throw when body is empty", () => {
      const refs = createMockRefs();
      refs.bodyRef = { current: document.createElement("tbody") };
      const handle = buildTableHandle(refs as never);

      expect(() => handle.focusFirstCell()).not.toThrow();
    });
  });
});
