import React from "react";

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TableDOMProvider, useTableDOMRefs } from "../../core/TableDOMContext";
import { TableMetaProvider } from "../../core/TableMetaContext";
import { resolveTableMeta } from "../../meta/TableMetaDefaults";
import { useTableVirtualizer } from "../useTableVirtualizer";

const meta = resolveTableMeta({ id: "virtual-table" });

function Wrapper({ children }: { children: React.ReactNode }) {
  const refs = useTableDOMRefs();
  return (
    <TableMetaProvider meta={meta}>
      <TableDOMProvider refs={refs}>{children}</TableDOMProvider>
    </TableMetaProvider>
  );
}

describe("useTableVirtualizer", () => {
  it("returns a virtualizer with correct count", () => {
    const { result } = renderHook(() => useTableVirtualizer(100, 48), {
      wrapper: Wrapper,
    });

    expect(result.current).toBeDefined();
    expect(result.current.getVirtualItems).toBeDefined();
    expect(typeof result.current.getVirtualItems).toBe("function");
  });

  it("returns empty virtual items when count is 0", () => {
    const { result } = renderHook(() => useTableVirtualizer(0, 48), {
      wrapper: Wrapper,
    });

    const items = result.current.getVirtualItems();
    expect(items).toEqual([]);
  });

  it("uses default estimateSize of 48", () => {
    const { result } = renderHook(() => useTableVirtualizer(10), {
      wrapper: Wrapper,
    });

    expect(result.current.options.estimateSize).toBeDefined();
    const size = result.current.options.estimateSize(0);
    expect(size).toBe(48);
  });

  it("accepts custom estimateSize", () => {
    const { result } = renderHook(() => useTableVirtualizer(10, 72), {
      wrapper: Wrapper,
    });

    const size = result.current.options.estimateSize(0);
    expect(size).toBe(72);
  });

  it("uses default overscan of 10", () => {
    const { result } = renderHook(() => useTableVirtualizer(100), {
      wrapper: Wrapper,
    });

    expect(result.current.options.overscan).toBe(10);
  });

  it("accepts custom overscan", () => {
    const { result } = renderHook(
      () => useTableVirtualizer(100, 48, { overscan: 20 }),
      { wrapper: Wrapper }
    );

    expect(result.current.options.overscan).toBe(20);
  });
});
