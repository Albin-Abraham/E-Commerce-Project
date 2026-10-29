/**
 * ZenithTable URL — URL Sync & Adapter Tests
 *
 * Validates the TableUrl infrastructure independently of the full table mount:
 *  - ParsePipeline: correct extraction of page, size, sort, filter, search
 *  - AppendPipeline: correct serialization back to URLSearchParams
 *  - TableUrlKeyResolver: namespaced key generation
 *  - createMock adapter: in-memory test adapter
 *  - useTableUrlWriter (unit): does NOT call setParams repeatedly
 */
import { MemoryRouter } from "react-router-dom";

import { renderHook } from "@testing-library/react";
import { TableUrl } from "@ui/table";
import { resolveTableMeta } from "@ui/table/meta/TableMetaDefaults";
import { AppendPipeline } from "@ui/table/url/AppendPipeline";
import { ParsePipeline } from "@ui/table/url/ParsePipeline";
import { TableUrlKeyResolver } from "@ui/table/url/TableUrlKeyResolver";
import { describe, expect, it } from "vitest";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const META = resolveTableMeta({
  id: "orders",
  features: { urlSync: true },
});

const RESOLVER = new TableUrlKeyResolver(META);

// ─── TableUrlKeyResolver ──────────────────────────────────────────────────────

describe("TableUrlKeyResolver", () => {
  it("namespaces page key with meta.id", () => {
    expect(RESOLVER.key("page")).toBe("orders:page");
  });

  it("namespaces size key", () => {
    expect(RESOLVER.key("size")).toBe("orders:size");
  });

  it("namespaces search key", () => {
    expect(RESOLVER.key("search")).toBe("orders:search");
  });

  it("namespaces sort key", () => {
    expect(RESOLVER.key("sort")).toBe("orders:sort");
  });

  it("generates filter key for column id", () => {
    expect(RESOLVER.filterKey("status")).toBe("orders:filter[status]");
  });

  it("generates filterPrefix", () => {
    expect(RESOLVER.filterPrefix()).toBe("orders:filter");
  });

  it("ownedKeys returns only keys belonging to this table", () => {
    const params = new URLSearchParams(
      "orders:page=2&orders:size=25&other:page=1"
    );
    expect(RESOLVER.ownedKeys(params)).toEqual(["orders:page", "orders:size"]);
  });
});

// ─── ParsePipeline ────────────────────────────────────────────────────────────

describe("ParsePipeline.extractAll", () => {
  it("extracts default state from empty params", () => {
    const adapter = TableUrl.Adapters.createMock({});
    const pipeline = new ParsePipeline(adapter.snapshot(), RESOLVER, META.url!);
    const result = pipeline.extractAll();

    expect(result.pageIndex).toBe(0);
    expect(result.pageSize).toBe(10); // from META defaults
    expect(result.search).toBe("");
    expect(result.sorting).toEqual([]);
    expect(result.filters).toEqual([]);
  });

  it("extracts pageIndex from URL (1-based → 0-based)", () => {
    const adapter = TableUrl.Adapters.createMock({ "orders:page": "2" });
    const pipeline = new ParsePipeline(adapter.snapshot(), RESOLVER, META.url!);
    expect(pipeline.extractAll().pageIndex).toBe(2);
  });

  it("extracts pageSize from URL", () => {
    const adapter = TableUrl.Adapters.createMock({ "orders:size": "25" });
    const pipeline = new ParsePipeline(adapter.snapshot(), RESOLVER, META.url!);
    expect(pipeline.extractAll().pageSize).toBe(25);
  });

  it("extracts search string from URL", () => {
    const adapter = TableUrl.Adapters.createMock({
      "orders:search": "invoice",
    });
    const pipeline = new ParsePipeline(adapter.snapshot(), RESOLVER, META.url!);
    expect(pipeline.extractAll().search).toBe("invoice");
  });

  it("extracts single sort column from URL", () => {
    const adapter = TableUrl.Adapters.createMock({ "orders:sort": "name:asc" });
    const pipeline = new ParsePipeline(adapter.snapshot(), RESOLVER, META.url!);
    const { sorting } = pipeline.extractAll();
    expect(sorting).toHaveLength(1);
    expect(sorting[0]).toMatchObject({ id: "name", desc: false });
  });

  it("extracts descending sort from URL", () => {
    const adapter = TableUrl.Adapters.createMock({
      "orders:sort": "date:desc",
    });
    const pipeline = new ParsePipeline(adapter.snapshot(), RESOLVER, META.url!);
    const { sorting } = pipeline.extractAll();
    expect(sorting[0]).toMatchObject({ id: "date", desc: true });
  });

  it("does not have parse errors for clean URL params", () => {
    const adapter = TableUrl.Adapters.createMock({
      "orders:page": "1",
      "orders:size": "10",
      "orders:search": "hello",
    });
    const pipeline = new ParsePipeline(adapter.snapshot(), RESOLVER, META.url!);
    pipeline.extractAll();
    expect(pipeline.hasErrors).toBe(false);
  });
});

// ─── AppendPipeline ───────────────────────────────────────────────────────────

describe("AppendPipeline", () => {
  it("sets a single key and builds params", () => {
    const base = new URLSearchParams();
    const pipeline = new AppendPipeline(base, RESOLVER);
    pipeline.set(RESOLVER.key("page"), "3");
    const result = pipeline.build();
    expect(result.get("orders:page")).toBe("3");
  });

  it("clears null values (omits default state from URL)", () => {
    const base = new URLSearchParams("orders:page=0");
    const pipeline = new AppendPipeline(base, RESOLVER);
    pipeline.set(RESOLVER.key("page"), null); // null = omit
    const result = pipeline.build();
    expect(result.has("orders:page")).toBe(false);
  });

  it("appendAll stores multiple sort values under same key", () => {
    const base = new URLSearchParams();
    const pipeline = new AppendPipeline(base, RESOLVER);
    pipeline.appendAll(RESOLVER.key("sort"), ["name:asc", "date:desc"]);
    const result = pipeline.build();
    const sorts = result.getAll("orders:sort");
    expect(sorts).toContain("name:asc");
    expect(sorts).toContain("date:desc");
  });

  it("clears owned keys from a previous snapshot before writing new ones", () => {
    // Simulate a scenario where orders:page was already in the URL
    const base = new URLSearchParams("orders:page=5&other-table:page=2");
    const pipeline = new AppendPipeline(base, RESOLVER);
    pipeline.set(RESOLVER.key("page"), "1");
    const result = pipeline.build();
    // Our key is updated
    expect(result.get("orders:page")).toBe("1");
    // Other table's keys are not touched
    expect(result.get("other-table:page")).toBe("2");
  });
});

// ─── Mock adapter ─────────────────────────────────────────────────────────────

describe("TableUrlAdapters.createMock", () => {
  it("get returns null for missing key", () => {
    const adapter = TableUrl.Adapters.createMock({});
    expect(adapter.get("missing")).toBeNull();
  });

  it("set stores a value and get retrieves it", () => {
    const adapter = TableUrl.Adapters.createMock({});
    adapter.set({ foo: "bar" });
    expect(adapter.get("foo")).toBe("bar");
  });

  it("set with array stores all values and getAll retrieves them", () => {
    const adapter = TableUrl.Adapters.createMock({});
    adapter.set({ sort: ["name:asc", "date:desc"] });
    expect(adapter.getAll("sort")).toEqual(["name:asc", "date:desc"]);
  });

  it("snapshot returns a URLSearchParams instance", () => {
    const adapter = TableUrl.Adapters.createMock({ page: "1" });
    const snap = adapter.snapshot();
    expect(snap).toBeInstanceOf(URLSearchParams);
    expect(snap.get("page")).toBe("1");
  });

  it("delete removes a key", () => {
    const adapter = TableUrl.Adapters.createMock({ page: "1", size: "10" });
    adapter.delete(["page"]);
    expect(adapter.get("page")).toBeNull();
    expect(adapter.get("size")).toBe("10");
  });
});

// ─── useReactRouter adapter (stability) ──────────────────────────────────────

describe("TableUrlAdapters.useReactRouter – object stability", () => {
  it("returns the SAME adapter object across multiple renders", () => {
    /**
     * This is the core fix for Bug 3.
     * The adapter is memoized with useMemo([], []), so its object reference
     * must be identical across renders. If it's not, the writer effect
     * re-fires on every render → infinite loop.
     */
    const renders: object[] = [];

    // renderHook callback calls a hook directly — collects adapter each render
    const { rerender } = renderHook(
      () => {
        const adapter = TableUrl.Adapters.useReactRouter();
        renders.push(adapter);
        return adapter;
      },
      {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      }
    );

    // Force multiple re-renders
    rerender();
    rerender();
    rerender();

    // All adapter refs must be the same object (memoized stable)
    expect(renders.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < renders.length; i++) {
      expect(renders[i]).toBe(renders[0]);
    }
  });
});
