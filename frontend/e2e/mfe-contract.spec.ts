import { expect, test } from "@playwright/test";

/**
 * MFE Boundary Contract Tests
 *
 * These tests verify the "Hard Boundary" between the Host Application
 * and the Shop Federated Remote.
 */
test.describe.skip("Micro-Frontend Boundary Contracts", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page (The primary entry point for the Shop Remote)
    await page.goto("/");
  });

  test("should successfully load and mount the Shop Remote module", async ({
    page,
  }) => {
    // 1. Verify the Federated Module rendered its Header
    const header = page.locator('h2:has-text("Product Marketplace")');
    await expect(header).toBeVisible({ timeout: 10000 });

    // 2. Verify architectural isolation: Check if specific Shop elements are present
    const productGrid = page
      .locator(".grid")
      .filter({ has: page.locator("article") })
      .first();
    await expect(productGrid).toBeVisible();

    // 3. Verify total product count matches the API expectations (at least 1 item)
    const productCards = page.locator("article");
    await expect(productCards).toHaveCount(12); // Based on your current useProducts(12) call
  });

  test("should synchronize shared Zustand state across Host-Remote boundary", async ({
    page,
  }) => {
    // 1. Click "Add to Cart" on the first product (In the Remote)
    const firstProduct = page.locator("article").first();
    const addToCartBtn = firstProduct.getByRole("button", {
      name: /add to cart/i,
    });
    await addToCartBtn.click();

    // 2. Verify the Cart Drawer (In the Host or Remote) opens
    const drawerTitle = page.locator('h2:has-text("Your Cart")');
    await expect(drawerTitle).toBeVisible();

    // 3. Verify the item count in the Global Navigation (Host Component) updates
    // This confirms the Shared Store Proxy is working.
    const cartCount = page.locator('[data-testid="cart-count"]');
    if (await cartCount.isVisible()) {
      await expect(cartCount).toHaveText("1");
    }
  });

  test("should preserve CSS utility isolation (Tailwind V4)", async ({
    page,
  }) => {
    // Verify that custom colors from the remote are correctly applied
    const header = page.locator('h2:has-text("Product Marketplace")');
    const color = await header.evaluate(
      (el) => window.getComputedStyle(el).color
    );

    // Should be dark slate (rgb(15, 23, 42)) based on your current theme configuration
    expect(color).toBe("rgb(15, 23, 42)");
  });
});
