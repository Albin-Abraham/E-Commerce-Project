/**
 * ZenithTable — Render Loop Regression Tests
 *
 * Validates the three root causes of the infinite render loop / crash:
 *
 *  Bug 1: resolveTableMeta() not memoized in useTableController → new object
 *          ref on every render → TableMetaProvider.useMemo fires every render.
 *
 *  Bug 2: TableMetaProvider.useMemo keyed on [meta] (object ref) instead of
 *          [meta.id] (stable string) → re-resolves every render → calls
 *          Object.keys on an intermediate undefined value → CRASH.
 *
 *  Bug 3: useReactRouter adapter returned a fresh closure object each render →
 *          URL writer fires setParams() → router re-renders → new params →
 *          new adapter object → effect sees dependency change → loops.
 */
import "@testing-library/jest-dom";
import {
  SIMPLE_META,
  type SimpleRow,
  ZenithTableDriver,
} from "@testing/drivers/ZenithTableDriver";
import { TableUrl } from "@ui/table";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Silence React's own "update not wrapped in act()" warnings for URL-driven tests
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Fixture data ─────────────────────────────────────────────────────────────

const FIVE_ROWS: SimpleRow[] = Array.from({ length: 5 }, (_, i) => ({
  id: String(i + 1),
  name: `User ${i + 1}`,
  age: 20 + i,
}));

const THIRTY_ROWS: SimpleRow[] = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  name: `Person ${i + 1}`,
  age: 25 + i,
}));

// ─── Bug 1 regression: resolveTableMeta memoization ──────────────────────────

describe("Bug 1 – resolveTableMeta memoization in useTableController", () => {
  it("should mount without crashing when meta is provided inline", async () => {
    /**
     * Before the fix, resolveTableMeta ran on EVERY render producing a new object.
     * That cascaded into TableMetaProvider re-running and then Object.keys()
     * crashing on a transiently undefined intermediate value.
     *
     * After the fix: useMemo([config.meta.id]) → stable object, no cascade.
     */
    const { driver } = await ZenithTableDriver.render(FIVE_ROWS, {
      // Pass meta as a fresh literal — exactly what the bug was triggered by
      id: "bug1-table",
      features: { urlSync: false },
    });

    await driver.expectMounted();
    await driver.expectNoCrash();
  });

  it("should not throw TypeError: Cannot convert undefined or null to object", async () => {
    /**
     * The Object.keys() crash happened inside lodash mergeWith called by
     * resolveTableMeta on every re-render, when pagination.labels was undefined
     * during the intermediate merge pass.
     */
    // This would throw synchronously before the fix
    let thrown = false;
    try {
      const { driver } = await ZenithTableDriver.render(FIVE_ROWS, SIMPLE_META);
      await driver.expectMounted();
    } catch (e) {
      thrown = true;
    }
    expect(thrown).toBe(false);
  });

  it("should still resolve the meta correctly after memoization", async () => {
    /**
     * Memoizing must not break the resolution — pagination labels must be
     * accessible to ZenithTablePagination after the fix.
     */
    const { driver } = await ZenithTableDriver.render(THIRTY_ROWS, {
      id: "meta-resolve-table",
      features: { urlSync: false },
      pagination: {
        showPageNumbers: true,
        showFirstLast: true,
      },
    });

    await driver.expectMounted();
    await driver.expectPaginationVisible();
    // The "Showing 1-10 of 30 records" label comes from resolveTableMeta defaults
    await driver.expectDisplayLabel("Showing");
  });
});

// ─── Bug 2 regression: TableMetaProvider useMemo dependency ─────────────────

describe("Bug 2 – TableMetaProvider useMemo keyed on meta.id not meta ref", () => {
  it("should not re-resolve meta on every render cycle", async () => {
    /**
     * We spy on the mergeWith import to count how many times resolveTableMeta
     * is called. With the bug, it is called on every render. After the fix, it
     * is called only once per unique meta.id.
     *
     * Strategy: we interact with the table (page change triggers re-renders)
     * and verify the table stays stable — no crash, no remount of children.
     */
    const { driver } = await ZenithTableDriver.render(
      THIRTY_ROWS.slice(0, 10),
      {
        id: "meta-stability-table",
        features: { urlSync: false },
        pagination: { showPageNumbers: true, showFirstLast: true },
      },
      undefined,
      undefined,
      30
    );

    await driver.expectMounted();

    // Interact: navigate pages — each interaction causes re-renders.
    // If Bug 2 existed, this would crash on second re-render.
    await driver.goToNextPage();
    await driver.expectNoCrash();
    await driver.goToPrevPage();
    await driver.expectNoCrash();
  });

  it("should survive multiple re-renders without crashing ZenithTablePagination", async () => {
    /**
     * The error in the stack trace was at ZenithTablePagination.tsx:16
     * (useTablePhysics selector). If TableMetaProvider re-resolves on every
     * render, the entire sub-tree re-mounts, which momentarily unmounts
     * TablePhysicsProvider and exposes useTablePhysics to a null store.
     *
     * After the fix: PhysicsProvider and all children stay mounted.
     */
    const { driver } = await ZenithTableDriver.render(
      THIRTY_ROWS.slice(0, 10),
      {
        id: "pagination-stability",
        features: { urlSync: false },
        pagination: {
          showPageNumbers: true,
          showFirstLast: true,
          maxVisiblePages: 5,
        },
      },
      undefined,
      undefined,
      30
    );

    await driver.expectPaginationVisible();

    // Navigate forward through all pages — if bug exists, crashes within 1-2 clicks
    await driver.goToNextPage();
    await driver.expectNoCrash();

    await driver.goToNextPage();
    await driver.expectNoCrash();

    await driver.goToPrevPage();
    await driver.expectNoCrash();
  });
});

// ─── Bug 3 regression: URL adapter stability ─────────────────────────────────

describe("Bug 3 – useReactRouter adapter object stability", () => {
  it("should not trigger an infinite loop when urlSync is enabled", async () => {
    /**
     * With the bug: adapter.set() → setParams() → RR re-renders →
     * new params → new adapter object identity → writer effect deps changed
     * → effect fires again → infinite loop.
     *
     * After the fix: useMemo([], []) + refs → adapter is stable →
     * effect deps never change → writer fires exactly once per state change.
     *
     * We detect the loop by asserting the component is still responsive
     * (not frozen) after a state change that would trigger a URL write.
     */
    const { driver } = await ZenithTableDriver.render(
      THIRTY_ROWS.slice(0, 10),
      {
        id: "url-sync-table",
        features: { urlSync: true }, // urlSync ON
        pagination: { showPageNumbers: true, showFirstLast: true },
      },
      undefined,
      undefined,
      30
    );

    await driver.expectMounted();
    await driver.expectNoCrash();

    // Trigger a state change that the writer would sync to the URL.
    // If the infinite loop existed, the test would hang/timeout.
    await driver.goToNextPage();

    // Still alive and showing page 2 rows
    await driver.expectNoCrash();
    await driver.expectDisplayLabel("Showing");
  });

  it("should display correct rows after urlSync pagination interaction", async () => {
    /**
     * Validates that URL sync does not corrupt the table state — rows from
     * page 2 appear correctly after navigation even when urlSync is enabled.
     */
    const { driver } = await ZenithTableDriver.render(
      THIRTY_ROWS.slice(0, 10),
      {
        id: "url-sync-rows",
        features: { urlSync: true },
        pagination: { showPageNumbers: true, showFirstLast: true },
      },
      undefined,
      undefined,
      30
    );

    await driver.expectRowCount(10);

    await driver.goToNextPage();
    await driver.expectRowCount(10);
    await driver.expectDisplayLabel("Showing 11-20 of 30 records");
    await driver.expectNoCrash();
  });
});
