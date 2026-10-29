import React from "react";

import { FormDriver } from "@testing/drivers/FormDriver";
import { renderWithProviders } from "@testing/test-utils";
import { describe, expect, it, vi } from "vitest";

import { Form } from "../Form";
import type { FormHandle } from "../Form";
import type { FormDefinition } from "../types";

const dummySchema: FormDefinition = {
  id: "test-form",
  title: "Test Form",
  sections: [
    {
      id: "main",
      title: "Main Section",
      fields: [
        {
          id: "name",
          name: "name",
          type: "text",
          label: "Name",
          required: true,
        },
        {
          id: "email",
          name: "email",
          type: "text",
          label: "Email",
          required: true,
        },
      ],
    },
  ],
};

describe("Form Imperative API (Driver-Based)", () => {
  it("should allow programmatic control via ref", async () => {
    const onSubmit = vi.fn();
    const formRef = React.createRef<FormHandle>();

    const { container } = renderWithProviders(
      <Form ref={formRef} definition={dummySchema} onSubmit={onSubmit} />
    );

    const driver = new FormDriver(container);

    // 1. Test setValue
    await driver.waitForFieldName("name");
    formRef.current?.setValue("name", "John Doe");
    await driver.expectValue("name", "John Doe");

    // 2. Test getValue
    await driver.fill("email", "john@example.com");
    expect(formRef.current?.getValue("email")).toBe("john@example.com");

    // 3. Test getValues
    expect(formRef.current?.getValues()).toEqual({
      name: "John Doe",
      email: "john@example.com",
    });

    // 4. Test isValid & setTouched (triggering validation)
    expect(formRef.current?.isValid).toBe(true);

    formRef.current?.setValue("name", "");
    formRef.current?.setTouched("name");
    await formRef.current?.validate();

    expect(formRef.current?.isValid).toBe(false);

    // 5. Test submit
    formRef.current?.setValue("name", "Jane Doe");
    await formRef.current?.validate();

    expect(formRef.current?.isValid).toBe(true);

    const submitResult = await formRef.current?.submit();
    expect(submitResult).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Jane Doe",
      email: "john@example.com",
    });
  });

  it("should expose the internal engine for advanced control", async () => {
    const formRef = React.createRef<FormHandle>();
    renderWithProviders(<Form ref={formRef} definition={dummySchema} />);

    expect(formRef.current?.engine).toBeDefined();
    // Verify it's the Form engine by checking for core methods
    expect(typeof formRef.current?.engine.setValue).toBe("function");
    expect(typeof formRef.current?.engine.subscribe).toBe("function");
  });
});
