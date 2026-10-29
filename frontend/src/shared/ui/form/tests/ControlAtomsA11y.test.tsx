import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SwitchControl } from "../fields/primitive/controls/SwitchControl";
import { CheckboxControl } from "../fields/primitive/controls/CheckboxControl";
import { RadioControl } from "../fields/primitive/controls/RadioControl";
import { RadioGroup } from "../fields/primitive/controls/RadioGroup";
import { SwitchField } from "../fields/primitive/SwitchField";
import { RadioField } from "../fields/primitive/RadioField";

describe("Control Atoms & WAI-ARIA 1.2+ Accessibility Invariants", () => {
  describe("SwitchControl (Tier 1 Control Atom)", () => {
    it("renders with role='switch' and aria-checked='false' by default", () => {
      render(<SwitchControl id="test-switch" checked={false} />);
      const switchEl = screen.getByRole("switch");
      expect(switchEl).toBeInTheDocument();
      expect(switchEl).toHaveAttribute("aria-checked", "false");
      expect(switchEl).not.toBeChecked();
    });

    it("renders with aria-checked='true' when checked is true", () => {
      render(<SwitchControl id="test-switch" checked={true} />);
      const switchEl = screen.getByRole("switch");
      expect(switchEl).toHaveAttribute("aria-checked", "true");
      expect(switchEl).toBeChecked();
    });

    it("triggers onChange callback with new boolean state when toggled", () => {
      const onChange = vi.fn();
      render(<SwitchControl id="test-switch" checked={false} onChange={onChange} />);
      const switchEl = screen.getByRole("switch");

      fireEvent.click(switchEl);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it("respects disabled state and prevents interactions", () => {
      const onChange = vi.fn();
      render(<SwitchControl id="test-switch" checked={false} disabled onChange={onChange} />);
      const switchEl = screen.getByRole("switch");

      expect(switchEl).toBeDisabled();
      fireEvent.click(switchEl);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("CheckboxControl (Tier 1 Control Atom)", () => {
    it("renders as pure native checkbox without external label", () => {
      render(<CheckboxControl id="test-check" checked={true} />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });

    it("supports indeterminate state natively via DOM property", () => {
      render(<CheckboxControl id="test-check" checked={false} indeterminate />);
      const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
    });

    it("triggers onChange with new boolean state when clicked", () => {
      const onChange = vi.fn();
      render(<CheckboxControl id="test-check" checked={false} onChange={onChange} />);
      const checkbox = screen.getByRole("checkbox");

      fireEvent.click(checkbox);
      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  describe("RadioControl & RadioGroup (WAI-ARIA Roving tabIndex & Arrow Navigation)", () => {
    const testOptions = [
      { value: "small", label: "Small (S)" },
      { value: "medium", label: "Medium (M)" },
      { value: "large", label: "Large (L)" },
    ];

    it("renders a single RadioControl atom with custom indicator", () => {
      render(
        <RadioControl
          id="radio-opt1"
          name="size"
          value="small"
          checked={true}
          onChange={() => {}}
        />
      );
      const radio = screen.getByRole("radio");
      expect(radio).toBeInTheDocument();
      expect(radio).toBeChecked();
    });

    it("applies roving tabIndex: checked option has tabIndex=0, rest have tabIndex=-1", () => {
      render(
        <RadioGroup
          id="size-group"
          name="size"
          value="medium"
          options={testOptions}
        />
      );

      const radios = screen.getAllByRole("radio");
      expect(radios).toHaveLength(3);

      expect(radios[0]).toHaveAttribute("tabindex", "-1"); // Small
      expect(radios[1]).toHaveAttribute("tabindex", "0");  // Medium (checked)
      expect(radios[2]).toHaveAttribute("tabindex", "-1"); // Large
    });

    it("defaults tabIndex=0 to the first enabled option if none is checked", () => {
      render(
        <RadioGroup
          id="size-group"
          name="size"
          options={testOptions}
        />
      );

      const radios = screen.getAllByRole("radio");
      expect(radios[0]).toHaveAttribute("tabindex", "0");  // Small (first enabled)
      expect(radios[1]).toHaveAttribute("tabindex", "-1"); // Medium
      expect(radios[2]).toHaveAttribute("tabindex", "-1"); // Large
    });

    it("implements ArrowDown and ArrowRight keyboard navigation with wrapping", () => {
      const onChange = vi.fn();
      render(
        <RadioGroup
          id="size-group"
          name="size"
          value="small"
          options={testOptions}
          onChange={onChange}
        />
      );

      const group = screen.getByRole("radiogroup");

      // Press ArrowDown: should move from "small" to "medium"
      fireEvent.keyDown(group, { key: "ArrowDown" });
      expect(onChange).toHaveBeenCalledWith("medium");

      // Press ArrowRight from last item "large": should wrap to "small"
      render(
        <RadioGroup
          id="size-group-2"
          name="size"
          value="large"
          options={testOptions}
          onChange={onChange}
        />
      );
      const group2 = screen.getAllByRole("radiogroup")[1];
      fireEvent.keyDown(group2, { key: "ArrowRight" });
      expect(onChange).toHaveBeenCalledWith("small");
    });

    it("implements ArrowUp and ArrowLeft keyboard navigation with wrapping", () => {
      const onChange = vi.fn();
      render(
        <RadioGroup
          id="size-group"
          name="size"
          value="small"
          options={testOptions}
          onChange={onChange}
        />
      );

      const group = screen.getByRole("radiogroup");

      // Press ArrowUp on first item: should wrap to "large"
      fireEvent.keyDown(group, { key: "ArrowUp" });
      expect(onChange).toHaveBeenCalledWith("large");
    });

    it("implements Home and End keyboard navigation", () => {
      const onChange = vi.fn();
      render(
        <RadioGroup
          id="size-group"
          name="size"
          value="medium"
          options={testOptions}
          onChange={onChange}
        />
      );

      const group = screen.getByRole("radiogroup");

      // Press Home: selects first option ("small")
      fireEvent.keyDown(group, { key: "Home" });
      expect(onChange).toHaveBeenCalledWith("small");

      // Press End: selects last option ("large")
      fireEvent.keyDown(group, { key: "End" });
      expect(onChange).toHaveBeenCalledWith("large");
    });
  });

  describe("Autonomous Primitives Integration", () => {
    it("renders SwitchField with inline label without double-wrapping", () => {
      render(
        <SwitchField
          id="theme-switch"
          name="theme"
          label="Dark Mode"
          value={true}
        />
      );

      expect(screen.getByText("Dark Mode")).toBeInTheDocument();
      expect(screen.getByRole("switch")).toBeChecked();
    });

    it("renders RadioField delegating cleanly to RadioGroup", () => {
      const options = [
        { value: "card", label: "Credit Card" },
        { value: "upi", label: "UPI Transfer" },
      ];

      render(
        <RadioField
          id="payment"
          name="paymentMethod"
          value="card"
          options={options}
        />
      );

      expect(screen.getByRole("radiogroup")).toBeInTheDocument();
      const radios = screen.getAllByRole("radio");
      expect(radios).toHaveLength(2);
      expect(radios[0]).toBeChecked();
      expect(radios[1]).not.toBeChecked();
    });
  });
});
