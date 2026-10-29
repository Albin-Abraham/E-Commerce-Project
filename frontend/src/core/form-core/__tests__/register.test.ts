import { describe, expect, it, vi } from "vitest";
import { FormCore } from "../engine";
import type { FormDefinition } from "../domain";

describe("Native DOM Ref Registration (form.register - RHF Ergonomics)", () => {
  const definition: FormDefinition = {
    id: "register-form",
    title: "Registration Form",
    sections: [
      {
        id: "s1",
        title: "User Profile",
        fields: [
          {
            id: "username",
            name: "username",
            type: "text",
            label: "Username",
            initialValue: "alice",
          },
          {
            id: "age",
            name: "age",
            type: "number",
            label: "Age",
            initialValue: 30,
          },
          {
            id: "isAdmin",
            name: "isAdmin",
            type: "checkbox",
            label: "Admin User",
            initialValue: false,
          },
          {
            id: "startDate",
            name: "startDate",
            type: "date",
            label: "Start Date",
          },
        ],
      },
    ],
  };

  it("should return spreadable props matching native HTML input signatures", () => {
    const form = new FormCore(definition);
    const registration = form.register("username");

    expect(registration.name).toBe("username");
    expect(registration.defaultValue).toBe("alice");
    expect(typeof registration.onChange).toBe("function");
    expect(typeof registration.onBlur).toBe("function");
    expect(typeof registration.ref).toBe("function");
  });

  it("should update form values when onChange is invoked with standard DOM events", async () => {
    const form = new FormCore(definition);
    const reg = form.register("username");

    await reg.onChange({ target: { value: "bob_marley" } });

    expect(form.values.username).toBe("bob_marley");
    expect(form.vitality["username"]?.dirty).toBe(true);
  });

  it("should handle checkbox inputs via checked property", async () => {
    const form = new FormCore(definition);
    const reg = form.register("isAdmin");

    await reg.onChange({ target: { type: "checkbox", checked: true } });

    expect(form.values.isAdmin).toBe(true);
    expect(form.vitality["isAdmin"]?.dirty).toBe(true);
  });

  it("should support valueAsNumber coercion", async () => {
    const form = new FormCore(definition);
    const reg = form.register("age", { valueAsNumber: true });

    await reg.onChange({ target: { value: "45" } });
    expect(form.values.age).toBe(45);

    await reg.onChange({ target: { value: "" } });
    expect(form.values.age).toBeNull();
  });

  it("should support valueAsDate coercion", async () => {
    const form = new FormCore(definition);
    const reg = form.register("startDate", { valueAsDate: true });

    await reg.onChange({ target: { value: "2026-05-15" } });
    expect(form.values.startDate).toBeInstanceOf(Date);
    expect((form.values.startDate as Date).getFullYear()).toBe(2026);
  });

  it("should mark field touched on onBlur", () => {
    const form = new FormCore(definition);
    const reg = form.register("username");

    expect(form.vitality["username"]?.touched).toBeFalsy();
    reg.onBlur();
    expect(form.vitality["username"]?.touched).toBe(true);
  });

  it("should store DOM element ref and allow programmatic focusField()", () => {
    const form = new FormCore(definition);
    const reg = form.register("username");

    const mockElement = {
      focus: vi.fn(),
    };

    reg.ref(mockElement);

    const focused = form.focusField("username");
    expect(focused).toBe(true);
    expect(mockElement.focus).toHaveBeenCalledTimes(1);

    // Unmount ref
    reg.ref(null);
    expect(form.focusField("username")).toBe(false);
  });
});
