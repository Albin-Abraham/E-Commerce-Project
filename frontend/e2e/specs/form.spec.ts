import { expect, test } from "../fixtures/test";

test.describe.skip("FormEngine v2 Integration", () => {
  test("should successfully fill and submit a standard administrative form", async ({
    page,
  }) => {
    await page.goto("/showcase/wizard");

    // Wait for the wizard form to be mounted
    await page.waitForSelector("[data-field-name]", { timeout: 10000 });

    // Fill text fields using input name attribute selectors (most direct, i18n-agnostic)
    await page.locator('input[name="first_name"]').fill("John");
    await page.locator('input[name="last_name"]').fill("Doe");

    // Advance the wizard step
    const nextBtn = page
      .locator(
        '[data-part="next-btn"], button:has-text("Next"), button[type="submit"]'
      )
      .first();
    await nextBtn.click();
  });

  test("should display validation errors for required fields", async ({
    page,
  }) => {
    await page.goto("/showcase/wizard");

    // Wait for form to be ready
    await page.waitForSelector("[data-field-name]", { timeout: 10000 });

    // Submit without filling anything — triggers validation
    const nextBtn = page
      .locator(
        '[data-part="next-btn"], button:has-text("Next"), button[type="submit"]'
      )
      .first();
    await nextBtn.click();

    // Form should still be visible (validation blocked navigation)
    await expect(page.locator("[data-field-name]").first()).toBeVisible();
  });
});
