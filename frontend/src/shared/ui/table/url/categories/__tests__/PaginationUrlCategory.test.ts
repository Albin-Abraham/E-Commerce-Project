import { describe, expect, it } from "vitest";

import { PaginationUrlCategory } from "../PaginationUrlCategory";

describe("PaginationUrlCategory", () => {
  const keys = { page: "page", size: "size" };
  const defaults = { page: 0, size: 10 };

  describe("serialize", () => {
    it("returns empty when at defaults", () => {
      const result = PaginationUrlCategory.serialize(
        { pageIndex: 0, pageSize: 10 },
        keys,
        defaults
      );
      expect(result).toEqual({});
    });

    it("serializes non-default page", () => {
      const result = PaginationUrlCategory.serialize(
        { pageIndex: 3, pageSize: 10 },
        keys,
        defaults
      );
      expect(result).toEqual({ page: "3" });
    });

    it("serializes non-default size", () => {
      const result = PaginationUrlCategory.serialize(
        { pageIndex: 0, pageSize: 25 },
        keys,
        defaults
      );
      expect(result).toEqual({ size: "25" });
    });

    it("serializes both when both differ", () => {
      const result = PaginationUrlCategory.serialize(
        { pageIndex: 2, pageSize: 50 },
        keys,
        defaults
      );
      expect(result).toEqual({ page: "2", size: "50" });
    });
  });

  describe("deserialize", () => {
    it("returns defaults when no params", () => {
      const params = new URLSearchParams();
      const result = PaginationUrlCategory.deserialize(params, keys, defaults);
      expect(result).toEqual({ pageIndex: 0, pageSize: 10 });
    });

    it("parses valid page", () => {
      const params = new URLSearchParams({ page: "5" });
      const result = PaginationUrlCategory.deserialize(params, keys, defaults);
      expect(result.pageIndex).toBe(5);
    });

    it("parses valid size", () => {
      const params = new URLSearchParams({ size: "25" });
      const result = PaginationUrlCategory.deserialize(params, keys, defaults);
      expect(result.pageSize).toBe(25);
    });

    it("guards against NaN page", () => {
      const params = new URLSearchParams({ page: "abc" });
      const result = PaginationUrlCategory.deserialize(params, keys, defaults);
      expect(result.pageIndex).toBe(0); // falls back to default
    });

    it("guards against NaN size", () => {
      const params = new URLSearchParams({ size: "xyz" });
      const result = PaginationUrlCategory.deserialize(params, keys, defaults);
      expect(result.pageSize).toBe(10); // falls back to default
    });

    it("guards against negative page", () => {
      const params = new URLSearchParams({ page: "-5" });
      const result = PaginationUrlCategory.deserialize(params, keys, defaults);
      expect(result.pageIndex).toBe(0); // Math.max(0, -5) = 0
    });

    it("guards against zero size", () => {
      const params = new URLSearchParams({ size: "0" });
      const result = PaginationUrlCategory.deserialize(params, keys, defaults);
      expect(result.pageSize).toBe(10); // falls back to default
    });
  });

  describe("round-trip", () => {
    it("serializes then deserializes correctly", () => {
      const state = { pageIndex: 3, pageSize: 25 };
      const serialized = PaginationUrlCategory.serialize(state, keys, defaults);
      const params = new URLSearchParams(serialized);
      const deserialized = PaginationUrlCategory.deserialize(
        params,
        keys,
        defaults
      );
      expect(deserialized).toEqual(state);
    });
  });
});
