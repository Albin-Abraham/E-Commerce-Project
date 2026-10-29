import { describe, expect, it } from "vitest";

import { FilterUrlCategory } from "../FilterUrlCategory";

describe("FilterUrlCategory", () => {
  describe("serialize", () => {
    it("returns empty for empty filters", () => {
      expect(FilterUrlCategory.serialize([], "filter")).toEqual({});
    });

    it("serializes filters to compact format", () => {
      const result = FilterUrlCategory.serialize(
        [{ id: "role", value: "admin" }],
        "filter"
      );
      expect(result).toEqual({ filter: ["role:admin"] });
    });

    it("serializes multiple filters as array", () => {
      const result = FilterUrlCategory.serialize(
        [
          { id: "role", value: "admin" },
          { id: "status", value: "active" },
        ],
        "filter"
      );
      expect(result).toEqual({
        filter: ["role:admin", "status:active"],
      });
    });
  });

  describe("deserialize", () => {
    it("returns empty for no params", () => {
      const params = new URLSearchParams();
      expect(FilterUrlCategory.deserialize(params, "filter")).toEqual([]);
    });

    it("deserializes compact format", () => {
      const params = new URLSearchParams();
      params.append("filter", "role:admin");
      const result = FilterUrlCategory.deserialize(params, "filter");
      expect(result).toEqual([{ id: "role", value: "admin" }]);
    });

    it("deserializes legacy bracket notation", () => {
      const params = new URLSearchParams({ "filter[role]": "admin" });
      const result = FilterUrlCategory.deserialize(params, "filter");
      expect(result).toEqual([{ id: "role", value: "admin" }]);
    });

    it("deserializes multiple filters", () => {
      const params = new URLSearchParams();
      params.append("filter", "role:admin");
      params.append("filter", "status:active");
      const result = FilterUrlCategory.deserialize(params, "filter");
      expect(result).toHaveLength(2);
    });
  });

  describe("isOwnedKey", () => {
    it("returns true for compact filter key", () => {
      expect(FilterUrlCategory.isOwnedKey("filter", "filter")).toBe(true);
    });

    it("returns true for legacy bracket notation", () => {
      expect(FilterUrlCategory.isOwnedKey("filter[role]", "filter")).toBe(true);
    });

    it("returns false for non-matching prefix", () => {
      expect(FilterUrlCategory.isOwnedKey("sort[name]", "filter")).toBe(false);
    });
  });
});
