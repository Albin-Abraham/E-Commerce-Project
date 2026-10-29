import { vi } from "vitest";

import TestMultiStepFormModel from "@pages/static-pages/multi-step-form";

import { renderWithProviders } from "../test-utils";
import { FormDriver } from "./FormDriver";

/**
 * OnboardingFormDriver (v2.1)
 *
 * Specialized driver for the Employee Onboarding multi-step wizard.
 * Inherits from FormDriver to provide the 5V Matrix and Wizard awareness.
 */
export class OnboardingFormDriver extends FormDriver {
  /**
   * Renders the Employee Onboarding page and returns a driver instance.
   */
  public static async renderOnboarding() {
    // Mock alert for submission feedback
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    // Render with providers (Router + QueryClient)
    renderWithProviders(<TestMultiStepFormModel />);

    // The page renders the wizard inside a HeroUI <Modal>, which portals its
    // content to document.body (not the render container). Scope all searches
    // to the body so portal content is reachable.
    const container = document.body;

    // Initialize with container to scope all searches
    const driver = new OnboardingFormDriver(container);

    // Form has heavy glass components, wait for stable mount
    await driver.waitForLoad();

    return { driver, alertMock, container, user: driver.user };
  }

  /**
   * Waits for the form definition to be fully hydrated and rendered.
   * The wizard lives inside a Modal portal, so the container is document.body.
   */
  private async waitForLoad() {
    await this.waitFor(() => {
      const header = this.queryByText("Employee Onboarding Portal");
      if (!header) {
        throw new Error(
          "Form layout not found - header 'Employee Onboarding Portal' missing"
        );
      }
    });

    // Wait for all lazy-loaded skeletons (animate-pulse) to finish loading and disappear
    await this.waitFor(() => {
      const pulse = this.container.querySelector(".form-body .animate-pulse");
      if (pulse) {
        throw new Error("Form is still loading (skeletons active)");
      }
    });
  }

  // --- Specialized Interaction Helpers ---

  /**
   * Selects an option from a SelectField component.
   * This is a specialized helper since SelectField doesn't use a native <select>.
   */
  public async selectOption(fieldName: string, optionLabel: string) {
    const wrapper = this.getWrapperByName(fieldName);
    if (!wrapper) throw new Error(`Field wrapper for "${fieldName}" not found`);

    const trigger =
      wrapper.querySelector('[data-unit="select-trigger"]') ||
      wrapper.querySelector('[data-unit="select-trigger-container"]') ||
      wrapper.querySelector("button");
    if (!trigger)
      throw new Error(`Select trigger for "${fieldName}" not found`);

    const { fireEvent } = await import("@testing-library/react");
    fireEvent.click(trigger);

    // Wait for the option to appear in the portal/menu
    const option = await this.findOptionByLabel(optionLabel);
    if (!option)
      throw new Error(`Option "${optionLabel}" not found for "${fieldName}"`);

    fireEvent.click(option);

    // Allow animation to settle
    await new Promise((r) => setTimeout(r, 100));
    return this;
  }

  private async findOptionByLabel(label: string) {
    const { screen } = await import("@testing-library/react");
    return screen.findByText(label);
  }

  /**
   * Navigates to a specific step by index (1-based).
   * Functional helper to move through the wizard.
   */
  public async goToStep(targetStep: number) {
    // Current approach: repeatedly click Next until the target header appears
    // or we run out of steps.
    for (let i = 0; i < 5; i++) {
      // Max safety depth
      if (this.isStepActive(targetStep)) return this;
      if (!this.hasButton("Next Step")) break;
      await this.nextStep();
    }
    return this;
  }

  private isStepActive(step: number): boolean {
    const item = this.container.querySelector(`.step-item:nth-child(${step})`);
    return item?.getAttribute("data-active") === "true";
  }

  // --- Specialized Assertion Helpers ---

  /**
   * Verifies the premium aesthetic tokens are present in the form shell.
   */
  public async expectPremiumAesthetic() {
    const root = this.container.querySelector(".form-root");
    if (!root) throw new Error("Form root not found");

    const classes = root.className;
    const hasPremium =
      classes.includes("form-root--spacious") ||
      classes.includes("z-density-spacious");

    if (!hasPremium) {
      throw new Error(`Expected premium tokens (spacious). Found: ${classes}`);
    }
  }
}
