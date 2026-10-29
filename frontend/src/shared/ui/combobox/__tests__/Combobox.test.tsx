import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import "vitest-axe/extend-expect";

expect.extend(matchers);

import {
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxOption,
  ComboboxEmpty,
} from "../index";

const TestCombobox: React.FC<{
  defaultValue?: string | null;
  onValueChange?: (val: string) => void;
}> = ({ defaultValue = null, onValueChange }) => {
  return (
    <Combobox defaultValue={defaultValue} onValueChange={onValueChange}>
      <label htmlFor="fruit-select">Choose a fruit</label>
      <ComboboxInput id="fruit-select" placeholder="Select fruit..." />
      <ComboboxList aria-label="Fruit choices">
        <ComboboxOption value="apple" label="Apple" />
        <ComboboxOption value="banana" label="Banana" />
        <ComboboxOption value="cherry" label="Cherry" disabled />
        <ComboboxOption value="date" label="Date" />
        <ComboboxEmpty>No fruits found.</ComboboxEmpty>
      </ComboboxList>
    </Combobox>
  );
};

describe("Composite Combobox Component", () => {
  it("renders with correct ARIA combobox attributes", () => {
    render(<TestCombobox />);

    const input = screen.getByRole("combobox", { name: "Choose a fruit" });
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-haspopup", "listbox");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).not.toHaveAttribute("aria-activedescendant");
  });

  it("opens listbox on focus and expands aria-expanded", () => {
    render(<TestCombobox />);

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);

    expect(input).toHaveAttribute("aria-expanded", "true");
    const listbox = screen.getByRole("listbox", { name: "Fruit choices" });
    expect(listbox).toBeInTheDocument();
  });

  it("navigates options with ArrowDown and ArrowUp, updating aria-activedescendant and skipping disabled options", () => {
    render(<TestCombobox />);

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);

    // Press ArrowDown -> Highlights Apple
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const appleOption = screen.getByText("Apple").closest("[role='option']");
    expect(appleOption).toHaveAttribute("data-highlighted", "true");
    expect(input).toHaveAttribute("aria-activedescendant", appleOption?.id);

    // Press ArrowDown again -> Highlights Banana
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const bananaOption = screen.getByText("Banana").closest("[role='option']");
    expect(bananaOption).toHaveAttribute("data-highlighted", "true");
    expect(input).toHaveAttribute("aria-activedescendant", bananaOption?.id);

    // Press ArrowDown again -> Skips disabled Cherry and highlights Date
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const dateOption = screen.getByText("Date").closest("[role='option']");
    expect(dateOption).toHaveAttribute("data-highlighted", "true");
    expect(input).toHaveAttribute("aria-activedescendant", dateOption?.id);

    // Press ArrowUp -> Returns to Banana
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(bananaOption).toHaveAttribute("data-highlighted", "true");
  });

  it("selects highlighted option on Enter key and closes dropdown", () => {
    const onValueChange = vi.fn();
    render(<TestCombobox onValueChange={onValueChange} />);

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);

    fireEvent.keyDown(input, { key: "ArrowDown" }); // Apple
    fireEvent.keyDown(input, { key: "ArrowDown" }); // Banana
    fireEvent.keyDown(input, { key: "Enter" }); // Select

    expect(onValueChange).toHaveBeenCalledWith("banana");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveValue("Banana");
  });

  it("filters options when user types and shows ComboboxEmpty when no options match", () => {
    render(<TestCombobox />);

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "xyz" } });

    expect(screen.getByText("No fruits found.")).toBeInTheDocument();
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("closes dropdown on Escape key", () => {
    render(<TestCombobox />);

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    expect(input).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("has zero axe accessibility violations when open", async () => {
    const { container } = render(<TestCombobox />);
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
