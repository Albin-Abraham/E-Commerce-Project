import { describe, expect, it } from "vitest";

import { resolveTableMeta } from "../../meta/TableMetaDefaults";
import { TableUrlKeyResolver } from "../TableUrlKeyResolver";

function createResolver(id: string) {
  return new TableUrlKeyResolver(resolveTableMeta({ id }));
}

describe("TableUrlKeyResolver", () => {
  describe("key", () => {
    it("returns namespaced page key", () => {
      const resolver = createResolver("orders");
      expect(resolver.key("page")).toBe("orders:page");
    });

    it("returns namespaced size key", () => {
      const resolver = createResolver("orders");
      expect(resolver.key("size")).toBe("orders:size");
    });

    it("returns namespaced search key", () => {
      const resolver = createResolver("orders");
      expect(resolver.key("search")).toBe("orders:search");
    });

    it("returns namespaced sort key", () => {
      const resolver = createResolver("orders");
      expect(resolver.key("sort")).toBe("orders:sort");
    });

    it("returns namespaced filter key", () => {
      const resolver = createResolver("orders");
      expect(resolver.key("filter")).toBe("orders:filter");
    });
  });

  describe("filterKey", () => {
    it("returns namespaced filter key for column", () => {
      const resolver = createResolver("orders");
      expect(resolver.filterKey("role")).toBe("orders:filter[role]");
    });

    it("handles empty colId", () => {
      const resolver = createResolver("orders");
      expect(resolver.filterKey("")).toBe("orders:filter[]");
    });
  });

  describe("filterPrefix", () => {
    it("returns the filter prefix", () => {
      const resolver = createResolver("orders");
      expect(resolver.filterPrefix()).toBe("orders:filter");
    });
  });

  describe("ownedKeys", () => {
    it("returns keys belonging to this table", () => {
      const resolver = createResolver("orders");
      const params = new URLSearchParams({
        "orders:page": "1",
        "orders:sort": "name",
        "other:page": "2",
      });
      const owned = resolver.ownedKeys(params);
      expect(owned).toEqual(["orders:page", "orders:sort"]);
    });

    it("returns empty array for no matching keys", () => {
      const resolver = createResolver("orders");
      const params = new URLSearchParams({ "other:page": "1" });
      expect(resolver.ownedKeys(params)).toEqual([]);
    });

    it("returns empty array for empty params", () => {
      const resolver = createResolver("orders");
      expect(resolver.ownedKeys(new URLSearchParams())).toEqual([]);
    });

    it("matches legacy underscore keys for known suffixes only", () => {
      const resolver = createResolver("orders");
      const params = new URLSearchParams({
        orders_page: "1",
        orders_search: "john",
        "orders_list:page": "2",
        "other:page": "3",
      });
      const owned = resolver.ownedKeys(params);
      expect(owned).toEqual(["orders_page", "orders_search"]);
    });

    it("does not steal keys that only share a prefix", () => {
      const resolver = createResolver("orders");
      const params = new URLSearchParams({
        "orders_list:page": "2",
        "showcase_table:search": "x",
      });
      expect(resolver.ownedKeys(params)).toEqual([]);
    });
  });
});
