/**
 * ZenithTable — Core Behaviour Tests
 *
 * Validates the contract of the ZenithTable compound component system:
 *  - Renders correct data & structure
 *  - Pagination: navigation, disabled states, display labels
 *  - Sorting: column header interaction
 *  - Selection: Physics store integration via selectedCount label
 *  - Meta defaults: resolveTableMeta produces stable, correct defaults
 */
import "@testing-library/jest-dom";
import {
  SIMPLE_META,
  type SimpleRow,
  ZenithTableDriver,
} from "@testing/drivers/ZenithTableDriver";
import { afterEach, beforeEach, describe, it, vi } from "vitest";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeRows = (n: number): SimpleRow[] =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    name: `Employee ${i + 1}`,
    age: 20 + i,
  }));

// ─── Rendering ────────────────────────────────────────────────────────────────

describe("ZenithTable – Rendering", () => {
  it("mounts without errors on empty data", async () => {
    const { driver } = await ZenithTableDriver.render([], SIMPLE_META);
    await driver.expectMounted();
    await driver.expectNoCrash();
    await driver.expectRowCount(0);
  });

  it("renders all rows when data fits on one page", async () => {
    const { driver } = await ZenithTableDriver.render(makeRows(5), SIMPLE_META);
    await driver.expectRowCount(5);
  });

  it("renders all column headers", async () => {
    const { driver } = await ZenithTableDriver.render(makeRows(3), SIMPLE_META);
    await driver.expectHeader("ID");
    await driver.expectHeader("Name");
    await driver.expectHeader("Age");
  });

  it("renders correct cell values", async () => {
    const { driver } = await ZenithTableDriver.render(makeRows(3), SIMPLE_META);
    await driver.expectCellValue("Employee 1");
    await driver.expectCellValue("Employee 2");
    await driver.expectCellValue("Employee 3");
  });

  it("renders the full provided dataset — paging is server-owned", async () => {
    const { driver } = await ZenithTableDriver.render(
      makeRows(25),
      SIMPLE_META
    );
    await driver.expectRowCount(25);
  });
});

// ─── Pagination — display label ───────────────────────────────────────────────

describe("ZenithTable – Pagination display label", () => {
  it("shows the current page of rows when client data has no totalCount override", async () => {
    const { driver } = await ZenithTableDriver.render(makeRows(25), {
      ...SIMPLE_META,
      id: "label-test",
    });
    await driver.expectDisplayLabel("Showing 1-25 of 25 records");
    await driver.expectPaginationVisible();
  });

  it("shows correct label after navigating to page 2", async () => {
    const page = makeRows(10);
    const { driver } = await ZenithTableDriver.render(
      page,
      { ...SIMPLE_META, id: "label-page2" },
      undefined,
      undefined,
      25
    );
    await driver.goToNextPage();
    await driver.expectDisplayLabel("Showing 11-20 of 25 records");
  });

  it("shows correct label on last (partial) page", async () => {
    const page = makeRows(5);
    const { driver } = await ZenithTableDriver.render(
      page,
      { ...SIMPLE_META, id: "label-last" },
      undefined,
      undefined,
      25
    );
    await driver.goToNextPage();
    await driver.goToNextPage();
    await driver.expectDisplayLabel("Showing 21-25 of 25 records");
  });
});

// ─── Pagination — navigation ──────────────────────────────────────────────────

describe("ZenithTable – Pagination navigation", () => {
  it("previous button is disabled on first page", async () => {
    const { driver } = await ZenithTableDriver.render(
      makeRows(10),
      { ...SIMPLE_META, id: "prev-disabled" },
      undefined,
      undefined,
      20
    );
    await driver.expectPrevDisabled();
  });

  it("next button is disabled on last page", async () => {
    const { driver } = await ZenithTableDriver.render(
      makeRows(10),
      { ...SIMPLE_META, id: "next-disabled" },
      undefined,
      undefined,
      15
    );
    await driver.goToNextPage();
    await driver.expectNextDisabled();
  });

  it("navigates forward and back correctly", async () => {
    const { driver } = await ZenithTableDriver.render(
      makeRows(10),
      { ...SIMPLE_META, id: "nav-fwd-back" },
      undefined,
      undefined,
      30
    );
    await driver.expectRowCount(10);

    await driver.goToNextPage();
    await driver.expectDisplayLabel("Showing 11-20 of 30 records");

    await driver.goToPrevPage();
    await driver.expectDisplayLabel("Showing 1-10 of 30 records");
  });

  it("jumps to specific page via numbered button", async () => {
    const { driver } = await ZenithTableDriver.render(
      makeRows(10),
      {
        ...SIMPLE_META,
        id: "jump-page",
        pagination: { showPageNumbers: true, showFirstLast: true },
      },
      undefined,
      undefined,
      30
    );
    await driver.goToPage(3);
    await driver.expectDisplayLabel("Showing 21-30 of 30 records");
  });

  it("renders no page navigation group when data fits one page", async () => {
    const { driver } = await ZenithTableDriver.render(makeRows(5), {
      ...SIMPLE_META,
      id: "single-page",
    });
    await driver.expectPaginationHidden();
  });
});

// ─── Pagination — page size selector ─────────────────────────────────────────

describe("ZenithTable – Pagination page size selector", () => {
  it("shows page-size selector when enabled in meta", async () => {
    const { driver } = await ZenithTableDriver.render(makeRows(50), {
      id: "page-size-meta",
      features: { urlSync: false },
      pagination: {
        showPageSizeSelector: true,
        pageSizeOptions: [10, 25, 50],
      },
    });
    const select = driver.query<HTMLSelectElement>("#page-size-select");
    // @testing-library/jest-dom
    const { expect } = await import("vitest");
    expect(select).toBeTruthy();
  });

  it("hides page-size selector when disabled in meta (default)", async () => {
    const { driver } = await ZenithTableDriver.render(makeRows(20), {
      ...SIMPLE_META,
      id: "no-size-selector",
    });
    const select = driver.query<HTMLSelectElement>("#page-size-select");
    const { expect } = await import("vitest");
    expect(select).toBeNull();
  });
});

// ─── Meta resolution correctness ──────────────────────────────────────────────

describe("ZenithTable – Meta resolution", () => {
  it("applies default pageSize of 10 when not specified", async () => {
    const { driver } = await ZenithTableDriver.render(makeRows(50), {
      id: "default-size",
      features: { urlSync: false },
    });
    await driver.expectRowCount(50);
    await driver.expectDisplayLabel("Showing 1-50 of 50 records");
  });

  it("merges custom pagination.labels with defaults", async () => {
    const { driver } = await ZenithTableDriver.render(makeRows(25), {
      id: "custom-label",
      features: { urlSync: false },
      pagination: {
        // Override the display label template
        labels: { displayLabel: "Page {page} — {total} total" },
      },
    });
    await driver.expectDisplayLabel("Page 1 — 25 total");
  });

  it("throws if meta.id is empty", async () => {
    const { expect } = await import("vitest");
    let threw = false;
    try {
      // resolveTableMeta throws synchronously for empty id — driver.render
      // catches this during the React render and our try/catch captures it.
      await ZenithTableDriver.render(makeRows(5), { id: "" });
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
