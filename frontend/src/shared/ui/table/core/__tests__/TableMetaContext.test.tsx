import React from "react";

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TableMetaProvider, useTableMeta } from "../TableMetaContext";

function wrapper(meta: { id: string }) {
  return ({ children }: { children: React.ReactNode }) => (
    <TableMetaProvider meta={meta}>{children}</TableMetaProvider>
  );
}

describe("TableMetaContext", () => {
  it("provides resolved meta to children", () => {
    const { result } = renderHook(() => useTableMeta(), {
      wrapper: wrapper({ id: "orders" }),
    });

    expect(result.current.id).toBe("orders");
    expect(result.current.url).toBeDefined();
    expect(result.current.features).toBeDefined();
    expect(result.current.pagination).toBeDefined();
  });

  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useTableMeta());
    }).toThrow("useTableMeta must be used inside a <ZenithTable> component");
  });

  it("resolves meta with all required fields", () => {
    const { result } = renderHook(() => useTableMeta(), {
      wrapper: wrapper({ id: "users" }),
    });

    expect(result.current.id).toBe("users");
    expect(result.current.url.keys).toBeDefined();
    expect(result.current.features.urlSync).toBe(true);
    expect(result.current.pagination.showPageNumbers).toBe(true);
    expect(result.current.columns).toEqual([]);
  });

  it("memoizes resolved meta based on meta.id", () => {
    const { result, rerender } = renderHook(() => useTableMeta(), {
      wrapper: wrapper({ id: "orders" }),
    });

    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
