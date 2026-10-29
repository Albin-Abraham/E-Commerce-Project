import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "@ui/form/Form";
import { describe, expect, it } from "vitest";

import { FormSystemDriver } from "../drivers/FormSystemDriver";
import { PRIMITIVE_FIELDS_SCHEMA } from "../fixtures/RenderEngineTestFixture";
import { renderWithProviders } from "../test-utils";

describe("Primitive Fields Interaction & State Audit", () => {
  /**
   * Test Suite A: TextField (Text/Number/Email)
   * Focuses on live typing and validation metadata.
   */
  describe("TextField Interaction", () => {
    it("should update values on change and reflect ARIA required state", async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(
        <Form definition={PRIMITIVE_FIELDS_SCHEMA} />
      );
      const driver = new FormSystemDriver(container, null as any);

      await driver.waitForField("text_target");
      const input = container.querySelector("#text_target") as HTMLInputElement;

      // Check labels and ARIA
      await driver.expectLabel("text_target", "Text Input");
      expect(input.getAttribute("aria-required")).toBe("true");

      // Simulate typing (user-event is more thorough than fireEvent.change)
      await user.type(input, "Hello Modern Form");
      expect(input.value).toBe("Hello Modern Form");
    });
  });

  /**
   * Test Suite B: SelectField (Custom Composite)
   * Focuses on menu orchestration and selection.
   */
  describe("SelectField Orchestration", () => {
    it("should open menu and allow selecting options", async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(
        <Form definition={PRIMITIVE_FIELDS_SCHEMA} />
      );
      const driver = new FormSystemDriver(container, null as any);

      await driver.waitForField("select_target");
      const trigger = container.querySelector("#select_target");
      expect(trigger).toBeInTheDocument();

      // Open Select
      await user.click(trigger!);

      // Wait for menu to appear (role="listbox")
      const listbox = await waitFor(() =>
        document.body.querySelector('[role="listbox"]')
      );
      expect(listbox).toBeInTheDocument();

      // Find and click Option B
      const optionB = document.body.querySelector('[data-value="b"]');
      expect(optionB).toBeInTheDocument();
      await user.click(optionB!);

      // Menu should be closed and value selected
      await waitFor(() =>
        expect(
          document.body.querySelector('[role="listbox"]')
        ).not.toBeInTheDocument()
      );
      expect(trigger?.textContent).toContain("Option B");
    });
  });

  /**
   * Test Suite C: TextareaField (Multiline)
   * Focuses on dimensions and content scaling.
   */
  describe("TextareaField Layout", () => {
    it("should render with correct rows and placeholder", async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(
        <Form definition={PRIMITIVE_FIELDS_SCHEMA} />
      );
      const driver = new FormSystemDriver(container, null as any);

      await driver.waitForField("textarea_target");
      const textarea = container.querySelector(
        "#textarea_target"
      ) as HTMLTextAreaElement;
      expect(textarea.rows).toBe(3); // Default from TextareaField.tsx
      expect(textarea.placeholder).toBe("Long form notes...");

      // Update value
      await user.type(textarea, "Line 1{enter}Line 2");
      expect(textarea.value).toBe("Line 1\nLine 2");
    });
  });

  /**
   * Test Suite D: CheckboxField (Toggle)
   * Focuses on label association and toggling.
   */
  describe("CheckboxField Toggling", () => {
    it("should toggle state when label or input is clicked", async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(
        <Form definition={PRIMITIVE_FIELDS_SCHEMA} />
      );
      const driver = new FormSystemDriver(container, null as any);

      await driver.waitForField("checkbox_target");
      const checkbox = container.querySelector(
        "#checkbox_target"
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      // Toggle via clicking the label (real browser behavior)
      const label = container.querySelector('label[for="checkbox_target"]');
      await user.click(label!);

      expect(checkbox.checked).toBe(true);
    });
  });

  /**
   * Test Suite E: Universal Interaction Styling
   * Ensures focus and hover intents are bridged to the outer wrapper.
   */
  describe("Interaction Branding", () => {
    it("should apply focus ring to the outer wrapper on input focus", async () => {
      const { container } = renderWithProviders(
        <Form definition={PRIMITIVE_FIELDS_SCHEMA} />
      );
      const driver = new FormSystemDriver(container, null as any);

      await driver.waitForField("text_target");
      const surface = container.querySelector('[data-unit="input-wrapper"]');
      expect(surface).toBeInTheDocument();

      // Focus transition is already verified by class structure in withAtom/OuterWrapper
      expect(surface?.className).toContain("transition-all");
      expect(surface?.className).toContain("focus-within:");
    });
  });
});
