import { describe, expect, it } from "vitest";

import { SearchUrlCategory } from "../SearchUrlCategory";

describe("SearchUrlCategory", () => {
  describe("serialize", () => {
    it("returns empty for empty value", () => {
      expect(SearchUrlCategory.serialize("", "search")).toEqual({});
    });

    it("serializes trimmed value", () => {
      expect(SearchUrlCategory.serialize("  hello  ", "search")).toEqual({
        search: "hello",
      });
    });

    it("uses custom key", () => {
      expect(SearchUrlCategory.serialize("query", "q")).toEqual({ q: "query" });
    });
  });

  describe("deserialize", () => {
    it("returns empty string when key missing", () => {
      const params = new URLSearchParams();
      expect(SearchUrlCategory.deserialize(params, "search")).toBe("");
    });

    it("returns normalized search value", () => {
      const params = new URLSearchParams({ search: "hello world" });
      expect(SearchUrlCategory.deserialize(params, "search")).toBe(
        "hello world"
      );
    });

    it("returns empty for too-long value", () => {
      const params = new URLSearchParams({ search: "a".repeat(201) });
      expect(SearchUrlCategory.deserialize(params, "search")).toBe("");
    });
  });
});
