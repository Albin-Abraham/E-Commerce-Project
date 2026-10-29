// src/testing/__tests__/WizardOrchestration.test.tsx
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "@ui/form/Form";
import { describe, expect, it } from "vitest";

import { FormSystemDriver } from "../drivers/FormSystemDriver";
import { VEHICLE_WIZARD_SCHEMA } from "../fixtures/RenderEngineTestFixture";
import { renderWithProviders } from "../test-utils";

describe("Wizard Orchestration & Navigation Audit", () => {
  /**
   * Test Suite A: Step Isolation
   * Ensures that only the current step's fields are mounted.
   */
  describe("Step Transition Logic", () => {
    it("should mount Step 1 by default and transition to Step 2 on 'Next'", async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(
        <Form definition={VEHICLE_WIZARD_SCHEMA} />
      );
      const driver = new FormSystemDriver(container, null as any);

      // 1. Verify Step 1
      await driver.waitForField("reg_number");
      // Use Role + Name to ensure we find the heading and not a stepper label
      expect(
        await screen.findByRole("heading", { name: /Vehicle Information/i })
      ).toBeInTheDocument();
      expect(container.querySelector("#reg_number")).toBeInTheDocument();

      // Fill required fields to satisfy Step 1 validation
      const regInput = container.querySelector(
        "#reg_number"
      ) as HTMLInputElement;
      const engineInput = container.querySelector(
        "#engine_number"
      ) as HTMLInputElement;
      await user.type(regInput, "REG-123");
      await user.type(engineInput, "ENG-456");

      // Step 2 fields should NOT be in the DOM
      expect(
        container.querySelector("#class_of_vehicle")
      ).not.toBeInTheDocument();

      // 2. Click Next Step
      const nextBtn = await screen.findByText("Next Step");
      await user.click(nextBtn);

      // 3. Verify Step 2
      await driver.waitForField("class_of_vehicle");
      expect(
        await screen.findByRole("heading", { name: /Vehicle Classification/i })
      ).toBeInTheDocument();
      expect(container.querySelector("#class_of_vehicle")).toBeInTheDocument();

      // Step 1 fields should now be unmounted
      expect(container.querySelector("#reg_number")).not.toBeInTheDocument();
    });

    it("should allow navigating back to a previous step", async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(
        <Form definition={VEHICLE_WIZARD_SCHEMA} />
      );
      const driver = new FormSystemDriver(container, null as any);

      // Move to Step 2
      await driver.waitForField("reg_number");
      const regInput = container.querySelector(
        "#reg_number"
      ) as HTMLInputElement;
      const engineInput = container.querySelector(
        "#engine_number"
      ) as HTMLInputElement;
      await user.type(regInput, "REG-123");
      await user.type(engineInput, "ENG-456");

      await user.click(await screen.findByText("Next Step"));

      await driver.waitForField("class_of_vehicle");
      const backBtn = await screen.findByText("Back");
      expect(backBtn).toBeInTheDocument();

      // Click Back
      await user.click(backBtn);

      // Back to Step 1
      await driver.waitForField("reg_number");
      expect(container.querySelector("#reg_number")).toBeInTheDocument();
    });
  });

  /**
   * Test Suite B: Sidebar Stepper Integration
   * Verifies that the sidebar accurately reflects form progress.
   */
  describe("Stepper Synchronization", () => {
    it("should highlight the active step in the sidebar", async () => {
      const { container } = renderWithProviders(
        <Form definition={VEHICLE_WIZARD_SCHEMA} />
      );
      const driver = new FormSystemDriver(container, null as any);

      await driver.waitForField("reg_number");

      // Verify Step 1 is active in the sidebar
      const stepItems = container.querySelectorAll(
        '[data-part="stepper-item"]'
      );
      expect(stepItems[0]).toHaveAttribute("data-active", "true");
      expect(stepItems[1]).toHaveAttribute("data-active", "false");

      // Check text label inside the specific step wrapper
      const stepTitle = stepItems[0].querySelector(
        '[data-part="stepper-label"]'
      );
      expect(stepTitle?.textContent).toContain("Vehicle Information");
    });
  });

  /**
   * Test Suite C: Submit Label Resolution
   * Ensures the final step correctly shows the form's submitLabel.
   */
  describe("Termination Logic", () => {
    it("should show 'Complete Registration' only on the final step", async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(
        <Form definition={VEHICLE_WIZARD_SCHEMA} />
      );
      const driver = new FormSystemDriver(container, null as any);

      // Step 1 -> Step 2
      await driver.waitForField("reg_number");
      const regInput = container.querySelector(
        "#reg_number"
      ) as HTMLInputElement;
      const engineInput = container.querySelector(
        "#engine_number"
      ) as HTMLInputElement;
      await user.type(regInput, "REG-123");
      await user.type(engineInput, "ENG-456");

      await user.click(await screen.findByText("Next Step"));

      // Step 2 -> Step 3
      await driver.waitForField("class_of_vehicle");
      await user.click(await screen.findByText("Next Step"));

      // Final Step (Step 3)
      await driver.waitForField("purchase_amount");
      expect(
        await screen.findByRole("heading", { name: /Purchase Information/i })
      ).toBeInTheDocument();

      // The button should now reflect the schema's submitLabel
      expect(screen.queryByText("Next Step")).not.toBeInTheDocument();
      expect(
        await screen.findByText("Complete Registration")
      ).toBeInTheDocument();
    });
  });
});
