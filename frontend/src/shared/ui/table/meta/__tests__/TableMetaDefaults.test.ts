import { describe, expect, it } from "vitest";

import { DEFAULT_TABLE_META, resolveTableMeta } from "../TableMetaDefaults";

describe("TableMetaDefaults", () => {
  describe("DEFAULT_TABLE_META", () => {
    it("has empty id", () => {
      expect(DEFAULT_TABLE_META.id).toBe("");
    });

    it("has pagination defaults", () => {
      expect(DEFAULT_TABLE_META.pagination.showPageNumbers).toBe(true);
      expect(DEFAULT_TABLE_META.pagination.pageSizeOptions).toEqual([
        10, 25, 50, 100,
      ]);
      expect(DEFAULT_TABLE_META.pagination.maxVisiblePages).toBe(7);
    });

    it("has url defaults", () => {
      expect(DEFAULT_TABLE_META.url.keys.page).toBe("page");
      expect(DEFAULT_TABLE_META.url.keys.size).toBe("size");
      expect(DEFAULT_TABLE_META.url.defaults.page).toBe(0);
      expect(DEFAULT_TABLE_META.url.defaults.size).toBe(10);
    });

    it("has urlSync as the only feature flag", () => {
      expect(DEFAULT_TABLE_META.features.urlSync).toBe(true);
      expect(Object.keys(DEFAULT_TABLE_META.features)).toEqual(["urlSync"]);
    });

    it("has empty columns array", () => {
      expect(DEFAULT_TABLE_META.columns).toEqual([]);
    });

    it("has display label with template", () => {
      expect(DEFAULT_TABLE_META.pagination.labels.displayLabel).toBe(
        "Showing {from}-{to} of {total} records"
      );
    });
  });

  describe("resolveTableMeta", () => {
    it("throws when id is empty", () => {
      expect(() => resolveTableMeta({ id: "" })).toThrow(
        "[ZenithTable] meta.id is required"
      );
    });

    it("throws when id is whitespace only", () => {
      expect(() => resolveTableMeta({ id: "   " })).toThrow(
        "[ZenithTable] meta.id is required"
      );
    });

    it("returns full meta with minimal input", () => {
      const result = resolveTableMeta({ id: "orders" });
      expect(result.id).toBe("orders");
      expect(result.url).toBeDefined();
      expect(result.features).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.columns).toEqual([]);
    });

    it("deep merges partial pagination", () => {
      const result = resolveTableMeta({
        id: "orders",
        pagination: { showFirstLast: false },
      });
      expect(result.pagination.showFirstLast).toBe(false);
      expect(result.pagination.showPageNumbers).toBe(true);
    });

    it("replaces columns array instead of concatenating", () => {
      const result = resolveTableMeta({
        id: "orders",
        columns: [{ id: "name", label: "Name" }],
      });
      expect(result.columns).toHaveLength(1);
      expect(result.columns[0].id).toBe("name");
    });

    it("merges nested url keys", () => {
      const result = resolveTableMeta({
        id: "orders",
        url: { keys: { page: "p" } },
      });
      expect(result.url.keys.page).toBe("p");
      expect(result.url.keys.size).toBe("size");
    });

    it("preserves custom defaults", () => {
      const result = resolveTableMeta({
        id: "orders",
        url: { defaults: { page: 2, size: 25, search: "" } },
      });
      expect(result.url.defaults.page).toBe(2);
      expect(result.url.defaults.size).toBe(25);
    });
  });
});
