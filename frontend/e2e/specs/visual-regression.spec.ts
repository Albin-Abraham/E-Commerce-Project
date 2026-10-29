import { expect, test } from "../fixtures/test";

test.describe("Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/showcase/auth");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector(".form-root", { timeout: 15000 });
  });

  test("auth portal - desktop sign in form", async ({ page }) => {
    await expect(page).toHaveScreenshot("auth-portal-signin-desktop.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test("auth portal - sign up form", async ({ page }) => {
    const signUpToggle = page.getByRole("radio", { name: /Sign Up/i });
    await signUpToggle.click();
    await page.waitForSelector('input[placeholder="Enter your full name"]', { state: "visible" });

    await expect(page).toHaveScreenshot("auth-portal-signup-desktop.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test("auth portal - mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("auth-portal-mobile.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 150,
      threshold: 0.2,
    });
  });
});

test.describe("Visual Regression - Table", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/showcase/table");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("[data-table-root]", { timeout: 15000 });
  });

  test("table - default state", async ({ page }) => {
    await expect(page.locator("[data-table-root]")).toHaveScreenshot("table-default.png", {
      animations: "disabled",
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test("table - with search results", async ({ page, table }) => {
    await table.searchTable(page, "New York");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("[data-table-root]")).toHaveScreenshot("table-search-results.png", {
      animations: "disabled",
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });
});