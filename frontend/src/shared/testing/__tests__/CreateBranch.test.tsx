import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";

import { CreateBranchDriver } from "../drivers/CreateBranchDriver";
import scenariosJson from "../fixtures/branch-scenarios.json";

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock global fetch for remoteOptions
global.fetch = vi.fn((input: RequestInfo | URL) => {
  const url =
    typeof input === "string"
      ? input
      : (input as Request).url || input.toString();
  if (url.includes("countries")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([{ name: "United States", iso2: "US" }]),
    } as Response);
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  } as Response);
});

describe("CreateBranch: Modernized Infrastructure Suite (v2.1)", () => {
  it("should enforce validation rules and 5V Vitality", async () => {
    const { driver } = await CreateBranchDriver.render();

    // 1. Submit Identity Step -> Should have validation on Step 1
    await driver.submit();
    await driver.expectValidationFailure();
  }, 30000);

  describe("Scenario Fidelity (Data-Driven)", () => {
    it.each(scenariosJson.scenarios)(
      "Execution: $name",
      async ({ data, expected }) => {
        const { driver } = await CreateBranchDriver.render();

        // Populate form using the Driver's fillForm (Wizard Aware)
        await driver.fillForm(data);

        if (expected === "success") {
          await driver.submit();
          await driver.expectSuccess();
        } else if (expected === "validation_error") {
          await driver.submit();
          await driver.expectValidationFailure();
        }
      },
      30000
    );
  });

  it("should validate Premium Aesthetic (Density & Glassmorphism)", async () => {
    const { driver } = await CreateBranchDriver.render();

    // Verify tokens from BranchUIConfig
    await driver.expectPremiumAesthetic();
    await driver.expectIconFidelity();
  });

  it("should handle namespaced side-effects (Fusion Logic)", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    const { driver } = await CreateBranchDriver.render();

    // Type in Branch Name (Step 1) -> Expect fused onChange meta event
    await driver.fill("name", "New HQ");

    await driver.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[BranchRules] Name Changed: New HQ")
      );
    });

    consoleSpy.mockRestore();
  });

  it("should orchestrate conditional visibility for logistics across steps", async () => {
    const { driver } = await CreateBranchDriver.render();

    // Fill Step 1 required fields
    await driver.fill("name", "Downtown Branch");
    await driver.fill("code", "BR-123");

    // 1. Move to Step 2 (Logistics).
    // Initial openingDate should be HIDDEN because status is null (not 'construction')
    await driver.nextStep();
    await driver.expectVisible("openingDate", false);

    // Fill Step 2 required fields
    await driver.fill("type", "HQ");

    // 2. Navigate through the wizard to Step 4 (Leadership) to change status
    await driver.nextStep(); // To Step 3 (Locations)

    // Fill Step 3 required fields
    await driver.fill("address.line1", "123 Main St");
    await driver.fill("address.city", "Springfield");
    await driver.fill("address.state", "IL");

    await driver.nextStep(); // To Step 4 (Leadership)

    // Set status to 'construction' which triggers the 'show' condition for openingDate
    await driver.fill("status", "construction");

    // 3. Verification: Go back to Step 2 to see the field revealed by the cross-step trigger
    if (driver.hasButton("Back")) {
      await driver.prevStep(); // Back to Step 3
      await driver.prevStep(); // Back to Step 2
    }

    // Now it should be visible!
    await driver.expectVisible("openingDate", true);
  }, 30000);
});
