import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../testing/test-utils";
import { ButtonField } from "../fields/primitive/ButtonField";
import { TextField } from "../fields/primitive/TextField";
import { withAtom } from "../hoc/withAtom";
import { Form } from "../Form";
import type { FormDefinition } from "../types";

describe("DCS Dynamic Slot Architecture & withViewModel Integration", () => {
  it("renders custom startContent and endContent on ButtonField via properties", () => {
    const field = {
      id: "btn-save",
      name: "save",
      type: "button",
      label: "Save Document",
      properties: {
        icon: "check",
        endContent: <span data-testid="custom-badge">PRO</span>,
      },
    } as any;

    render(<ButtonField field={field} onClick={vi.fn()} />);

    expect(screen.getByText("Save Document")).toBeInTheDocument();
    expect(screen.getByTestId("custom-badge")).toBeInTheDocument();
  });

  it("renders dynamic startContent and endContent in withAtom OuterWrapper without hardcoding", () => {
    const AtomInput = withAtom(TextField);
    const field = {
      id: "input-search",
      name: "search",
      type: "text",
      label: "Search",
      properties: {
        startContent: <span data-testid="search-prefix">$</span>,
        endContent: <span data-testid="search-suffix">.com</span>,
      },
    } as any;

    render(
      <AtomInput
        id="input-search"
        field={field}
        value=""
        onChange={vi.fn()}
      />
    );

    expect(screen.getByTestId("search-prefix")).toBeInTheDocument();
    expect(screen.getByTestId("search-suffix")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders decoupled schema definitions with type: array and component: multiselect", async () => {
    const schema: FormDefinition = {
      id: "test-schema",
      title: "Decoupled Schema Form",
      sections: [
        {
          id: "main",
          title: "Main Section",
          fields: [
            {
              id: "multi-tags",
              name: "tags",
              type: "array" as any,
              component: "multiselect",
              label: "Tags",
              options: [
                { value: "react", label: "React" },
                { value: "vue", label: "Vue" },
              ],
              properties: {
                ariaKeyShortcuts: "Alt+T",
              },
            },
            {
              id: "select-role",
              name: "role",
              type: "string" as any,
              component: "select",
              label: "Role",
              options: [
                { value: "admin", label: "Administrator" },
              ],
              properties: {
                ariaKeyShortcuts: "Alt+R",
              },
            },
          ],
        },
      ],
    };

    renderWithProviders(<Form definition={schema} />);

    const listbox = await screen.findByRole("listbox");
    const combobox = await screen.findByRole("combobox");

    expect(listbox).toBeInTheDocument();
    expect(combobox).toBeInTheDocument();
    expect(listbox).toHaveAttribute("aria-keyshortcuts", "Alt+T");
    expect(combobox).toHaveAttribute("aria-keyshortcuts", "Alt+R");
  });

  it("renders decoupled schema definitions with type: string and component: radio with option icons", async () => {
    const schema: FormDefinition = {
      id: "radio-schema",
      title: "Radio Form",
      sections: [
        {
          id: "radio-sec",
          title: "Radio Section",
          fields: [
            {
              id: "radio-plan",
              name: "plan",
              type: "string" as any,
              component: "radio",
              label: "Subscription Plan",
              options: [
                { value: "free", label: "Free Tier", icon: "user", description: "Basic access" },
                { value: "pro", label: "Pro Tier", icon: "shield", description: "All features" },
              ],
              properties: {
                direction: "row",
                ariaKeyShortcuts: "Alt+P",
              },
            },
          ],
        },
      ],
    };

    renderWithProviders(<Form definition={schema} />);

    const radiogroup = await screen.findByRole("radiogroup");
    expect(radiogroup).toBeInTheDocument();
    expect(radiogroup).toHaveAttribute("aria-keyshortcuts", "Alt+P");
    expect(screen.getByText("Free Tier")).toBeInTheDocument();
    expect(screen.getByText("Basic access")).toBeInTheDocument();
    expect(screen.getByText("Pro Tier")).toBeInTheDocument();
    expect(screen.getByText("All features")).toBeInTheDocument();
  });
});

