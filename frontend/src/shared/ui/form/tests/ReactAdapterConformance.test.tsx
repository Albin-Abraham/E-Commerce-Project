import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../Form";
import type { FormDefinition } from "@form-core/domain";

describe("Layer 2: Adapter Integration Tests (React + RTL Conformance)", () => {
  const adapterTestDefinition: FormDefinition = {
    id: "adapter-conformance-form",
    title: "Adapter Conformance Form",
    submitLabel: "Submit Form",
    sections: [
      {
        id: "main_section",
        title: "Main Details",
        fields: [
          {
            id: "username",
            name: "username",
            type: "text",
            label: "Username",
            required: true,
          },
          {
            id: "role",
            name: "role",
            type: "radio",
            label: "Role",
            required: true,
            options: [
              { label: "Standard User", value: "user" },
              { label: "Administrator", value: "admin" },
            ],
          },
          {
            id: "adminCode",
            name: "adminCode",
            type: "text",
            label: "Admin Authorization Code",
            required: true,
            meta: {
              conditions: {
                groups: [
                  {
                    action: "show",
                    rules: [
                      {
                        field: "role",
                        operator: "equals",
                        value: "admin",
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };

  it("should render input controls corresponding to canonical FormDefinition", async () => {
    render(<Form definition={adapterTestDefinition} />);

    // Username field exists
    const usernameInput = screen.getByLabelText(/Username/i);
    expect(usernameInput).toBeInTheDocument();

    // Radio options exist
    expect(screen.getByLabelText(/Standard User/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Administrator/i)).toBeInTheDocument();

    // Admin code is conditionally hidden initially
    expect(screen.queryByLabelText(/Admin Authorization Code/i)).not.toBeInTheDocument();
  });

  it("should synchronize user typing to underlying form engine state", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <Form
        definition={adapterTestDefinition}
        initialData={{ role: "user" }}
        onSubmit={onSubmit}
      />
    );

    const usernameInput = screen.getByLabelText(/Username/i);
    await user.type(usernameInput, "johndoe");

    expect(usernameInput).toHaveValue("johndoe");
  });

  it("should translate canonical validation errors into accessible DOM feedback on blur", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<Form definition={adapterTestDefinition} onSubmit={onSubmit} />);

    const usernameInput = screen.getByLabelText(/Username/i);

    // Focus and blur without entering value to trigger onBlur validation
    await user.click(usernameInput);
    await user.tab();

    // Error message rendered in DOM
    await waitFor(() => {
      const errorMsg = screen.getByText(/Username is required/i);
      expect(errorMsg).toBeInTheDocument();
    });

    expect(usernameInput).toHaveAttribute("aria-invalid", "true");
  });

  it("should reactively mount conditional fields when dependent condition is satisfied", async () => {
    const user = userEvent.setup();

    render(<Form definition={adapterTestDefinition} />);

    // Initially adminCode is not in DOM
    expect(screen.queryByLabelText(/Admin Authorization Code/i)).not.toBeInTheDocument();

    // Click "Administrator" radio option
    const adminRadio = screen.getByLabelText(/Administrator/i);
    await user.click(adminRadio);

    // adminCode should now dynamically mount
    await waitFor(() => {
      expect(screen.getByLabelText(/Admin Authorization Code/i)).toBeInTheDocument();
    });

    // Click "Standard User" radio option -> adminCode unmounts
    const userRadio = screen.getByLabelText(/Standard User/i);
    await user.click(userRadio);

    await waitFor(() => {
      expect(screen.queryByLabelText(/Admin Authorization Code/i)).not.toBeInTheDocument();
    });
  });

  it("should pass canonical payload to onSubmit when valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<Form definition={adapterTestDefinition} onSubmit={onSubmit} />);

    const usernameInput = screen.getByLabelText(/Username/i);
    await user.type(usernameInput, "superuser");

    const userRadio = screen.getByLabelText(/Standard User/i);
    await user.click(userRadio);

    const submitBtn = screen.getByRole("button", { name: /Submit Form/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      username: "superuser",
      role: "user",
    });
  });
});
