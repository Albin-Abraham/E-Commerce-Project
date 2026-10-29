import { expect, vi } from "vitest";

import CreateBranch from "@pages/static-pages/CreateBranch";

import { FormDriver } from "./FormDriver";

/**
 * CreateBranchDriver - The Specialized Infrastructure Expert
 *
 * Inherits semantic power from FormDriver (v2.1).
 */
export class CreateBranchDriver extends FormDriver {
  /**
   * Specialized Renderer for the CreateBranch Page
   */
  public static async render() {
    // Mock alert since the component uses it for success feedback
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    const { container, user } = await FormDriver.renderGeneric(CreateBranch);

    // Create driver instance with standard setup
    const driver = new CreateBranchDriver(container, user);
    return { driver, alertMock, container, user };
  }

  /**
   * High-Level Business Flow: Deploy a new branch
   */
  public async deployBranch(data: any) {
    await this.fillForm(data);
    await this.submit();
    return this;
  }

  /**
   * Fill entire form using metadata-driven names.
   * WIZARD AWARE: Automatically navigates through steps as it finds data.
   */
  public async fillForm(data: any) {
    // Step 1: Identity
    if (data.name) await this.fill("name", data.name);
    if (data.code) await this.fill("code", data.code);

    // Step 2: Logistics (Navigates if openingDate/type not visible)
    if (data.openingDate || data.type) {
      if (
        !this.getWrapperByName("openingDate") &&
        !this.getWrapperByName("type")
      ) {
        await this.nextStep();
        if (
          !this.getWrapperByName("openingDate") &&
          !this.getWrapperByName("type")
        ) {
          return this; // Blocked by Step 1 validation
        }
      }
      if (data.type) await this.fill("type", data.type);
      // openingDate may be conditionally hidden — only fill if visible
      if (data.openingDate && this.getWrapperByName("openingDate")) {
        await this.fill("openingDate", data.openingDate);
      }
    }

    // Step 3: Locations (Navigates if address.line1 is missing)
    if (data.address) {
      if (!this.getWrapperByName("address.line1")) {
        await this.nextStep();
        if (!this.getWrapperByName("address.line1")) {
          return this; // Blocked by Step 2 validation
        }
      }
      if (data.address.line1)
        await this.fill("address.line1", data.address.line1);
      if (data.address.city) await this.fill("address.city", data.address.city);
      if (data.address.state)
        await this.fill("address.state", data.address.state);
    }

    // Step 4: Leadership (Navigates if manager is missing)
    if (data.manager || data.status) {
      if (!this.getWrapperByName("manager") && this.hasButton(/Next Step/i)) {
        await this.nextStep();
        if (
          !this.getWrapperByName("manager") &&
          !this.getWrapperByName("status")
        ) {
          return this; // Blocked by Step 3 validation
        }
      }
      if (data.manager) await this.fill("manager", data.manager);
      if (data.status) await this.fill("status", data.status);
    }

    return this;
  }

  /**
   * Style-Aware Checks (The "Smart Work" way)
   */
  public async expectPremiumAesthetic() {
    // 1. Check for 'spacious' density on the form root
    const root = this.container.querySelector(".form-root");
    expect(root).toHaveClass("form-root--spacious");

    // 2. Check for Glass Cards
    const cards = this.container.querySelectorAll('[data-layout-type="card"]');
    cards.forEach((card) => {
      expect(card).toHaveClass("glass");
      expect(card).toHaveClass("shadow-premium");
    });

    // 3. Icon Fidelity (Skip fields not in current step)
    await this.expectIconFidelity();
  }

  /**
   * Verify Icon Mapping Fidelity (Skips hidden fields in wizard)
   */
  public async expectIconFidelity() {
    const fieldsWithIcons = ["name", "code", "type", "openingDate", "manager"];
    for (const name of fieldsWithIcons) {
      const wrapper = this.container.querySelector(
        `[data-field-name="${name}"]`
      );
      if (!wrapper) continue; // Skip if hidden on other wizard steps

      const icon = wrapper.querySelector("svg");
      expect(icon).toBeInTheDocument();
    }
  }

  public async expectSuccess() {
    await this.waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Branch Deployed Successfully!"
      );
    }, 4000);
  }

  public async expectValidationFailure() {
    // Use the 5V Matrix: Vitality (Alerts present)
    await this.waitFor(() => {
      const alerts = this.container.querySelectorAll('[role="alert"]');
      if (alerts.length === 0) throw new Error("No validation alerts found");
    });
  }
}
