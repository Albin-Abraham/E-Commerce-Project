import { describe, expect, it } from "vitest";

import { resolveTableMeta } from "../../meta/TableMetaDefaults";
import { ParsePipeline } from "../ParsePipeline";
import { TableUrlKeyResolver } from "../TableUrlKeyResolver";

function createResolver(id: string) {
  return new TableUrlKeyResolver(resolveTableMeta({ id }));
}

describe("ParsePipeline", () => {
  describe("extractPagination", () => {
    it("returns defaults for empty params", () => {
      const resolver = createResolver("orders");
      const meta = resolveTableMeta({ id: "orders" });
      const pipeline = new ParsePipeline(
        new URLSearchParams(),
        resolver,
        meta.url as any
      );

      expect(pipeline.extractPagination()).toEqual({
        pageIndex: 0,
        pageSize: 10,
      });
    });

    it("parses valid page and size", () => {
      const resolver = createResolver("orders");
      const meta = resolveTableMeta({ id: "orders" });
      const params = new URLSearchParams({
        "orders:page": "3",
        "orders:size": "25",
      });
      const pipeline = new ParsePipeline(params, resolver, meta.url as any);

      expect(pipeline.extractPagination()).toEqual({
        pageIndex: 3,
        pageSize: 25,
      });
    });

    it("guards against NaN page", () => {
      const resolver = createResolver("orders");
      const meta = resolveTableMeta({ id: "orders" });
      const params = new URLSearchParams({ "orders:page": "abc" });
      const pipeline = new ParsePipeline(params, resolver, meta.url as any);

      expect(pipeline.extractPagination().pageIndex).toBe(0);
    });
  });

  describe("extractSearch", () => {
    it("returns empty string for missing search", () => {
      const resolver = createResolver("orders");
      const meta = resolveTableMeta({ id: "orders" });
      const pipeline = new ParsePipeline(
        new URLSearchParams(),
        resolver,
        meta.url as any
      );

      expect(pipeline.extractSearch()).toBe("");
    });

    it("returns normalized search value", () => {
      const resolver = createResolver("orders");
      const meta = resolveTableMeta({ id: "orders" });
      const params = new URLSearchParams({ "orders:search": "hello world" });
      const pipeline = new ParsePipeline(params, resolver, meta.url as any);

      expect(pipeline.extractSearch()).toBe("hello world");
    });

    it("collects error for too-long search", () => {
      const resolver = createResolver("orders");
      const meta = resolveTableMeta({ id: "orders" });
      const params = new URLSearchParams({ "orders:search": "a".repeat(201) });
      const pipeline = new ParsePipeline(params, resolver, meta.url as any);

      expect(pipeline.extractSearch()).toBe("");
      expect(pipeline.hasErrors).toBe(true);
    });
  });

  describe("extractSort", () => {
    it("returns empty array for no sort params", () => {
      const resolver = createResolver("orders");
      const meta = resolveTableMeta({ id: "orders" });
      const pipeline = new ParsePipeline(
        new URLSearchParams(),
        resolver,
        meta.url as any
      );

      expect(pipeline.extractSort()).toEqual([]);
    });

    it("parses valid sort values", () => {
      const resolver = createResolver("orders");
      const meta = resolveTableMeta({ id: "orders" });
      const params = new URLSearchParams();
      params.append("orders:sort", "name:asc");
      params.append("orders:sort", "age:desc");
      const pipeline = new ParsePipeline(params, resolver, meta.url as any);

      expect(pipeline.extractSort()).toEqual([
        { id: "name", desc: false },
        { id: "age", desc: true },
      ]);
    });
  });

  describe("extractFilters", () => {
    it("returns empty array for no filter params", () => {
      const resolver = createResolver("orders");
      const meta = resolveTableMeta({ id: "orders" });
      const pipeline = new ParsePipeline(
        new URLSearchParams(),
        resolver,
        meta.url as any
      );

      expect(pipeline.extractFilters()).toEqual([]);
    });

    it("parses filter params", () => {
      const resolver = createResolver("orders");
      const meta = resolveTableMeta({ id: "orders" });
      const params = new URLSearchParams({ "orders:filter[role]": "admin" });
      const pipeline = new ParsePipeline(params, resolver, meta.url as any);

      expect(pipeline.extractFilters()).toEqual([
        { id: "role", value: "admin" },
      ]);
    });
  });

  describe("extractAll", () => {
    it("extracts all pipeline components", () => {
      const resolver = createResolver("orders");
      const meta = resolveTableMeta({ id: "orders" });
      const params = new URLSearchParams({
        "orders:page": "2",
        "orders:search": "test",
      });
      const pipeline = new ParsePipeline(params, resolver, meta.url as any);

      const result = pipeline.extractAll();
      expect(result.pageIndex).toBe(2);
      expect(result.search).toBe("test");
      expect(result.sorting).toEqual([]);
      expect(result.filters).toEqual([]);
    });
  });

  describe("errors", () => {
    it("starts with no errors", () => {
      const resolver = createResolver("orders");
      const meta = resolveTableMeta({ id: "orders" });
      const pipeline = new ParsePipeline(
        new URLSearchParams(),
        resolver,
        meta.url as any
      );

      expect(pipeline.errors).toEqual([]);
      expect(pipeline.hasErrors).toBe(false);
    });

    it("accumulates errors from multiple extract calls", () => {
      const resolver = createResolver("orders");
      const meta = resolveTableMeta({ id: "orders" });
      const params = new URLSearchParams({
        "orders:search": "a".repeat(201),
      });
      const pipeline = new ParsePipeline(params, resolver, meta.url as any);

      pipeline.extractSearch();
      expect(pipeline.errors.length).toBe(1);
      expect(pipeline.hasErrors).toBe(true);
    });

    it("returns defensive copy of errors", () => {
      const resolver = createResolver("orders");
      const meta = resolveTableMeta({ id: "orders" });
      const pipeline = new ParsePipeline(
        new URLSearchParams(),
        resolver,
        meta.url as any
      );

      const errors1 = pipeline.errors;
      const errors2 = pipeline.errors;
      expect(errors1).not.toBe(errors2);
      expect(errors1).toEqual(errors2);
    });
  });
});
