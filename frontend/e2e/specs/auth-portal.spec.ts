import { expect, test } from "../fixtures/test";

// Clear any authenticated state from global-setup so we can see the login page
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Auth Portal 2-Level Multi-Persona Architecture", () => {
  test.describe("Level 1: Persona Selection View (/login)", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");
    });

    test("should render all 3 persona cards and NO auth form fields", async ({ page }) => {
      // 1. Verify Level 1 Header
      await expect(page.getByRole("heading", { name: /Choose Your Portal/i })).toBeVisible();

      // 2. Verify the 3 Persona Cards exist
      await expect(page.getByRole("heading", { name: /Customer Portal/i })).toBeVisible();
      await expect(page.getByRole("heading", { name: /Partner & Vendor/i })).toBeVisible();
      await expect(page.getByRole("heading", { name: /Staff Terminal/i })).toBeVisible();

      // 3. Verify Guest Access Banner
      await expect(page.getByText(/Browsing as a Guest\?/i)).toBeVisible();
      await expect(page.getByRole("link", { name: /Continue Shopping/i })).toBeVisible();

      // 4. CRITICAL: Ensure NO form input fields or submit buttons exist on Level 1
      await expect(page.locator("input#email, input#username, input[type='email']")).toHaveCount(0);
      await expect(page.locator("input#password, input[type='password']")).toHaveCount(0);
    });

    test("clicking Customer Portal card navigates to Level 2 customer authentication", async ({ page }) => {
      const continueBtn = page.getByRole("button", { name: /Continue to Customer Portal/i });
      await continueBtn.click();

      // Should sync URL to ?mode=customer
      await page.waitForURL(/mode=customer/);
      await expect(page.getByText(/Welcome to ZenOS/i)).toBeVisible();
      await expect(page.getByPlaceholder("Enter your email address")).toBeVisible();
    });

    test("clicking Staff Terminal card navigates to restricted employee portal", async ({ page }) => {
      const continueBtn = page.getByRole("button", { name: /Continue to Staff Terminal/i });
      await continueBtn.click();

      // Should sync URL to ?mode=staff
      await page.waitForURL(/mode=staff/);
      await expect(page.getByText(/ZenOS Enterprise Terminal/i)).toBeVisible();
      await expect(page.getByText(/Restricted Corporate Gateway/i)).toBeVisible();
      // Ensure registration tab is NOT present for staff
      await expect(page.getByRole("radio", { name: /Sign Up|Register/i })).toHaveCount(0);
    });
  });

  test.describe("Level 2: Customer Authentication (/login?mode=customer)", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/login?mode=customer");
      await page.waitForLoadState("networkidle");
    });

    test("renders 50:50 desktop split layout with brand panel and form", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });

      // Left Brand Panel visible on desktop
      await expect(page.getByText(/Retail Consumer Hub/i)).toBeVisible();
      await expect(page.getByText(/Order #ZN-98421/i)).toBeVisible();

      // Right Auth Form visible
      await expect(page.getByPlaceholder("Enter your email address")).toBeVisible();
      await expect(page.getByPlaceholder("Enter your password")).toBeVisible();

      // Back navigation button
      await expect(page.getByRole("button", { name: /Back to Portal Selection/i })).toBeVisible();
    });

    test("toggles between Sign In and Sign Up modes", async ({ page }) => {
      // Toggle to Sign Up
      const signUpTab = page.getByRole("tab", { name: /Sign Up/i });
      if (await signUpTab.count() > 0) {
        await signUpTab.click();
      } else {
        const signUpRadio = page.getByRole("radio", { name: /Sign Up/i });
        await signUpRadio.click();
      }

      await page.waitForTimeout(300);
      // Mode switcher changes URL or form state
      await expect(page.getByRole("button", { name: /Create Account|Sign Up/i })).toBeVisible();
    });

    test("collapses brand panel on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(300);

      // Brand panel hidden on mobile
      await expect(page.getByText(/Retail Consumer Hub/i)).toBeHidden();

      // Form remains accessible
      await expect(page.getByPlaceholder("Enter your email address")).toBeVisible();
    });

    test("clicking Back to Portal Selection returns to Level 1", async ({ page }) => {
      const backBtn = page.getByRole("button", { name: /Back to Portal Selection/i });
      await backBtn.click();

      // Should return to /login without mode query
      await page.waitForURL(/\/login$/);
      await expect(page.getByRole("heading", { name: /Choose Your Portal/i })).toBeVisible();
    });
  });

  test.describe("Level 2: Partner Portal (/login?mode=partner)", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/login?mode=partner");
      await page.waitForLoadState("networkidle");
    });

    test("renders Partner telemetry and B2B vendor onboarding", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });

      // Left Brand Panel for Partner
      await expect(page.getByText(/B2B Supplier & Partner Gateway/i)).toBeVisible();
      await expect(page.getByText(/PO Dispatches/i)).toBeVisible();

      // Right Auth Form for Partner
      await expect(page.getByText(/Partner & Vendor Portal/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /Partner Sign In/i })).toBeVisible();
    });
  });
});
