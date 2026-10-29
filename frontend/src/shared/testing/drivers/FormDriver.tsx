import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "@ui/form/Form";
import type { FormDefinition } from "@ui/form/types";
import { expect } from "vitest";

import { renderWithProviders } from "../test-utils";
import { BaseDriver } from "./BaseDriver";

/**
 * FormDriver - The Semantic Expert Layer
 *
 * Inherits all mechanical power from BaseDriver but provides
 * business-logic oriented methods for testing forms.
 */
export class FormDriver extends BaseDriver {
  protected user: ReturnType<typeof userEvent.setup>;

  constructor(
    container: HTMLElement,
    user: ReturnType<typeof userEvent.setup> = userEvent.setup()
  ) {
    super(container);
    this.user = user;
  }

  /**
   * Generic Form Renderer for isolated FormDefinition
   */
  static async render(
    definition: FormDefinition<any>,
    theme?: any,
    initialData?: any,
    onSubmit?: (data: any) => Promise<any> | void
  ) {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <Form
        definition={definition}
        theme={theme}
        initialData={initialData}
        onSubmit={onSubmit || (definition.events?.onSubmit as any)}
      />
    );

    return {
      driver: new FormDriver(container, user),
      container,
      user,
    };
  }

  /**
   * Specialized Renderer for Page Components
   */
  static async renderGeneric(
    Component: React.ComponentType<any>,
    props: any = {}
  ) {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<Component {...props} />);

    return {
      container,
      user,
    };
  }

  // --- Semantic Interactions ---

  /**
   * Fills a field by its metadata name (handles recursion & types via BaseDriver)
   */
  public async fill(name: string, value: any) {
    await this.waitForFieldName(name);
    await this.setFieldValueByName(name, value);
    return this;
  }

  /**
   * Clicks the primary submit button of the form
   */
  public async submit() {
    // Look for a button with type="submit" — the most stable semantic hook
    // Fall back to common role/name if necessary
    const button =
      (this.container.querySelector('button[type="submit"]') as HTMLElement) ||
      (this.container.querySelector(
        '[data-part="submit-btn"]'
      ) as HTMLElement) ||
      (this.container.querySelector(
        ".form-footer button:last-child"
      ) as HTMLElement) ||
      (await screen.findByRole("button", {
        name: /submit|save|complete|login|registration|next step|continue/i,
      }));

    if (!button)
      throw new Error(
        "Submit button not found (looked for type='submit', data-part='submit-btn', and common labels)"
      );

    await this.user.click(button);
    return this;
  }

  /**
   * Navigates to the next step in a wizard
   */
  public async nextStep() {
    const button = await within(this.container).findByRole("button", {
      name: /next step|continue|register|submit|complete|save/i,
    });
    await this.user.click(button);
    // Wait for transition animation to finish and DOM to settle
    await new Promise((r) => setTimeout(r, 600));
    return this;
  }

  /**
   * Navigates to the previous step in a wizard
   */
  public async prevStep() {
    const button = await within(this.container).findByRole("button", {
      name: /back|previous/i,
    });
    await this.user.click(button);
    // Wait for transition animation to finish and DOM to settle
    await new Promise((r) => setTimeout(r, 600));
    return this;
  }

  // --- 5V Matrix Assertions ---

  /**
   * Verifies that a field is visible in the DOM.
   * Auto-waits for the field to appear.
   */
  public async expectVisible(name: string, visible: boolean = true) {
    if (visible) {
      // In a wizard, a field might be "hidden" because it's on a different step.
      // We wait for it to appear (which gives us time to navigate if needed in the test logic)
      await this.waitForFieldName(name);
      const wrapper = this.getWrapperByName(name);
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toBeVisible();
    } else {
      const wrapper = this.getWrapperByName(name);
      expect(wrapper).not.toBeInTheDocument();
    }
  }

  /**
   * Verifies that a field has the expected error message.
   */
  public async expectError(name: string, message: string | RegExp) {
    const wrapper = this.getWrapperByName(name);
    if (!wrapper) throw new Error(`Field ensemble for "${name}" not found`);

    // Feedback is usually in the form-field__error or similar slot
    await this.waitFor(() => {
      const el =
        wrapper.querySelector('[role="alert"]') ||
        wrapper.querySelector(".text-danger") ||
        within(wrapper).queryByText(message as any);
      if (!el) throw new Error(`Error message for "${name}" not found`);
    });

    const errorEl =
      wrapper.querySelector('[role="alert"]') ||
      wrapper.querySelector(".text-danger") ||
      within(wrapper).getByText(message as any);

    expect(errorEl.textContent).toMatch(message);
  }

  /**
   * Verifies value sync using name
   */
  public async expectValue(name: string, value: any) {
    const actual = await this.getFieldValueByName(name);
    expect(actual).toEqual(value);
  }

  /**
   * Verifies multiple values using name
   */
  public async expectValues(values: Record<string, any>) {
    for (const [name, value] of Object.entries(values)) {
      await this.expectValue(name, value);
    }
  }

  /**
   * Expects validation feedback to be present on the form
   */
  public async expectValidationFailure() {
    const errorClasses = [
      ".text-danger",
      "[role='alert']",
      ".form-field__error",
    ];

    await this.waitFor(() => {
      const hasError = errorClasses.some((cls) =>
        this.container.querySelector(cls)
      );
      if (!hasError)
        throw new Error(
          "Expected validation failure, but no error elements found"
        );
    });
  }
}

export { within };
