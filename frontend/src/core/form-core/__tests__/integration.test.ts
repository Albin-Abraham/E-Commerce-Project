import type { FormDefinition } from "../domain";
import { describe, expect, it, vi } from "vitest";

import { FormCore } from "../engine";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const basicDef: FormDefinition = {
  id: "basic-test",
  title: "Basic Test",
  sections: [
    {
      id: "section1",
      title: "Section 1",
      fields: [
        {
          id: "f1",
          name: "firstName",
          type: "text",
          label: "First Name",
          required: true,
        },
        {
          id: "f2",
          name: "email",
          type: "email",
          label: "Email",
          required: true,
        },
        { id: "f3", name: "age", type: "number", label: "Age" },
      ],
    },
  ],
};

const conditionDef: FormDefinition = {
  id: "condition-test",
  title: "Condition Test",
  sections: [
    {
      id: "section1",
      title: "Main",
      fields: [
        { id: "toggle", name: "toggle", type: "text", label: "Toggle" },
        {
          id: "cond_field",
          name: "cond_field",
          type: "text",
          label: "Conditional Field",
          conditions: {
            groups: [
              {
                action: "show",
                logic: "AND",
                rules: [{ field: "toggle", operator: "equals", value: "show" }],
              },
            ],
          },
        },
        {
          id: "or_field",
          name: "or_field",
          type: "text",
          label: "OR Field",
          conditions: {
            groups: [
              {
                action: "show",
                logic: "OR",
                rules: [
                  { field: "toggle", operator: "equals", value: "a" },
                  { field: "toggle", operator: "equals", value: "b" },
                ],
              },
            ],
          },
        },
      ],
    },
  ],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("FormCore — Full Submission Pipeline", () => {
  it("should execute full setValue → validate → submit lifecycle", async () => {
    const form = new FormCore(
      basicDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );

    // 1. Set valid values
    await form.setValue("firstName", "John");
    await form.setValue("email", "john@example.com");
    await form.setValue("age", 30);

    // 2. submit
    const result = await form.submit();
    expect(result).toBe(true);
    expect(form.isValid).toBe(true);
    expect(form.isDirty).toBe(true);
  });

  it("should reject submission when required fields are empty", async () => {
    const form = new FormCore(
      basicDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );

    await form.setValue("firstName", "");
    const result = await form.submit();

    expect(result).toBe(false);
    expect(form.state.validity["f1"].valid).toBe(false);
  });

  it("should inject server errors via state manager", async () => {
    const form = new FormCore(
      basicDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );

    await form.setValue("firstName", "John");
    await form.setValue("email", "john@example.com");

    // Inject server error directly through state manager
    form.state.validity["f2"] = {
      valid: false,
      errors: [
        { code: "server", message: "Email already taken", fieldId: "f2" },
      ],
    };

    expect(form.state.validity["f2"].valid).toBe(false);
    expect(form.state.validity["f2"].errors?.[0].message).toBe(
      "Email already taken"
    );
  });

  it("should validate specific fields on demand", async () => {
    const form = new FormCore(
      basicDef,
      {},
      { validationMode: "manual", validationDebounceMs: 0 }
    );

    await form.setValue("firstName", "");
    const valid = await form.validateFields(["f1"]);

    expect(valid).toBe(false);
    expect(form.state.validity["f1"].valid).toBe(false);
  });

  it("should skip implicit type validation on empty optional fields", async () => {
    const form = new FormCore(basicDef);
    // f3 (age, number) is optional and empty — no type-error should fire
    await form.validateFields(["f3"]);
    expect(form.state.validity["f3"].valid).toBe(true);
    expect(form.state.validity["f3"].errors).toHaveLength(0);
  });

  it("should run implicit type validation on non-empty optional fields", async () => {
    const emailDef: FormDefinition = {
      id: "email-test",
      title: "Email Test",
      sections: [
        {
          id: "s1",
          title: "S1",
          fields: [{ id: "e1", name: "email", type: "email", label: "Email" }],
        },
      ],
    };
    const form = new FormCore(
      emailDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );
    // Set invalid email on optional field — should fire type rule
    await form.setValue("e1", "not-an-email");
    expect(form.state.validity["e1"].valid).toBe(false);
  });
});

describe("FormCore — AND/OR Conditional Logic", () => {
  it("should show/hide field based on AND condition", async () => {
    const form = new FormCore(
      conditionDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );

    // Initially hidden (toggle !== "show")
    expect(form.visibility["cond_field"]).toBe(false);

    await form.setValue("toggle", "show");
    expect(form.visibility["cond_field"]).toBe(true);

    await form.setValue("toggle", "hide");
    expect(form.visibility["cond_field"]).toBe(false);
  });

  it("should show/hide field based on OR condition (any match)", async () => {
    const form = new FormCore(
      conditionDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );

    // Neither "a" nor "b"
    await form.setValue("toggle", "c");
    expect(form.visibility["or_field"]).toBe(false);

    // Match first branch
    await form.setValue("toggle", "a");
    expect(form.visibility["or_field"]).toBe(true);

    // Match second branch
    await form.setValue("toggle", "b");
    expect(form.visibility["or_field"]).toBe(true);
  });

  it("should enable/disable field based on condition groups", async () => {
    const enableDef: FormDefinition = {
      id: "enable-test",
      title: "Enable Test",
      sections: [
        {
          id: "s1",
          title: "S1",
          fields: [
            { id: "t1", name: "toggle", type: "text", label: "Toggle" },
            {
              id: "t2",
              name: "target",
              type: "text",
              label: "Target",
              conditions: {
                groups: [
                  {
                    action: "enable",
                    rules: [
                      { field: "toggle", operator: "equals", value: "on" },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const form = new FormCore(
      enableDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );

    // Check enabled state via conditionProxy
    const field = form.resolveField("t2")!;
    expect(form.conditionProxy.isEnabled(field)).toBe(false);

    await form.setValue("toggle", "on");
    expect(form.conditionProxy.isEnabled(field)).toBe(true);

    await form.setValue("toggle", "off");
    expect(form.conditionProxy.isEnabled(field)).toBe(false);
  });

  it("should use canonical field.conditions (not just meta.conditions) for enable/disable", async () => {
    const canonicalDef: FormDefinition = {
      id: "canonical-test",
      title: "Canonical Test",
      sections: [
        {
          id: "s1",
          title: "S1",
          fields: [
            { id: "sw", name: "sw", type: "text", label: "Switch" },
            {
              id: "dep",
              name: "dep",
              type: "text",
              label: "Dep",
              conditions: {
                groups: [
                  {
                    action: "enable",
                    rules: [{ field: "sw", operator: "equals", value: "1" }],
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const form = new FormCore(
      canonicalDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );

    const field = form.resolveField("dep")!;
    // Must use field.conditions (not field.meta.conditions)
    await form.setValue("sw", "0");
    expect(form.conditionProxy.isEnabled(field)).toBe(false);

    await form.setValue("sw", "1");
    expect(form.conditionProxy.isEnabled(field)).toBe(true);
  });
});

describe("FormCore — Middleware Chain", () => {
  it("should run registered middleware after setValue", async () => {
    const form = new FormCore(
      basicDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );
    const middleware = vi.fn();

    form.use(middleware);

    await form.setValue("firstName", "John");

    expect(middleware).toHaveBeenCalledTimes(1);
  });

  it("should run multiple middleware in registration order", async () => {
    const form = new FormCore(
      basicDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );
    const order: number[] = [];

    form.use(async () => {
      order.push(1);
    });
    form.use(async () => {
      order.push(2);
    });
    form.use(async () => {
      order.push(3);
    });

    await form.setValue("firstName", "John");

    expect(order).toEqual([1, 2, 3]);
  });

  it("should pass form facade to middleware context", async () => {
    const form = new FormCore(
      basicDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );
    const middleware = vi.fn();

    form.use(middleware);

    await form.setValue("firstName", "John");

    expect(middleware).toHaveBeenCalledWith(
      expect.objectContaining({
        form: expect.objectContaining({ setValue: expect.any(Function) }),
      })
    );
  });
});

describe("FormCore — Repeater Row Lifecycle", () => {
  const repeaterDef: FormDefinition = {
    id: "repeater-test",
    title: "Repeater Test",
    sections: [
      {
        id: "s1",
        title: "Main",
        fields: [
          {
            id: "rep",
            name: "items",
            type: "repeater",
            label: "Items",
            fields: [
              {
                id: "rn",
                name: "itemName",
                type: "text",
                label: "Item Name",
                required: true,
              },
            ],
          },
        ],
      },
    ],
  };

  it("should resolve static repeater field", () => {
    const form = new FormCore(
      repeaterDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );
    const field = form.resolveField("rep");
    expect(field).toBeDefined();
    expect(field?.id).toBe("rep");
  });

  it("should resolve dynamic repeater field paths", () => {
    const form = new FormCore(
      repeaterDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );
    const dynamicPath = "items[0].itemName";
    const field = form.resolveField(dynamicPath);
    expect(field).toBeDefined();
    expect(field?.id).toBe(dynamicPath);
    expect(field?.type).toBe("text");
  });

  it("should set values on repeater rows via path", async () => {
    const form = new FormCore(
      repeaterDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );

    await form.setValue("items[0].itemName", "Widget");

    expect(form.values.items[0].itemName).toBe("Widget");
    expect(form.state.vitality["items[0].itemName"].dirty).toBe(true);
  });

  it("should validate required fields inside repeater rows", async () => {
    const form = new FormCore(
      repeaterDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );

    await form.setValue("items[0].itemName", "");

    const validity = form.state.validity["items[0].itemName"];
    expect(validity).toBeDefined();
    expect(validity.valid).toBe(false);
    expect(validity.errors?.[0].code).toBe("required");
  });

  it("should maintain separate state for multiple rows", async () => {
    const form = new FormCore(
      repeaterDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );

    await form.setValue("items[0].itemName", "First");
    await form.setValue("items[1].itemName", "Second");

    expect(form.values.items[0].itemName).toBe("First");
    expect(form.values.items[1].itemName).toBe("Second");
  });
});
