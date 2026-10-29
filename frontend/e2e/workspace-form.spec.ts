import { expect, test } from "@playwright/test";

test.describe("Workspace Form UI Logical Rules", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Rely completely on global-setup.ts state for authentication
    // No more localStorage hacking, no more HTTP mocks!
    await page.goto("/workspace");
  });

  test("should render the workspace form and display companies", async ({
    page,
  }) => {
    // Wait for the workspace header
    await expect(page.locator("text=Workspace Configuration")).toBeVisible();

    // Verify the company select trigger shows the placeholder
    const companySelect = page.locator('[data-unit="select-trigger"]').first();
    await expect(companySelect).toContainText("Select a company…");

    // Click to open the company dropdown
    await companySelect.click();

    // Select the first available company from the real backend!
    const firstOption = page.locator('[role="option"]').first();
    await expect(firstOption).toBeVisible();
    await firstOption.click();

    // Verify the BU select is enabled and loads options
    const buSelect = page.locator(
      '[data-field-name="business_unit_id"] [data-unit="select-trigger"]'
    );
    await expect(buSelect).toContainText("Select a business unit…");
  });

  test("should enforce required fields when clicking launch", async ({
    page,
  }) => {
    // Wait for the workspace form to load
    await expect(page.locator("text=Workspace Configuration")).toBeVisible();

    // Click the submit button without selecting anything
    const submitBtn = page.locator("button", { hasText: "Launch Environment" });
    await submitBtn.click();

    // The form engine should show validation errors
    await expect(page.locator("text=COMPANY IS REQUIRED")).toBeVisible();

    // Let's select a company first
    const companySelect = page.locator('[data-unit="select-trigger"]').first();
    await companySelect.click();
    await page.locator('[role="option"]').first().click();

    // Now submit again without BU
    await submitBtn.click();

    // Now BU should show an error
    await expect(page.locator("text=BUSINESS UNIT IS REQUIRED")).toBeVisible();
  });
});
