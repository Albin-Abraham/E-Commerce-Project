import { describe, expect, it } from "vitest";

import { TableUrlAdapters } from "../adapters/TableUrlAdapters";

describe("TableUrlAdapters", () => {
  describe("createMock", () => {
    it("creates adapter with empty store", () => {
      const adapter = TableUrlAdapters.createMock();
      expect(adapter.get("key")).toBeNull();
    });

    it("creates adapter with initial values", () => {
      const adapter = TableUrlAdapters.createMock({ page: "1", size: "10" });
      expect(adapter.get("page")).toBe("1");
      expect(adapter.get("size")).toBe("10");
    });

    it("get returns null for missing key", () => {
      const adapter = TableUrlAdapters.createMock();
      expect(adapter.get("missing")).toBeNull();
    });

    it("getAll returns array of values", () => {
      const adapter = TableUrlAdapters.createMock();
      adapter.set({ sort: ["name:asc", "age:desc"] });
      expect(adapter.getAll("sort")).toEqual(["name:asc", "age:desc"]);
    });

    it("getAll returns empty array for missing key", () => {
      const adapter = TableUrlAdapters.createMock();
      expect(adapter.getAll("missing")).toEqual([]);
    });

    it("snapshot returns URLSearchParams", () => {
      const adapter = TableUrlAdapters.createMock({ page: "2" });
      const snapshot = adapter.snapshot();
      expect(snapshot).toBeInstanceOf(URLSearchParams);
      expect(snapshot.get("page")).toBe("2");
    });

    it("set adds new entries", () => {
      const adapter = TableUrlAdapters.createMock();
      adapter.set({ page: "3" });
      expect(adapter.get("page")).toBe("3");
    });

    it("set replaces existing entries", () => {
      const adapter = TableUrlAdapters.createMock({ page: "1" });
      adapter.set({ page: "5" });
      expect(adapter.get("page")).toBe("5");
    });

    it("set handles array values", () => {
      const adapter = TableUrlAdapters.createMock();
      adapter.set({ sort: ["name:asc", "age:desc"] });
      expect(adapter.getAll("sort")).toEqual(["name:asc", "age:desc"]);
    });

    it("set with null value removes key", () => {
      const adapter = TableUrlAdapters.createMock({ page: "1" });
      adapter.set({ page: null });
      expect(adapter.get("page")).toBeNull();
    });

    it("delete removes keys", () => {
      const adapter = TableUrlAdapters.createMock({ page: "1", size: "10" });
      adapter.delete(["page"]);
      expect(adapter.get("page")).toBeNull();
      expect(adapter.get("size")).toBe("10");
    });

    it("delete handles multiple keys", () => {
      const adapter = TableUrlAdapters.createMock({
        page: "1",
        size: "10",
        sort: "name",
      });
      adapter.delete(["page", "size"]);
      expect(adapter.get("page")).toBeNull();
      expect(adapter.get("size")).toBeNull();
      expect(adapter.get("sort")).toBe("name");
    });

    it("set with undefined value removes key", () => {
      const adapter = TableUrlAdapters.createMock({ page: "1" });
      adapter.set({ page: undefined });
      expect(adapter.get("page")).toBeNull();
    });
  });
});
