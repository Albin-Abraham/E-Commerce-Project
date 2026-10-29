import React from "react";

import { act, render, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TableColumnMeta } from "@ui/table/types";
import {
  InlineEditProvider,
  useInlineEditContext,
} from "../../InlineEditContext";
import { InlineEditModule } from "../InlineEditModule";

const TEST_COLUMNS: TableColumnMeta[] = [
  {
    id: "name",
    label: "Name",
    fieldSchema: {
      id: "name",
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },
  },
  {
    id: "age",
    label: "Age",
    fieldSchema: {
      id: "age",
      name: "age",
      label: "Age",
      type: "number",
    },
  },
];

describe("InlineEditModule", () => {
  describe("useInlineEdit", () => {
    it("returns columnSchemas and Provider", () => {
      const { result } = renderHook(() =>
        InlineEditModule.useInlineEdit({
          enabled: true,
          columns: TEST_COLUMNS,
          onSubmit: vi.fn(),
        })
      );

      expect(result.current.columnSchemas).toBeDefined();
      expect(result.current.columnSchemas.name).toBeDefined();
      expect(result.current.columnSchemas.age).toBeDefined();
      expect(result.current.Provider).toBeDefined();
    });

    it("columnSchemas maps fieldSchema from columns", () => {
      const { result } = renderHook(() =>
        InlineEditModule.useInlineEdit({
          enabled: true,
          columns: TEST_COLUMNS,
          onSubmit: vi.fn(),
        })
      );

      expect(result.current.columnSchemas.name.type).toBe("text");
      expect(result.current.columnSchemas.name.required).toBe(true);
      expect(result.current.columnSchemas.age.type).toBe("number");
    });

    it("columnSchemas excludes columns without fieldSchema", () => {
      const columns: TableColumnMeta[] = [
        {
          id: "name",
          label: "Name",
          fieldSchema: {
            id: "name",
            name: "name",
            label: "Name",
            type: "text",
          },
        },
        { id: "actions", label: "Actions" },
      ];

      const { result } = renderHook(() =>
        InlineEditModule.useInlineEdit({
          enabled: true,
          columns,
          onSubmit: vi.fn(),
        })
      );

      expect(result.current.columnSchemas.name).toBeDefined();
      expect(result.current.columnSchemas.actions).toBeUndefined();
    });
  });
});

describe("InlineEditContext", () => {
  function renderWithContext(
    ui: React.ReactElement,
    props: {
      columnSchemas?: Record<string, any>;
      onSubmit?: any;
      validate?: any;
    } = {}
  ) {
    return render(
      <InlineEditProvider
        columnSchemas={props.columnSchemas ?? {}}
        onSubmit={props.onSubmit ?? vi.fn()}
        validate={props.validate}
      >
        {ui}
      </InlineEditProvider>
    );
  }

  it("throws when used outside provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      renderHook(() => useInlineEditContext());
    }).toThrow();
    consoleSpy.mockRestore();
  });

  it("initializes with no editing row", () => {
    let context: any;
    function TestComponent() {
      context = useInlineEditContext();
      return null;
    }

    renderWithContext(<TestComponent />);

    expect(context.editingRowId).toBeNull();
    expect(context.activeForm).toBeNull();
    expect(context.submitting).toBe(false);
    expect(context.errors).toEqual({});
  });

  it("startEdit creates a Form instance", () => {
    let context: any;
    function TestComponent() {
      context = useInlineEditContext();
      return null;
    }

    const schemas = {
      name: { id: "name", name: "name", label: "Name", type: "text" },
    };

    renderWithContext(<TestComponent />, { columnSchemas: schemas });

    act(() => {
      context.startEdit("row-1", { name: "Alice" });
    });

    expect(context.editingRowId).toBe("row-1");
    expect(context.activeForm).not.toBeNull();
    expect(context.isEditing("row-1")).toBe(true);
    expect(context.isEditing("row-2")).toBe(false);
  });

  it("startEdit populates form with initial data", () => {
    let context: any;
    function TestComponent() {
      context = useInlineEditContext();
      return null;
    }

    const schemas = {
      name: { id: "name", name: "name", label: "Name", type: "text" },
      age: { id: "age", name: "age", label: "Age", type: "number" },
    };

    renderWithContext(<TestComponent />, { columnSchemas: schemas });

    act(() => {
      context.startEdit("row-1", { name: "Alice", age: 30 });
    });

    expect(context.activeForm.values.name).toBe("Alice");
    expect(context.activeForm.values.age).toBe(30);
  });

  it("setValue updates the form values", () => {
    let context: any;
    function TestComponent() {
      context = useInlineEditContext();
      return null;
    }

    const schemas = {
      name: { id: "name", name: "name", label: "Name", type: "text" },
    };

    renderWithContext(<TestComponent />, { columnSchemas: schemas });

    act(() => {
      context.startEdit("row-1", { name: "Alice" });
    });

    act(() => {
      context.activeForm.setValue("name", "Bob");
    });

    expect(context.activeForm.values.name).toBe("Bob");
  });

  it("cancelEdit clears editing state", () => {
    let context: any;
    function TestComponent() {
      context = useInlineEditContext();
      return null;
    }

    const schemas = {
      name: { id: "name", name: "name", label: "Name", type: "text" },
    };

    renderWithContext(<TestComponent />, { columnSchemas: schemas });

    act(() => {
      context.startEdit("row-1", { name: "Alice" });
    });

    act(() => {
      context.cancelEdit();
    });

    expect(context.editingRowId).toBeNull();
    expect(context.activeForm).toBeNull();
    expect(context.errors).toEqual({});
  });

  it("commitEdit calls onSubmit with form values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    let context: any;

    function TestComponent() {
      context = useInlineEditContext();
      return null;
    }

    const schemas = {
      name: { id: "name", name: "name", label: "Name", type: "text" },
    };

    renderWithContext(<TestComponent />, {
      columnSchemas: schemas,
      onSubmit,
    });

    act(() => {
      context.startEdit("row-1", { name: "Alice" });
    });

    act(() => {
      context.activeForm.setValue("name", "Bob");
    });

    await act(async () => {
      await context.commitEdit();
    });

    expect(onSubmit).toHaveBeenCalledWith("row-1", { name: "Bob" });
    expect(context.editingRowId).toBeNull();
  });

  it("commitEdit sets errors when validation fails", async () => {
    const validate = vi.fn().mockReturnValue({ name: "Name is required" });
    let context: any;

    function TestComponent() {
      context = useInlineEditContext();
      return null;
    }

    const schemas = {
      name: { id: "name", name: "name", label: "Name", type: "text" },
    };

    renderWithContext(<TestComponent />, {
      columnSchemas: schemas,
      onSubmit: vi.fn(),
      validate,
    });

    act(() => {
      context.startEdit("row-1", { name: "Alice" });
    });

    await act(async () => {
      await context.commitEdit();
    });

    expect(context.errors).toEqual({ name: "Name is required" });
    expect(context.editingRowId).toBe("row-1");
  });

  it("commitEdit sets error on onSubmit failure", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Server error"));
    let context: any;

    function TestComponent() {
      context = useInlineEditContext();
      return null;
    }

    const schemas = {
      name: { id: "name", name: "name", label: "Name", type: "text" },
    };

    renderWithContext(<TestComponent />, {
      columnSchemas: schemas,
      onSubmit,
    });

    act(() => {
      context.startEdit("row-1", { name: "Alice" });
    });

    await act(async () => {
      await context.commitEdit();
    });

    expect(context.errors._form).toBe("Server error");
    expect(context.editingRowId).toBe("row-1");
  });

  it("getFieldForColumn returns FormField for valid column", () => {
    let context: any;

    function TestComponent() {
      context = useInlineEditContext();
      return null;
    }

    const schemas = {
      name: {
        id: "name",
        name: "name",
        label: "Name",
        type: "text",
        required: true,
      },
    };

    renderWithContext(<TestComponent />, { columnSchemas: schemas });

    const field = context.getFieldForColumn("name");
    expect(field).toBeDefined();
    expect(field.id).toBe("name");
    expect(field.type).toBe("text");
    expect(field.required).toBe(true);
  });

  it("getFieldForColumn returns undefined for unknown column", () => {
    let context: any;

    function TestComponent() {
      context = useInlineEditContext();
      return null;
    }

    renderWithContext(<TestComponent />);

    expect(context.getFieldForColumn("unknown")).toBeUndefined();
  });
});
