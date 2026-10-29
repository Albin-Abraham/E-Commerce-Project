import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SelectField } from "../SelectField";

describe("SelectField Accessibility (ARIA) & Keyboard Navigation", () => {
  const mockField = {
    id: "user-role-select",
    name: "role",
    label: "User Role",
    options: [
      { label: "Administrator", value: "admin" },
      { label: "Editor", value: "editor" },
      { label: "Viewer", value: "viewer" },
    ],
  } as any;

  it("renders with correct ARIA combobox attributes", () => {
    render(
      <SelectField
        field={mockField}
        layout={{} as any}
        value="admin"
        onChange={vi.fn()}
      />
    );

    const trigger = screen.getByRole("combobox", { name: "User Role" });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-controls", "user-role-select-menu");
  });

  it("opens menu and renders options with role='option' and IDs on click", async () => {
    const user = userEvent.setup();
    render(
      <SelectField
        field={mockField}
        layout={{} as any}
        value="admin"
        onChange={vi.fn()}
      />
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();
    expect(listbox).toHaveAttribute("id", "user-role-select-menu");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveAttribute("id", "user-role-select-opt-admin");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(options[1]).toHaveAttribute("id", "user-role-select-opt-editor");
    expect(options[1]).toHaveAttribute("aria-selected", "false");
  });

  it("supports keyboard navigation with ArrowDown, ArrowUp, and Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SelectField
        field={mockField}
        layout={{} as any}
        value="admin"
        onChange={onChange}
      />
    );

    const trigger = screen.getByRole("combobox");
    trigger.focus();

    // Open via ArrowDown
    await user.keyboard("{ArrowDown}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // Move to next option
    await user.keyboard("{ArrowDown}");
    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      "user-role-select-opt-editor"
    );

    // Select with Enter
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("editor");
  });

  it("closes on Escape key press", async () => {
    const user = userEvent.setup();

    render(
      <SelectField
        field={mockField}
        layout={{} as any}
        value="admin"
        onChange={vi.fn()}
      />
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
