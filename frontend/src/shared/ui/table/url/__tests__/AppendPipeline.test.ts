import { describe, expect, it } from "vitest";

import { resolveTableMeta } from "../../meta/TableMetaDefaults";
import { AppendPipeline } from "../AppendPipeline";
import { TableUrlKeyResolver } from "../TableUrlKeyResolver";

function createResolver(id: string) {
  return new TableUrlKeyResolver(resolveTableMeta({ id }));
}

describe("AppendPipeline", () => {
  it("clears owned keys from current params", () => {
    const resolver = createResolver("orders");
    const current = new URLSearchParams({
      "orders:page": "1",
      "orders:sort": "name",
      "other:key": "val",
    });
    const pipeline = new AppendPipeline(current, resolver);
    const result = pipeline.build();

    expect(result.get("orders:page")).toBeNull();
    expect(result.get("orders:sort")).toBeNull();
    expect(result.get("other:key")).toBe("val");
  });

  it("clears underscore-format owned keys", () => {
    const resolver = createResolver("orders");
    const current = new URLSearchParams({
      orders_page: "1",
      orders_sort: "name",
    });
    const pipeline = new AppendPipeline(current, resolver);
    const result = pipeline.build();

    expect(result.get("orders_page")).toBeNull();
    expect(result.get("orders_sort")).toBeNull();
  });

  describe("set", () => {
    it("sets a single value", () => {
      const resolver = createResolver("orders");
      const pipeline = new AppendPipeline(new URLSearchParams(), resolver);
      pipeline.set("orders:page", "5");
      expect(pipeline.build().get("orders:page")).toBe("5");
    });

    it("skips null value", () => {
      const resolver = createResolver("orders");
      const pipeline = new AppendPipeline(new URLSearchParams(), resolver);
      pipeline.set("orders:page", null);
      expect(pipeline.build().has("orders:page")).toBe(false);
    });

    it("skips undefined value", () => {
      const resolver = createResolver("orders");
      const pipeline = new AppendPipeline(new URLSearchParams(), resolver);
      pipeline.set("orders:page", undefined);
      expect(pipeline.build().has("orders:page")).toBe(false);
    });

    it("skips empty string value", () => {
      const resolver = createResolver("orders");
      const pipeline = new AppendPipeline(new URLSearchParams(), resolver);
      pipeline.set("orders:page", "");
      expect(pipeline.build().has("orders:page")).toBe(false);
    });
  });

  describe("appendAll", () => {
    it("appends multiple values with same key", () => {
      const resolver = createResolver("orders");
      const pipeline = new AppendPipeline(new URLSearchParams(), resolver);
      pipeline.appendAll("orders:sort", ["-name", "age"]);
      const result = pipeline.build();
      expect(result.getAll("orders:sort")).toEqual(["-name", "age"]);
    });

    it("skips empty string values", () => {
      const resolver = createResolver("orders");
      const pipeline = new AppendPipeline(new URLSearchParams(), resolver);
      pipeline.appendAll("orders:sort", ["-name", ""]);
      expect(pipeline.build().getAll("orders:sort")).toEqual(["-name"]);
    });

    it("handles empty array", () => {
      const resolver = createResolver("orders");
      const pipeline = new AppendPipeline(new URLSearchParams(), resolver);
      pipeline.appendAll("orders:sort", []);
      expect(pipeline.build().has("orders:sort")).toBe(false);
    });
  });

  describe("setFilter", () => {
    it("appends compact filter format under single key", () => {
      const resolver = createResolver("orders");
      const pipeline = new AppendPipeline(new URLSearchParams(), resolver);
      pipeline.setFilter("role", "admin");
      expect(pipeline.build().getAll("orders:filter")).toEqual(["role:admin"]);
    });

    it("appends multiple filters under same key", () => {
      const resolver = createResolver("orders");
      const pipeline = new AppendPipeline(new URLSearchParams(), resolver);
      pipeline.setFilter("role", "admin");
      pipeline.setFilter("status", "active");
      expect(pipeline.build().getAll("orders:filter")).toEqual([
        "role:admin",
        "status:active",
      ]);
    });

    it("skips null value", () => {
      const resolver = createResolver("orders");
      const pipeline = new AppendPipeline(new URLSearchParams(), resolver);
      pipeline.setFilter("role", null);
      expect(pipeline.build().has("orders:filter")).toBe(false);
    });

    it("skips empty string value", () => {
      const resolver = createResolver("orders");
      const pipeline = new AppendPipeline(new URLSearchParams(), resolver);
      pipeline.setFilter("role", "");
      expect(pipeline.build().has("orders:filter")).toBe(false);
    });
  });

  describe("method chaining", () => {
    it("supports fluent API", () => {
      const resolver = createResolver("orders");
      const result = new AppendPipeline(new URLSearchParams(), resolver)
        .set("orders:page", "2")
        .set("orders:size", "25")
        .setFilter("role", "admin")
        .build();

      expect(result.get("orders:page")).toBe("2");
      expect(result.get("orders:size")).toBe("25");
      expect(result.getAll("orders:filter")).toEqual(["role:admin"]);
    });
  });
});
