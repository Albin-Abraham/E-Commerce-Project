import React from "react";
import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { Form } from "@form-core/form";
import type { FormDefinition } from "@form-core/domain";
import { FormOrchestratorProvider } from "@ui/form/context/FormOrchestratorContext";
import { defaultRegistry } from "@ui/form/fields/lazy-registry-builder";
import { useFormArray } from "../useFormArray";

describe("useFormArray (RHF-Compatible Array Ergonomics)", () => {
  const repeaterDef: FormDefinition = {
    id: "invoice-form",
    title: "Invoice Form",
    sections: [
      {
        id: "s1",
        title: "Line Items",
        fields: [
          {
            id: "items",
            name: "items",
            type: "repeater",
            label: "Items",
            fields: [
              {
                id: "name",
                name: "name",
                type: "text",
                label: "Item Name",
              },
              {
                id: "price",
                name: "price",
                type: "number",
                label: "Price",
              },
            ],
          },
        ],
      },
    ],
  };

  function createWrapper(form: Form<any>) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <FormOrchestratorProvider
          value={{
            registry: {
              registry: defaultRegistry,
              form: form as any,
            },
          }}
        >
          {children}
        </FormOrchestratorProvider>
      );
    };
  }

  it("should initialize with stable id keys for list rendering", () => {
    const form = new Form(repeaterDef, {
      items: [
        { id: "item-1", name: "Laptop", price: 1000 },
        { name: "Mouse", price: 25 },
      ],
    });

    const { result } = renderHook(() => useFormArray("items"), {
      wrapper: createWrapper(form),
    });

    expect(result.current.fields.length).toBe(2);
    // Explicit business id preserved
    expect(result.current.fields[0].id).toBe("item-1");
    expect(result.current.fields[0].name).toBe("Laptop");
    // Missing id auto-assigned
    expect(result.current.fields[1].id).toBeDefined();
    expect(result.current.fields[1].name).toBe("Mouse");
  });

  it("should append rows and update fields reactively", () => {
    const form = new Form(repeaterDef, { items: [] });
    const { result } = renderHook(() => useFormArray("items"), {
      wrapper: createWrapper(form),
    });

    expect(result.current.fields.length).toBe(0);

    act(() => {
      result.current.append({ name: "Monitor", price: 300 });
    });

    expect(result.current.fields.length).toBe(1);
    expect(result.current.fields[0].name).toBe("Monitor");
    expect(result.current.fields[0].price).toBe(300);
    expect(result.current.fields[0].id).toBeDefined();
  });

  it("should remove rows by index", () => {
    const form = new Form(repeaterDef, {
      items: [
        { id: "row-A", name: "Row A" },
        { id: "row-B", name: "Row B" },
        { id: "row-C", name: "Row C" },
      ],
    });

    const { result } = renderHook(() => useFormArray("items"), {
      wrapper: createWrapper(form),
    });

    act(() => {
      result.current.remove(1); // Remove row B
    });

    expect(result.current.fields.length).toBe(2);
    expect(result.current.fields[0].id).toBe("row-A");
    expect(result.current.fields[1].id).toBe("row-C");
  });

  it("should move rows preserving identities", () => {
    const form = new Form(repeaterDef, {
      items: [
        { id: "row-1", name: "First" },
        { id: "row-2", name: "Second" },
        { id: "row-3", name: "Third" },
      ],
    });

    const { result } = renderHook(() => useFormArray("items"), {
      wrapper: createWrapper(form),
    });

    act(() => {
      result.current.move(0, 2); // Move First to end
    });

    expect(result.current.fields.map((f) => f.name)).toEqual([
      "Second",
      "Third",
      "First",
    ]);
    expect(result.current.fields[2].id).toBe("row-1");
  });

  it("should swap two rows by index", () => {
    const form = new Form(repeaterDef, {
      items: [
        { id: "r1", name: "A" },
        { id: "r2", name: "B" },
      ],
    });

    const { result } = renderHook(() => useFormArray("items"), {
      wrapper: createWrapper(form),
    });

    act(() => {
      result.current.swap(0, 1);
    });

    expect(result.current.fields.map((f) => f.name)).toEqual(["B", "A"]);
  });

  it("should replace entire array of items", () => {
    const form = new Form(repeaterDef, {
      items: [{ name: "Old" }],
    });

    const { result } = renderHook(() => useFormArray("items"), {
      wrapper: createWrapper(form),
    });

    act(() => {
      result.current.replace([
        { name: "Brand New 1", price: 10 },
        { name: "Brand New 2", price: 20 },
      ]);
    });

    expect(result.current.fields.length).toBe(2);
    expect(result.current.fields[0].name).toBe("Brand New 1");
    expect(result.current.fields[1].name).toBe("Brand New 2");
  });
});
