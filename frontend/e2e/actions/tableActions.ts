import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
/**
 * Functional Actions for Table Interaction
 */

export const searchTable = async (
  page: Page,
  query: string,
  rootSelector: string = "[data-table-root]"
) => {
  const searchInput = page
    .locator(rootSelector)
    .locator('input[type="search"], input[placeholder*="Search"]')
    .first();
  await searchInput.fill(query);
  // Wait for the UI to settle after search (debouncing or network requests)
  await page.waitForLoadState("networkidle");
};

export const getRowCount = async (
  page: Page,
  rootSelector: string = "[data-table-root]"
) => {
  // Wait for the first row to be visible to ensure data has loaded
  await page
    .locator(rootSelector)
    .locator("[data-table-row]")
    .first()
    .waitFor({ state: "visible", timeout: 5000 })
    .catch(() => {});
  return await page.locator(rootSelector).locator("[data-table-row]").count();
};

export const clickRowAction = async (
  page: Page,
  rowIndex: number,
  actionName: string,
  rootSelector: string = "[data-table-root]"
) => {
  // Finds a specific row (0-indexed) and clicks an action button within it (e.g., "Edit" or "Delete")
  const row = page
    .locator(rootSelector)
    .locator("[data-table-row]")
    .nth(rowIndex);
  const actionBtn = row.getByRole("button", { name: actionName });
  await actionBtn.click();
};

export const assertRowContainsText = async (
  page: Page,
  rowIndex: number,
  expectedText: string,
  rootSelector: string = "[data-table-root]"
) => {
  const row = page
    .locator(rootSelector)
    .locator("[data-table-row]")
    .nth(rowIndex);
  await expect(row).toContainText(expectedText);
};

export const clickPaginationNext = async (
  page: Page,
  rootSelector: string = "[data-table-root]"
) => {
  const nextBtn = page
    .locator(rootSelector)
    .getByRole("button", { name: /next/i });
  await nextBtn.click();
  await page.waitForLoadState("networkidle");
};
