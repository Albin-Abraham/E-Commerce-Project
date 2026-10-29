import { expect, test } from "../fixtures/test";

test.describe.skip("ZenithTable Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Setup - Navigate to a page with a table (e.g. Administrative Company List)
    await page.goto("/showcase/table"); // Update with actual route
  });

  test("should filter table records based on search query", async ({
    page,
    table,
  }) => {
    // 1. Act - Search the table using our injected functional action
    await table.searchTable(page, "Liam Smith");

    // 2. Assert - Verify only rows matching the query remain and contain the expected text
    const count = await table.getRowCount(page);
    expect(count).toBeGreaterThan(0);

    await table.assertRowContainsText(page, 0, "Liam Smith");
  });

  test("should allow interacting with row-level actions", async ({
    page,
    table,
  }) => {
    // Ensure we have data
    const count = await table.getRowCount(page);
    expect(count).toBeGreaterThan(0);

    // 1. Act - Click the edit button on the first row
    // Playwright's getByRole is case-insensitive, but match your actual aria-label or text
    await table.clickRowAction(page, 0, "Edit");

    // 2. Assert - For example, check if a modal or form drawer opened
    // const modalTitle = page.locator('h2:has-text("Edit Company")');
    // await expect(modalTitle).toBeVisible();
  });
});
