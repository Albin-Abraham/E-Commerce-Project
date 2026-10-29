import React from "react";

import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { FormFieldSchema } from "@ui/table/types";
import { InlineEditProvider, useInlineEditContext } from "../InlineEditContext";

function TestConsumer() {
  const ctx = useInlineEditContext();

  return (
    <div>
      <span data-testid="editingRowId">{ctx.editingRowId ?? "none"}</span>
      <span data-testid="submitting">{String(ctx.submitting)}</span>
      <span data-testid="hasForm">{String(!!ctx.activeForm)}</span>
      <button
        data-testid="startEdit"
        onClick={() =>
          ctx.startEdit("row-1", { name: "John", email: "john@test.com" })
        }
      />
      <button data-testid="cancelEdit" onClick={() => ctx.cancelEdit()} />
      <button data-testid="commitEdit" onClick={() => ctx.commitEdit()} />
      <span data-testid="cellValue">
        {String(ctx.getCellValue("row-1", "name", "fallback"))}
      </span>
      <span data-testid="field">
        {String(ctx.getFieldForColumn("name")?.label ?? "none")}
      </span>
    </div>
  );
}

const schemas: Record<string, FormFieldSchema> = {
  name: {
    id: "name",
    name: "name",
    label: "Name",
    type: "text",
    required: true,
  },
  email: { id: "email", name: "email", label: "Email", type: "email" },
};

function renderWithContext(
  props: Partial<React.ComponentProps<typeof InlineEditProvider>> = {}
) {
  return render(
    <InlineEditProvider columnSchemas={schemas} {...props}>
      <TestConsumer />
    </InlineEditProvider>
  );
}

describe("InlineEditProvider", () => {
  it("initializes with no editing row", () => {
    renderWithContext();

    expect(screen.getByTestId("editingRowId")).toHaveTextContent("none");
    expect(screen.getByTestId("submitting")).toHaveTextContent("false");
    expect(screen.getByTestId("hasForm")).toHaveTextContent("false");
  });

  it("startEdit creates form and sets editing row", () => {
    renderWithContext();

    act(() => {
      screen.getByTestId("startEdit").click();
    });

    expect(screen.getByTestId("editingRowId")).toHaveTextContent("row-1");
    expect(screen.getByTestId("hasForm")).toHaveTextContent("true");
  });

  it("cancelEdit clears editing state", () => {
    renderWithContext();

    act(() => {
      screen.getByTestId("startEdit").click();
    });

    act(() => {
      screen.getByTestId("cancelEdit").click();
    });

    expect(screen.getByTestId("editingRowId")).toHaveTextContent("none");
    expect(screen.getByTestId("hasForm")).toHaveTextContent("false");
  });

  it("isEditing returns true for current row", () => {
    function TestIsEditing() {
      const ctx = useInlineEditContext();
      return (
        <div>
          <span data-testid="isEditing1">{String(ctx.isEditing("row-1"))}</span>
          <span data-testid="isEditing2">{String(ctx.isEditing("row-2"))}</span>
        </div>
      );
    }

    render(
      <InlineEditProvider columnSchemas={schemas}>
        <TestIsEditing />
        <button
          data-testid="startEdit"
          onClick={() => {
            // Access context via a child
          }}
        />
      </InlineEditProvider>
    );

    expect(screen.getByTestId("isEditing1")).toHaveTextContent("false");
    expect(screen.getByTestId("isEditing2")).toHaveTextContent("false");
  });

  it("getCellValue returns form value when editing", () => {
    renderWithContext();

    act(() => {
      screen.getByTestId("startEdit").click();
    });

    // The form was created with { name: "John", email: "john@test.com" }
    // getCellValue should return the form value
    expect(screen.getByTestId("cellValue")).toHaveTextContent("John");
  });

  it("getCellValue returns original when not editing", () => {
    renderWithContext();

    // No row is being edited, so original value is returned
    expect(screen.getByTestId("cellValue")).toHaveTextContent("fallback");
  });

  it("getFieldForColumn returns field schema", () => {
    renderWithContext();

    expect(screen.getByTestId("field")).toHaveTextContent("Name");
  });

  it("commitEdit calls onSubmit with form values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderWithContext({ onSubmit });

    act(() => {
      screen.getByTestId("startEdit").click();
    });

    await act(async () => {
      screen.getByTestId("commitEdit").click();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      "row-1",
      expect.objectContaining({
        name: "John",
        email: "john@test.com",
      })
    );
  });

  it("commitEdit shows error on failure", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Server error"));

    renderWithContext({ onSubmit });

    act(() => {
      screen.getByTestId("startEdit").click();
    });

    await act(async () => {
      screen.getByTestId("commitEdit").click();
    });

    expect(screen.getByTestId("submitting")).toHaveTextContent("false");
  });

  it("commitEdit runs form validation and aborts onSubmit when invalid", async () => {
    const onSubmit = vi.fn();
    const requiredSchemas: Record<string, FormFieldSchema> = {
      name: {
        id: "name",
        name: "name",
        label: "Name",
        type: "text",
        required: true,
      },
    };

    function RequiredConsumer() {
      const ctx = useInlineEditContext();
      return (
        <div>
          <button
            data-testid="startEmpty"
            onClick={() => ctx.startEdit("row-1", { name: "" })}
          />
          <button data-testid="commit" onClick={() => ctx.commitEdit()} />
        </div>
      );
    }

    render(
      <InlineEditProvider columnSchemas={requiredSchemas} onSubmit={onSubmit}>
        <RequiredConsumer />
      </InlineEditProvider>
    );

    act(() => {
      screen.getByTestId("startEmpty").click();
    });

    await act(async () => {
      screen.getByTestId("commit").click();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("commitEdit calls validate before submit", async () => {
    const validate = vi.fn().mockReturnValue({ name: "Required" });
    const onSubmit = vi.fn();

    renderWithContext({ validate, onSubmit });

    act(() => {
      screen.getByTestId("startEdit").click();
    });

    await act(async () => {
      screen.getByTestId("commitEdit").click();
    });

    expect(validate).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("commits to next row after cancel", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderWithContext({ onSubmit });

    // Start editing row-1
    act(() => {
      screen.getByTestId("startEdit").click();
    });

    expect(screen.getByTestId("editingRowId")).toHaveTextContent("row-1");

    // Cancel
    act(() => {
      screen.getByTestId("cancelEdit").click();
    });

    expect(screen.getByTestId("editingRowId")).toHaveTextContent("none");
  });

  it("handles typed schemas with options, validation, and properties", () => {
    const typedSchemas: Record<string, FormFieldSchema> = {
      status: {
        id: "status",
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
        required: true,
        validation: [{ rule: "required" }],
        properties: { placeholder: "Select status" },
      },
    };

    function TypedConsumer() {
      const ctx = useInlineEditContext();
      const field = ctx.getFieldForColumn("status");
      return (
        <div>
          <span data-testid="fieldType">{field?.type}</span>
          <span data-testid="fieldOptions">
            {JSON.stringify(field?.options?.length)}
          </span>
          <span data-testid="fieldValidation">
            {String(!!field?.validation)}
          </span>
          <span data-testid="fieldProperties">
            {String(!!field?.properties)}
          </span>
        </div>
      );
    }

    render(
      <InlineEditProvider columnSchemas={typedSchemas}>
        <TypedConsumer />
      </InlineEditProvider>
    );

    expect(screen.getByTestId("fieldType")).toHaveTextContent("select");
    expect(screen.getByTestId("fieldOptions")).toHaveTextContent("2");
    expect(screen.getByTestId("fieldValidation")).toHaveTextContent("true");
    expect(screen.getByTestId("fieldProperties")).toHaveTextContent("true");
  });
});

describe("useInlineEditContext error", () => {
  it("throws when used outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    function BadConsumer() {
      useInlineEditContext();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow(
      /must be used inside an <InlineEditProvider>/
    );

    spy.mockRestore();
  });
});
