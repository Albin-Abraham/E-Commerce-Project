import { act, fireEvent, render, screen } from "@testing-library/react";
import { Form } from "@ui/form/Form";
import {
  ControlledField,
  Field,
  UncontrolledField,
} from "@ui/form/fields/WrapperFields";
import type { FormDefinition } from "@ui/form/types";
import { describe, expect, it, vi } from "vitest";

const testSchema: FormDefinition = {
  id: "wrapper-test",
  title: "Wrapper Test",
  sections: [
    {
      id: "section-1",
      title: "Section 1",
      fields: [
        {
          id: "email",
          name: "email",
          type: "text",
          label: "Email Address",
          validation: { rules: [{ type: "required" }] },
        },
        {
          id: "rating",
          name: "rating",
          type: "number",
          label: "Product Rating",
        },
      ],
    },
  ],
};

describe("Wrapper Fields Components", () => {
  it("renders UncontrolledField directly and updates values on change", async () => {
    const onSubmit = vi.fn();
    render(
      <Form definition={testSchema} onSubmit={onSubmit}>
        <UncontrolledField name="email" data-testid="email-input" />
      </Form>
    );

    const input = (await screen.findByRole("textbox")) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("");

    await act(async () => {
      fireEvent.change(input, { target: { value: "developer@zenith.com" } });
    });

    expect(input.value).toBe("developer@zenith.com");
  });

  it("renders ControlledField directly with custom component render props", async () => {
    const onSubmit = vi.fn();
    render(
      <Form definition={testSchema} onSubmit={onSubmit}>
        <ControlledField
          name="rating"
          render={({ value, onChange }) => (
            <input
              data-testid="custom-rating"
              value={value || ""}
              onChange={(e) => onChange(Number(e.target.value))}
            />
          )}
        />
      </Form>
    );

    const customInput = screen.getByTestId("custom-rating") as HTMLInputElement;
    expect(customInput).toBeInTheDocument();
    expect(customInput.value).toBe("");

    await act(async () => {
      fireEvent.change(customInput, { target: { value: "5" } });
    });

    expect(customInput.value).toBe("5");
  });

  it("renders unified Field component in Uncontrolled mode", async () => {
    const onSubmit = vi.fn();
    render(
      <Form definition={testSchema} onSubmit={onSubmit}>
        <Field name="email" />
      </Form>
    );

    const input = (await screen.findByRole("textbox")) as HTMLInputElement;
    expect(input).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(input, { target: { value: "unified@zenith.com" } });
    });

    expect(input.value).toBe("unified@zenith.com");
  });

  it("renders unified Field component in Controlled mode", async () => {
    const onSubmit = vi.fn();
    render(
      <Form definition={testSchema} onSubmit={onSubmit}>
        <Field
          name="rating"
          render={({ value, onChange }: any) => (
            <input
              data-testid="unified-rating"
              value={value || ""}
              onChange={(e) => onChange(Number(e.target.value))}
            />
          )}
        />
      </Form>
    );

    const customInput = screen.getByTestId(
      "unified-rating"
    ) as HTMLInputElement;
    expect(customInput).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(customInput, { target: { value: "4" } });
    });

    expect(customInput.value).toBe("4");
  });
});
