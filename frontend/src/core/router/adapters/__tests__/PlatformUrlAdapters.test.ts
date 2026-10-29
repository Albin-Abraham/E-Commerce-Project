import { describe, expect, it } from "vitest";
import { PlatformUrlAdapters } from "../PlatformUrlAdapters";

describe("PlatformUrlAdapters - createMock", () => {
  it("initializes from provided state and returns snapshot", () => {
    const adapter = PlatformUrlAdapters.createMock({
      search: "stethoscope",
      tab: "inventory",
    });

    expect(adapter.get("search")).toBe("stethoscope");
    expect(adapter.get("tab")).toBe("inventory");
    expect(adapter.get("nonexistent")).toBeNull();

    const snapshot = adapter.snapshot();
    expect(snapshot.get("search")).toBe("stethoscope");
    expect(snapshot.get("tab")).toBe("inventory");
  });

  it("handles scoped keys transparently", () => {
    const adapter = PlatformUrlAdapters.createMock(
      { products_search: "syringes", products_category: "consumables" },
      "products"
    );

    // Reads scoped key via simple key name
    expect(adapter.get("search")).toBe("syringes");
    expect(adapter.get("category")).toBe("consumables");
    expect(adapter.getScopedKey("search")).toBe("products_search");

    // Setting a key writes the scoped key
    adapter.set({ search: "scalpel" });
    expect(adapter.get("search")).toBe("scalpel");
    expect(adapter.snapshot().get("products_search")).toBe("scalpel");
  });

  it("preserves unmanaged parameters during set and delete", () => {
    const adapter = PlatformUrlAdapters.createMock({
      global_search: "clinic",
      page: "2",
      sort: "date:desc",
    });

    // Update only 'page', leaving 'global_search' and 'sort' intact
    adapter.set({ page: "3" });
    expect(adapter.get("page")).toBe("3");
    expect(adapter.get("global_search")).toBe("clinic");
    expect(adapter.get("sort")).toBe("date:desc");

    // Delete 'page', leaving others intact
    adapter.delete(["page"]);
    expect(adapter.get("page")).toBeNull();
    expect(adapter.get("global_search")).toBe("clinic");
    expect(adapter.get("sort")).toBe("date:desc");
  });

  it("removes entries when set value is null, undefined, or empty string", () => {
    const adapter = PlatformUrlAdapters.createMock({
      field1: "value1",
      field2: "value2",
      field3: "value3",
    });

    adapter.set({
      field1: null,
      field2: undefined,
      field3: "",
    });

    expect(adapter.get("field1")).toBeNull();
    expect(adapter.get("field2")).toBeNull();
    expect(adapter.get("field3")).toBeNull();
    expect(adapter.snapshot().toString()).toBe("");
  });

  it("handles multi-value array entries via getAll", () => {
    const adapter = PlatformUrlAdapters.createMock({
      status: ["active", "pending"],
    });

    expect(adapter.getAll("status")).toEqual(["active", "pending"]);
    expect(adapter.get("status")).toBe("active");

    adapter.set({ status: ["archived"] });
    expect(adapter.getAll("status")).toEqual(["archived"]);
  });
});
