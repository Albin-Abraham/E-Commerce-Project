import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ButtonField } from "../fields/primitive/ButtonField";
import { CheckboxField } from "../fields/primitive/CheckboxField";
import { MultiSelectField } from "../fields/primitive/MultiSelectField";
import { SelectField } from "../fields/primitive/SelectField";
import { SwitchField } from "../fields/primitive/SwitchField";
import { TextField } from "../fields/primitive/TextField";
import { TextareaField } from "../fields/primitive/TextareaField";

describe("Form Primitives: A11y aria-keyshortcuts Integration", () => {
  it("renders aria-keyshortcuts on TextField", () => {
    const field = {
      id: "input-name",
      name: "name",
      type: "text",
      label: "Full Name",
      properties: { ariaKeyShortcuts: "Alt+N" },
    } as any;

    render(
      <TextField
        field={field}
        layout={{} as any}
        value=""
        onChange={vi.fn()}
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-keyshortcuts", "Alt+N");
  });

  it("renders aria-keyshortcuts on SelectField", () => {
    const field = {
      id: "select-role",
      name: "role",
      type: "select",
      label: "Role",
      options: [{ value: "admin", label: "Admin" }],
      properties: { ariaKeyShortcuts: "Alt+R" },
    } as any;

    render(
      <SelectField
        field={field}
        layout={{} as any}
        value="admin"
        onChange={vi.fn()}
      />
    );

    const combobox = screen.getByRole("combobox");
    expect(combobox).toHaveAttribute("aria-keyshortcuts", "Alt+R");
  });

  it("renders aria-keyshortcuts on TextareaField", () => {
    const field = {
      id: "textarea-bio",
      name: "bio",
      type: "textarea",
      label: "Bio",
      properties: { ariaKeyShortcuts: "Alt+B" },
    } as any;

    render(
      <TextareaField
        field={field}
        layout={{} as any}
        value=""
        onChange={vi.fn()}
      />
    );

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("aria-keyshortcuts", "Alt+B");
  });

  it("renders aria-keyshortcuts on ButtonField", () => {
    const field = {
      id: "btn-submit",
      name: "submitBtn",
      type: "button",
      label: "Save Changes",
      properties: { ariaKeyShortcuts: "Control+Enter Meta+Enter" },
    } as any;

    render(
      <ButtonField
        field={field}
        onClick={vi.fn()}
      />
    );

    const button = screen.getByRole("button", { name: "Save Changes" });
    expect(button).toHaveAttribute("aria-keyshortcuts", "Control+Enter Meta+Enter");
  });

  it("renders aria-keyshortcuts on CheckboxField", () => {
    const field = {
      id: "chk-agree",
      name: "agree",
      type: "checkbox",
      label: "I Agree",
      properties: { ariaKeyShortcuts: "Alt+A" },
    } as any;

    render(
      <CheckboxField
        field={field}
        layout={{} as any}
        value={false}
        onChange={vi.fn()}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-keyshortcuts", "Alt+A");
  });

  it("renders aria-keyshortcuts on SwitchField", () => {
    const field = {
      id: "sw-notify",
      name: "notify",
      type: "switch",
      properties: { placeholder: "Enable Notifications", ariaKeyShortcuts: "Alt+S" },
    } as any;

    render(
      <SwitchField
        field={field}
        layout={{} as any}
        value={false}
        onChange={vi.fn()}
      />
    );

    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("aria-keyshortcuts", "Alt+S");
  });

  it("renders aria-keyshortcuts on MultiSelectField", () => {
    const field = {
      id: "multi-tags",
      name: "tags",
      type: "multiselect",
      options: [{ value: "tech", label: "Tech" }],
      properties: { ariaKeyShortcuts: "Alt+T" },
    } as any;

    render(
      <MultiSelectField
        field={field}
        layout={{} as any}
        value={[]}
        onChange={vi.fn()}
      />
    );

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("aria-keyshortcuts", "Alt+T");
  });
});
