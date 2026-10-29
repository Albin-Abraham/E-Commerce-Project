import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "@ui/form/Form";
import type { FormDefinition } from "@ui/form/types";
import { expect } from "vitest";

import { TEST_FORM_DEFINITION } from "../fixtures/FormSystemTestFixture";
import { renderWithProviders } from "../test-utils";
import { FormDriver } from "./FormDriver";

export class FormSystemDriver extends FormDriver {
  constructor(
    container: HTMLElement,
    user: ReturnType<typeof userEvent.setup>
  ) {
    super(container, user);
  }

  static async render(
    definition: FormDefinition = TEST_FORM_DEFINITION,
    theme?: any
  ) {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <Form definition={definition} theme={theme} />
    );
    return {
      driver: new FormSystemDriver(container, user),
      container,
      user,
    };
  }

  // --- High Level Selectors ---

  getField(id: string) {
    return this.container.querySelector(`#${id}`);
  }

  getLabel(text: string) {
    return screen.getByText(text);
  }

  async clickButton(text: string | RegExp) {
    const btn = await screen.findByRole("button", { name: text });
    await this.user.click(btn);
  }

  // --- Assertions ---

  async expectFieldVisible(id: string) {
    // ALWAYS wait for the field to resolve (handles Suspense)
    await this.waitForField(id);
    const field = this.getWrapper(id);
    if (!field) throw new Error(`Field ensemble for #${id} not found`);
    expect(field).toBeVisible();
  }

  async expectComputedStyle(id: string, property: string, value: string) {
    const field = this.getField(id);
    if (!field) throw new Error(`Field #${id} not found`);
    const computed = window.getComputedStyle(field);
    expect(computed.getPropertyValue(property)).toBe(value);
  }

  async expectClass(id: string, classNamePart: string) {
    const field = this.getWrapper(id);
    if (!field) throw new Error(`Field ensemble for #${id} not found`);
    expect(field.className).toContain(classNamePart);
  }

  /**
   * Specifically validates the Tailwind col-span classes applied by the layout engine.
   * Handles the responsive "col-span-12 md:col-span-X" pattern.
   */
  async expectGridSpan(id: string, span: number) {
    const field = this.getWrapper(id);
    if (!field) throw new Error(`Field ensemble for #${id} not found`);

    // Check for the specific desktop span
    const expectedClass = span === 12 ? "col-span-12" : `md:col-span-${span}`;

    if (!field.className.includes(expectedClass)) {
      throw new Error(
        `Field ${id} expected grid class "${expectedClass}". Found: "${field.className}"`
      );
    }
  }

  /**
   * Validates the surface layer of a card (elevation, border, etc).
   */
  async expectCardStyle(id: string, elevation: string) {
    const card = this.container.querySelector(
      `[data-field-id="${id}"][data-unit="card"]`
    );
    if (!card) throw new Error(`Card container for #${id} not found`);

    // Match based on elevation class or standard rounded-xl
    const shadowClass =
      elevation === "none"
        ? "shadow-none"
        : elevation === "md"
          ? "shadow-premium"
          : `shadow-${elevation}`;

    expect(card.className).toContain("rounded-");
    if (elevation !== "none") {
      expect(card.className).toContain(shadowClass);
    }
  }

  /**
   * Validates shell-level styling for global surfaces (Header, Body, Footer).
   */
  async expectShellPart(selector: string, classNamePart: string) {
    const part = this.container.querySelector(selector);
    if (!part) throw new Error(`Shell part "${selector}" not found`);
    expect(part.className).toContain(classNamePart);
  }

  /**
   * Helper to verify recursive layout attributes.
   */
  async expectLayoutContext(id: string, parentType: string) {
    const element = this.container.querySelector(`[data-field-id="${id}"]`);
    if (!element) throw new Error(`Field #${id} not found`);

    let context: Element | null = null;

    if (parentType === "grid") {
      // Grid layout uses CSS class pattern from renderBoxModel()
      context = element.closest('.grid[class*="grid-cols"]');
    } else {
      // Check for data-parent-layout attribute (for non-grid layouts)
      context = element.closest(`[data-parent-layout="${parentType}"]`);
    }

    if (!context)
      throw new Error(
        `Field #${id} is not contained within a "${parentType}" layout context`
      );
    expect(context).toBeInTheDocument();
  }

  /**
   * Verifies that a field label is present and contains the expected text.
   */
  async expectLabel(id: string, label: string) {
    const element = this.container.querySelector(`label[for="${id}"]`);
    if (!element) throw new Error(`Label for field #${id} not found`);
    expect(element.textContent).toContain(label);
  }
}
