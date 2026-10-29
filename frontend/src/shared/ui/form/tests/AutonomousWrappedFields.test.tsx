import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { withAtom } from "../hoc/withAtom";
import {
  FormTextField,
  FormSelectField,
  FormCheckboxField,
  FormSwitchField,
  FormNumberInputField,
} from "../fields/wrapped-fields";
import { ControlledField } from "../fields/WrapperFields";
import { Form } from "../Form";
import { FormOrchestratorProvider } from "../context/FormOrchestratorContext";

describe("Autonomous Wrapped Fields & Double Wrap Prevention (LSP/SOLID)", () => {
  it("renders FormTextField autonomously without explicit field prop (synthetic fallback)", () => {
    render(
      <FormTextField
        id="user-name"
        name="userName"
        label="Full Name"
        placeholder="Enter your name"
      />
    );

    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();
  });

  it("renders FormSelectField autonomously without explicit field prop", () => {
    const options = [
      { label: "Option 1", value: "opt1" },
      { label: "Option 2", value: "opt2" },
    ];

    render(
      <FormSelectField
        id="user-role"
        name="userRole"
        label="Role"
        options={options}
      />
    );

    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders FormCheckboxField and FormSwitchField autonomously", () => {
    render(
      <div>
        <FormCheckboxField id="agree" name="agree" value={true} />
        <FormSwitchField id="notify" name="notify" value={false} />
      </div>
    );

    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("preserves idempotency when wrapping an already-wrapped field with withAtom", () => {
    const doubleWrapped = withAtom(FormTextField);
    expect(doubleWrapped).toBe(FormTextField);
  });

  it("prevents double-wrapping DOM shells when rendered inside ControlledField", () => {
    const testSchema: any = {
      id: "test-form",
      title: "Test Form",
      sections: [
        {
          id: "s1",
          title: "S1",
          fields: [
            {
              id: "username",
              name: "username",
              type: "text",
              label: "Controlled Username",
            },
          ],
        },
      ],
    };

    render(
      <Form definition={testSchema}>
        <ControlledField
          name="username"
          render={({ value, onChange }) => (
            <FormTextField
              id="username-inner"
              name="username"
              value={value}
              onChange={onChange}
            />
          )}
        />
      </Form>
    );

    // Should only have ONE label element for "Controlled Username", never duplicated
    const labels = screen.getAllByText("Controlled Username");
    expect(labels).toHaveLength(1);
  });
});
