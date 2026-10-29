import { describe, expect, it } from "vitest";

import type { PaginationContext } from "../../types";
import { resolvePaginationLabel } from "../resolvePaginationLabel";

const ctx: PaginationContext = {
  from: 1,
  to: 10,
  total: 100,
  page: 1,
  totalPages: 10,
  pageSize: 10,
  selectedCount: 3,
};

describe("resolvePaginationLabel", () => {
  it("returns fallback when label is undefined", () => {
    expect(resolvePaginationLabel(undefined, "Fallback", ctx)).toBe("Fallback");
  });

  it("returns fallback when label is empty string", () => {
    expect(resolvePaginationLabel("", "Fallback", ctx)).toBe("Fallback");
  });

  it("resolves string template with placeholders", () => {
    const result = resolvePaginationLabel(
      "Showing {from}-{to} of {total} records",
      "",
      ctx
    );
    expect(result).toBe("Showing 1-10 of 100 records");
  });

  it("resolves function label", () => {
    const fn = (c: PaginationContext) => `Page ${c.page} of ${c.totalPages}`;
    expect(resolvePaginationLabel(fn, "", ctx)).toBe("Page 1 of 10");
  });

  it("returns unknown placeholders as-is", () => {
    const result = resolvePaginationLabel("Count: {unknownKey}", "", ctx);
    expect(result).toBe("Count: {unknownKey}");
  });

  it("formats numbers with toLocaleString", () => {
    const bigCtx: PaginationContext = {
      ...ctx,
      from: 1,
      to: 1000,
      total: 10000,
    };
    const result = resolvePaginationLabel("{total}", "", bigCtx);
    expect(result).toBe(bigCtx.total.toLocaleString());
  });
});
