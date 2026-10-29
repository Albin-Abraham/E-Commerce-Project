import { describe, expect, it } from "vitest";

import { getPageNumbers, getPageRange } from "../PaginationHelpers";

describe("PaginationHelpers", () => {
  describe("getPageNumbers", () => {
    it("returns empty array when total is 0", () => {
      expect(getPageNumbers(1, 0)).toEqual([]);
    });

    it("returns empty array when total is negative", () => {
      expect(getPageNumbers(1, -5)).toEqual([]);
    });

    it("returns [1] when total is 1", () => {
      expect(getPageNumbers(1, 1)).toEqual([1]);
    });

    it("returns all pages when total <= maxVisible", () => {
      expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it("returns all pages when total equals maxVisible", () => {
      expect(getPageNumbers(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it("shows ellipsis on both sides when current is in middle", () => {
      const result = getPageNumbers(5, 20);
      expect(result).toEqual([1, "...", 3, 4, 5, 6, 7, "...", 20]);
    });

    it("shows no leading ellipsis when current is near start", () => {
      const result = getPageNumbers(2, 20);
      expect(result).toEqual([1, 2, 3, 4, "...", 20]);
    });

    it("shows no trailing ellipsis when current is near end", () => {
      const result = getPageNumbers(19, 20);
      expect(result).toEqual([1, "...", 17, 18, 19, 20]);
    });

    it("starts with first page and ends with last page", () => {
      const result = getPageNumbers(10, 50);
      expect(result[0]).toBe(1);
      expect(result[result.length - 1]).toBe(50);
    });

    it("respects custom maxVisible", () => {
      const result = getPageNumbers(5, 20, 5);
      expect(result).toEqual([1, "...", 4, 5, 6, "...", 20]);
    });

    it("handles maxVisible of 3 (minimum)", () => {
      const result = getPageNumbers(5, 20, 3);
      expect(result[0]).toBe(1);
      expect(result[result.length - 1]).toBe(20);
    });

    it("shows current page in window", () => {
      const result = getPageNumbers(10, 30);
      expect(result).toContain(10);
    });
  });

  describe("getPageRange", () => {
    it("computes range for first page", () => {
      expect(getPageRange(1, 10, 100)).toEqual({ from: 1, to: 10 });
    });

    it("computes range for middle page", () => {
      expect(getPageRange(3, 10, 100)).toEqual({ from: 21, to: 30 });
    });

    it("clamps to to total when page exceeds bounds", () => {
      expect(getPageRange(20, 10, 55)).toEqual({ from: 191, to: 55 });
    });

    it("returns from=0, to=0 when total is 0", () => {
      expect(getPageRange(1, 10, 0)).toEqual({ from: 0, to: 0 });
    });

    it("handles pageSize larger than total", () => {
      expect(getPageRange(1, 100, 5)).toEqual({ from: 1, to: 5 });
    });

    it("handles page 2 with small total", () => {
      expect(getPageRange(2, 10, 15)).toEqual({ from: 11, to: 15 });
    });
  });
});
