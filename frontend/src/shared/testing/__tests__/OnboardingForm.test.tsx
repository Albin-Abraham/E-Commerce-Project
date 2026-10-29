import { describe, expect, it, vi } from "vitest";

import { OnboardingFormDriver } from "../drivers/OnboardingFormDriver";
import fs from "fs";

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe("Onboarding Form: Modernized Infrastructure Suite (v2.1)", () => {
  it("should complete the 'Bachelors' path (Single/Citizen)", async () => {
    const { driver, alertMock } = await OnboardingFormDriver.renderOnboarding();

    // 1. Personal Details (Step 1)
    await driver.fill("first_name", "John");
    await driver.fill("last_name", "Doe");
    await driver.fill("email", "john.doe@example.com");

    // Select defaults: Single (already selected?) and Citizen
    await driver.selectOption("citizenship_status", "Citizen");

    // Verify values in 5V Matrix
    await driver.expectValues({
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      marital_status: "single", // Default
      citizenship_status: "citizen",
    });

    // 2. Linear Wizard Navigation Check
    // Spouse details should be HIDDEN
    await driver.expectVisible("spouse_name", false);

    // 3. Complete Onboarding
    await driver.nextStep(); // Moves to Complete since other steps are hidden

    await driver.waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Onboarding Complete!");
    });
  });

  it("should reveal and validate the 'Family' transition (Married)", async () => {
    const { driver } = await OnboardingFormDriver.renderOnboarding();

    // Fill in Step 1 required fields
    await driver.fill("first_name", "Jane");
    await driver.fill("last_name", "Doe");
    await driver.fill("email", "jane.doe@example.com");

    // 1. Trigger Marital Status change
    await driver.selectOption("marital_status", "Married");
    await driver.selectOption("citizenship_status", "Citizen");

    // 2. Visibility Check: Spouse step should now be accessible
    // In our engine, changing marital_status immediately evaluates visibility.
    // The Spouse step is its own section with ID 'spouse-details'.

    // Navigate to Step 2
    await driver.nextStep();

    // 3. Verify Spouse Name is now VISIBLE and REQUIRED
    await driver.expectVisible("spouse_name", true);

    // Try to trigger NEXT without spouse name
    await driver.nextStep();
    await driver.expectValidationFailure(); // Should fail on Step 2
  });

  it("should reveal and validate the 'Global' transition (Work Visa)", async () => {
    const { driver, container } = await OnboardingFormDriver.renderOnboarding();

    // Fill in Step 1 required fields
    await driver.fill("first_name", "Alex");
    await driver.fill("last_name", "Smith");
    await driver.fill("email", "alex.smith@example.com");

    // 1. Set to Single but Work Visa
    await driver.selectOption("citizenship_status", "Work Visa");

    fs.writeFileSync(__dirname + "/glob_debug.html", container.innerHTML);

    // 2. Navigate to the next visible step (Visa & Legal)
    await driver.nextStep();

    fs.writeFileSync(__dirname + "/glob_debug_after.html", container.innerHTML);

    // 3. Verify Visa Number is VISIBLE
    await driver.expectVisible("visa_number", true);
    await driver.fill("visa_number", "VISA-999-ABC");

    await driver.expectValues({
      visa_number: "VISA-999-ABC",
    });
  });

  it("should enforce Linear Wizard flow and Premium Aesthetic", async () => {
    const { driver, container } = await OnboardingFormDriver.renderOnboarding();

    // 1. Verification: Spacious Density
    await driver.expectPremiumAesthetic();

    // 2. Semantic Stepper Check
    const step1 = container.querySelector(".step-item:nth-child(1)");
    expect(step1?.textContent).toContain("Personal Details");
    expect(step1?.getAttribute("data-active")).toBe("true");

    // 3. Validation Guard
    await driver.nextStep();
    await driver.expectValidationFailure(); // Cannot skip Personal Details
  });
});
