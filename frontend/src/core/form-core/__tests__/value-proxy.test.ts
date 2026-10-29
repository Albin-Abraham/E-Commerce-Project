import { describe, expect, it } from "vitest";

import { ValueProxy } from "../value-proxy";

describe("ValueProxy Utility", () => {
  const proxy = new ValueProxy();

  describe("getValue", () => {
    const target = {
      simple: "value",
      nested: {
        child: "childValue",
        deep: {
          leaf: 42,
        },
      },
      array: [{ id: 1 }, { id: 2 }],
    };

    it("should retrieve simple properties", () => {
      expect(proxy.getValue(target, "simple")).toBe("value");
    });

    it("should retrieve nested properties using dot notation", () => {
      expect(proxy.getValue(target, "nested.child")).toBe("childValue");
      expect(proxy.getValue(target, "nested.deep.leaf")).toBe(42);
    });

    it("should retrieve array elements", () => {
      expect(proxy.getValue(target, "array[0].id")).toBe(1);
      expect(proxy.getValue(target, "array.1.id")).toBe(2);
    });

    it("should return undefined for non-existent paths", () => {
      expect(proxy.getValue(target, "non.existent")).toBeUndefined();
    });

    it("should handle null/undefined target gracefully", () => {
      expect(proxy.getValue(null, "any")).toBeUndefined();
      expect(proxy.getValue(undefined, "any")).toBeUndefined();
    });
  });

  describe("setValue", () => {
    it("should set simple properties", () => {
      const target = { simple: "old" };
      proxy.setValue(target, "simple", "new");
      expect(target.simple).toBe("new");
    });

    it("should set nested properties", () => {
      const target = { nested: { child: "old" } };
      proxy.setValue(target, "nested.child", "new");
      expect(target.nested.child).toBe("new");
    });

    it("should create intermediate objects for deep paths", () => {
      const target: any = {};
      proxy.setValue(target, "a.b.c", "value");
      expect(target.a.b.c).toBe("value");
    });

    it("should set array elements", () => {
      const target = { list: [] };
      proxy.setValue(target, "list[0]", "item1");
      expect((target.list as any)[0]).toBe("item1");
    });

    it("should handle null target without crashing", () => {
      expect(() => proxy.setValue(null, "prop", "val")).not.toThrow();
    });
  });
});
