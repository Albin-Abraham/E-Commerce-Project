import React, { useRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import "vitest-axe/extend-expect";

expect.extend(matchers);

import { useEventRegistry } from "@core/events/stores/eventRegistry.store";
import { SkipLink } from "../SkipLink";
import { LiveAnnouncer, announce } from "../LiveAnnouncer";
import { mergeAriaDescribedBy } from "../useAriaDescribedBy";
import { useFocusTrap } from "../useFocusTrap";
import { HelpText } from "../../form/atoms/HelpText";
import { FieldShell } from "../../form/structure/FieldShell";
import { TextField } from "../../form/fields/primitive/TextField";
import { CheckboxField } from "../../form/fields/primitive/CheckboxField";
import { SwitchField } from "../../form/fields/primitive/SwitchField";

describe("Accessibility Foundations Suite", () => {
  describe("SkipLink", () => {
    it("renders with correct target, sr-only class, and attributes", () => {
      render(<SkipLink targetId="main-content" />);
      const link = screen.getByTestId("skip-link");
      expect(link).toHaveAttribute("href", "#main-content");
      expect(link.className).toContain("sr-only");
      expect(link.className).toContain("focus:not-sr-only");
      expect(link).toHaveTextContent("Skip to main content");
    });

    it("has zero axe accessibility violations", async () => {
      const { container } = render(
        <main id="main-content">
          <SkipLink targetId="main-content" />
          <h1>Main Content Area</h1>
        </main>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("LiveAnnouncer", () => {
    it("renders polite and assertive live regions with correct ARIA roles", () => {
      render(<LiveAnnouncer />);
      const polite = document.getElementById("live-announcer-polite");
      const assertive = document.getElementById("live-announcer-assertive");

      expect(polite).toHaveAttribute("role", "status");
      expect(polite).toHaveAttribute("aria-live", "polite");
      expect(polite).toHaveAttribute("aria-atomic", "true");

      expect(assertive).toHaveAttribute("role", "alert");
      expect(assertive).toHaveAttribute("aria-live", "assertive");
      expect(assertive).toHaveAttribute("aria-atomic", "true");
    });

    it("announces polite and assertive messages", async () => {
      render(<LiveAnnouncer />);
      act(() => {
        announce("Data refreshed", "polite");
        announce("Network error occurred", "assertive");
      });

      // requestAnimationFrame is used for clean re-announcement
      await new Promise((r) => requestAnimationFrame(r));

      expect(document.getElementById("live-announcer-polite")?.textContent).toBe(
        "Data refreshed"
      );
      expect(
        document.getElementById("live-announcer-assertive")?.textContent
      ).toBe("Network error occurred");
    });

    it("has zero axe violations", async () => {
      const { container } = render(<LiveAnnouncer />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("useAriaDescribedBy / mergeAriaDescribedBy", () => {
    it("merges multiple string IDs into space-separated string", () => {
      expect(mergeAriaDescribedBy("field-help", "field-error")).toBe(
        "field-help field-error"
      );
    });

    it("filters out falsy and duplicate values", () => {
      expect(
        mergeAriaDescribedBy("field-help", undefined, false, null, "field-help", "field-tooltip")
      ).toBe("field-help field-tooltip");
    });

    it("returns undefined when no valid IDs provided", () => {
      expect(mergeAriaDescribedBy(undefined, false, null)).toBeUndefined();
    });
  });

  describe("HelpText", () => {
    it("renders accessible button trigger with role=tooltip container", () => {
      render(<HelpText id="tax-help" text="Enter tax identification code." />);
      const trigger = screen.getByRole("button", { name: "More information" });
      expect(trigger).toHaveAttribute("aria-describedby", "tax-help");

      const tooltip = document.getElementById("tax-help");
      expect(tooltip).toHaveAttribute("role", "tooltip");
      expect(tooltip).toHaveTextContent("Enter tax identification code.");
    });

    it("dismisses tooltip on Escape key", () => {
      render(<HelpText id="tax-help" text="Enter tax identification code." />);
      const trigger = screen.getByRole("button", { name: "More information" });
      fireEvent.focus(trigger);

      const tooltip = document.getElementById("tax-help");
      expect(tooltip).toHaveAttribute("aria-hidden", "false");

      fireEvent.keyDown(trigger.parentElement!, { key: "Escape" });
      expect(tooltip).toHaveAttribute("aria-hidden", "true");
    });

    it("has zero axe accessibility violations", async () => {
      const { container } = render(
        <div>
          <label htmlFor="tax-id">Tax ID</label>
          <HelpText id="tax-id-help" text="Nine digit identification number" />
          <input id="tax-id" type="text" aria-describedby="tax-id-help" />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("useFocusTrap", () => {
    function TrapTestComponent({
      scope,
      onEscape,
    }: {
      scope?: string;
      onEscape?: () => void;
    }) {
      const ref = useRef<HTMLDivElement>(null);
      useFocusTrap(ref, { active: true, scope, onEscape });

      return (
        <div ref={ref} tabIndex={-1}>
          <button id="btn-1">Button 1</button>
          <button id="btn-2">Button 2</button>
        </div>
      );
    }

    it("activates scope in useEventRegistry and restores previous scope on unmount", () => {
      useEventRegistry.getState().setActiveScope("global");

      const { unmount } = render(<TrapTestComponent scope="modal:test" />);
      expect(useEventRegistry.getState().activeScope).toBe("modal:test");

      unmount();
      expect(useEventRegistry.getState().activeScope).toBe("global");
    });

    it("fires onEscape handler when Escape is pressed", () => {
      const handleEscape = vi.fn();
      render(<TrapTestComponent onEscape={handleEscape} />);

      fireEvent.keyDown(document, { key: "Escape" });
      expect(handleEscape).toHaveBeenCalledTimes(1);
    });
  });

  describe("Form Shell & Primitives Accessibility Integration", () => {
    it("coordinates multi-ID aria-describedby, aria-invalid, and required indicators", () => {
      render(
        <FieldShell
          id="email"
          name="email"
          type="text"
          label="Email Address"
          required
          description="We will never share your email."
          error="Please provide a valid email format."
        >
          <TextField id="email" name="email" />
        </FieldShell>
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-required", "true");
      expect(input).toHaveAttribute("aria-errormessage", "email-error");
      expect(input).toHaveAttribute(
        "aria-describedby",
        "email-help email-error"
      );

      const errorAlert = screen.getByRole("alert");
      expect(errorAlert).toHaveAttribute("id", "email-error");
      expect(errorAlert).toHaveAttribute("aria-live", "assertive");

      const requiredIndicator = screen.getByText("(required)");
      expect(requiredIndicator.className).toContain("sr-only");
    });

    it("integrates CheckboxField with shell context and ARIA attributes", () => {
      render(
        <FieldShell
          id="terms"
          name="terms"
          type="checkbox"
          label="I agree to terms"
          required
          error="You must agree to continue"
        >
          <CheckboxField id="terms" name="terms" />
        </FieldShell>
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveAttribute("aria-invalid", "true");
      expect(checkbox).toHaveAttribute("aria-required", "true");
      expect(checkbox).toHaveAttribute("aria-errormessage", "terms-error");
      expect(checkbox).toHaveAttribute("aria-describedby", "terms-error");
    });

    it("integrates SwitchField with role=switch, aria-checked, and ARIA attributes", () => {
      render(
        <FieldShell
          id="notifications"
          name="notifications"
          type="switch"
          label="Notifications"
          description="Receive daily digest"
        >
          <SwitchField id="notifications" name="notifications" value={true} role="switch" />
        </FieldShell>
      );

      const switchInput = screen.getByRole("switch");
      expect(switchInput).toHaveAttribute("aria-checked", "true");
      expect(switchInput).toHaveAttribute("aria-describedby", "notifications-help");
    });


    it("has zero axe accessibility violations for complete composite form field", async () => {
      const { container } = render(
        <form>
          <FieldShell
            id="full-name"
            name="fullName"
            type="text"
            label="Full Name"
            required
            description="Enter your given and family name."
          >
            <TextField id="full-name" name="fullName" />
          </FieldShell>
        </form>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
