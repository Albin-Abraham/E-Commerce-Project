import { expect, test } from "@playwright/test";

test.describe.skip("Employee Onboarding Wizard E2E", () => {
  // Test data as JSON inputs representing form fill states
  const mockValidUser = {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@example.com",
    maritalStatus: "Married",
    spouseName: "John Doe",
    citizenshipStatus: "Foreign National (Visa)",
    visaNumber: "V-123456789",
  };

  test("dynamically renders sections based on JSON inputs and tests DOM constraints", async ({
    page,
  }) => {
    // 1. Navigate to the wizard route
    await page.goto("/showcase/wizard");

    // 2. Validate the Modal and Form Schema rendering constraints
    // Verify Modal Header and Tabs exist
    const modalHeader = page.getByRole("heading", {
      name: "Employee Onboarding Portal",
    });
    await expect(modalHeader).toBeVisible();

    const wizardTab = page.getByRole("button", { name: "Onboarding Wizard" });
    const instructionsTab = page.getByRole("button", {
      name: "Instructions & Policy",
    });
    await expect(wizardTab).toBeVisible();
    await expect(instructionsTab).toBeVisible();

    // 3. Fill out Personal Details using JSON input
    await page.getByLabel(/First Name/i).fill(mockValidUser.firstName);
    await page.getByLabel(/Last Name/i).fill(mockValidUser.lastName);
    await page.getByLabel(/Email Address/i).fill(mockValidUser.email);

    // 4. Test Dynamic Schema: Marital Status -> Spouse Section
    // Ensure Spouse section is not visible
    await expect(page.locator("text=Spouse Information")).toHaveCount(0);

    // Select Married from Marital Status dropdown
    await page.getByLabel(/Marital Status/i).click();
    await page
      .getByRole("option", { name: mockValidUser.maritalStatus })
      .click();

    // Verify Spouse section is dynamically appended to the stepper
    const spouseStepperItem = page.locator("text=Spouse Information");
    await expect(spouseStepperItem).toBeVisible();

    // 5. Test Dynamic Schema: Citizenship -> Visa Section
    // Ensure Visa section is not visible yet
    await expect(page.locator("text=Visa & Legal")).toHaveCount(0);

    // Select Work Visa from Citizenship dropdown
    await page.getByLabel(/Citizenship Status/i).click();
    await page
      .getByRole("option", { name: mockValidUser.citizenshipStatus })
      .click();

    // Verify Visa section is dynamically appended to the stepper
    const visaStepperItem = page.locator("text=Visa & Legal");
    await expect(visaStepperItem).toBeVisible();

    // 6. Navigate through dynamically generated DOM elements
    // Go to Spouse Details
    await spouseStepperItem.click();
    await expect(
      page.getByRole("heading", { name: "Spouse Details" })
    ).toBeVisible();
    await page.getByLabel(/Spouse Full Name/i).fill(mockValidUser.spouseName);

    // Go to Visa & Legal
    await visaStepperItem.click();
    await expect(
      page.getByRole("heading", { name: "Visa & Legal" })
    ).toBeVisible();
    await page.getByLabel(/Visa Number/i).fill(mockValidUser.visaNumber);

    // 7. Extract final DOM state assertions
    // The modal footer should remain anchored properly throughout
    const completeButton = page.getByRole("button", { name: "Cancel" });
    await expect(completeButton).toBeVisible();
  });
});
