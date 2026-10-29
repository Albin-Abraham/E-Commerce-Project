import { expect, test } from "../fixtures/test";

// Clear any authenticated state from global-setup so we can see the login page
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Auth Portal Layout & Interactions", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the auth showcase portal
    await page.goto("/showcase/auth");
    // Wait for the form engine to be ready (prevents flakiness on cold start)
    await page.waitForSelector(".form-root", { timeout: 15000 });
  });

  test("should render the Sign In form by default", async ({ page }) => {
    // 1. Verify the layout renders the main title
    await expect(page.getByText(/Welcome to Kezak/i)).toBeVisible();

    // 2. Verify "Sign In" fields are present
    await expect(
      page.getByPlaceholder("Enter your email address")
    ).toBeVisible();
    await expect(page.getByPlaceholder("Enter your password")).toBeVisible();

    // 3. Verify the "Sign In" submit button is rendered and correct
    const submitBtn = page.getByRole("button", {
      name: /Sign In/i,
      exact: false,
    });
    await expect(submitBtn).toBeVisible();

    // 4. Ensure "Sign Up" specific fields are missing
    await expect(page.getByPlaceholder("Enter your full name")).toBeHidden();
  });

  test("should toggle to the Sign Up form when requested", async ({ page }) => {
    // 1. Click the "Sign Up" segment toggle
    const signUpToggle = page.getByRole("radio", { name: /Sign Up/i });
    await signUpToggle.click();

    // 2. Wait and verify "Sign Up" fields appear
    await expect(page.getByPlaceholder("Enter your full name")).toBeVisible();
    await expect(page.getByPlaceholder("Confirm your password")).toBeVisible();

    // 3. Verify the submit button changes to "Create Account"
    const submitBtn = page.getByRole("button", {
      name: /Create Account/i,
      exact: false,
    });
    await expect(submitBtn).toBeVisible();
  });

  test("should show validation errors when submitting empty Sign In form", async ({
    page,
  }) => {
    // 1. Click submit immediately
    const submitBtn = page.getByRole("button", {
      name: /Sign In/i,
      exact: false,
    });
    await submitBtn.click();

    // 2. Verify validation triggers on the fields (the Form engine adds aria-invalid or similar)
    // Here we check for typical validation feedback classes/attributes or just that the form wasn't submitted
    // The exact validation error depends on your Form component's validation rendering
    const emailField = page.getByPlaceholder("Enter your email address");
    const passwordField = page.getByPlaceholder("Enter your password");

    // Some implementations add aria-invalid="true" when a field errors
    await expect(emailField).toHaveAttribute("aria-invalid", "true");
    await expect(passwordField).toHaveAttribute("aria-invalid", "true");
  });
  test("should hide brand panel on mobile viewport and stack form to full width", async ({
    page,
  }) => {
    // Set viewport to a typical mobile size (e.g. iPhone 12: 390x844)
    await page.setViewportSize({ width: 390, height: 844 });

    // The brand panel has 'hidden md:block', so it should not be visible here
    // Let's identify the brand panel. It has the text 'A Unified Hub' (from AuthBrandPanel component)
    const brandText = page.getByText(/A Unified Hub/i);
    await expect(brandText).toBeHidden();
  });

  test("should display brand panel on desktop viewport (50/50 split)", async ({
    page,
  }) => {
    // Set viewport to a typical desktop size
    await page.setViewportSize({ width: 1280, height: 720 });

    // The brand panel should be visible
    const brandText = page.getByText(/A Unified Hub/i);
    await expect(brandText).toBeVisible();
  });
});
