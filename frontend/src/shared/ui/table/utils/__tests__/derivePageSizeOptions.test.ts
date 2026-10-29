import { describe, expect, it } from "vitest";

import { derivePageSizeOptions } from "../derivePageSizeOptions";

describe("derivePageSizeOptions", () => {
  it("returns base options when totalCount is <= 0", () => {
    expect(derivePageSizeOptions(0)).toEqual([10, 25, 50, 100]);
    expect(derivePageSizeOptions(-10)).toEqual([10, 25, 50, 100]);
  });

  it("derives [5] when totalCount = 5", () => {
    expect(derivePageSizeOptions(5)).toEqual([5]);
  });

  it("derives [10, 25] when totalCount = 25", () => {
    expect(derivePageSizeOptions(25)).toEqual([10, 25]);
  });

  it("derives [10, 25, 50, 80] when totalCount = 80", () => {
    expect(derivePageSizeOptions(80)).toEqual([10, 25, 50, 80]);
  });

  it("derives [10, 25, 50, 100] when totalCount = 150", () => {
    expect(derivePageSizeOptions(150)).toEqual([10, 25, 50, 100]);
  });

  it("supports custom baseOptions arrays", () => {
    expect(derivePageSizeOptions(42, [5, 15, 30, 60])).toEqual([5, 15, 30, 42]);
  });
});
