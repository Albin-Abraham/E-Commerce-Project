import { describe, expect, it, vi } from "vitest";
import { FormCore } from "../engine";
import type { FormDefinition } from "../domain";

describe("Unified Reactive Transaction Coordinator (10/10 Enterprise Requirement)", () => {
  it("should execute multi-tier cascade (Tier 1 Compute -> Tier 2 Visibility -> Tier 4 Validation) in topological order", async () => {
    const orderFormDef: FormDefinition = {
      id: "order-cascade-form",
      title: "Order Transaction Form",
      sections: [
        {
          id: "sec1",
          title: "Order Details",
          fields: [
            {
              id: "quantity",
              name: "quantity",
              type: "number",
              label: "Quantity",
              initialValue: 2,
            },
            {
              id: "unitPrice",
              name: "unitPrice",
              type: "number",
              label: "Unit Price",
              initialValue: 50,
            },
            {
              id: "subtotal",
              name: "subtotal",
              type: "number",
              label: "Subtotal",
              computed: {
                formula: "{{quantity}} * {{unitPrice}}",
                dependsOn: ["quantity", "unitPrice"],
                returnType: "number",
              },
            },
            {
              id: "tax",
              name: "tax",
              type: "number",
              label: "Tax",
              computed: {
                formula: "{{subtotal}} * 0.1",
                dependsOn: ["subtotal"],
                returnType: "number",
              },
            },
            {
              id: "total",
              name: "total",
              type: "number",
              label: "Total Amount",
              computed: {
                formula: "{{subtotal}} + {{tax}}",
                dependsOn: ["subtotal", "tax"],
                returnType: "number",
              },
              validation: {
                rules: [
                  {
                    type: "custom",
                    fn: (val: any) => Number(val) <= 1000,
                    message: "Total order cannot exceed 1000",
                  },
                ],
              },
            },
            {
              id: "specialShipping",
              name: "specialShipping",
              type: "text",
              label: "Special Shipping Instructions",
              conditions: {
                groups: [
                  {
                    action: "show",
                    rules: [
                      {
                        field: "total",
                        operator: "gt",
                        value: 200,
                      },
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
      orderFormDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );

    // Initial values: quantity=2, unitPrice=50
    // subtotal = 100, tax = 10, total = 110. total <= 200 -> specialShipping hidden
    expect(form.visibility["specialShipping"]).toBe(false);

    // ── Execute Transaction: Change quantity to 4 ─────────────────────────────
    // Tier 1: subtotal -> 4 * 50 = 200, tax -> 20, total -> 220
    // Tier 2: specialShipping visibility -> 220 > 200 -> true
    // Tier 4: total validation -> 220 <= 1000 -> valid
    await form.setValue("quantity", 4);

    expect(form.values.subtotal).toBe(200);
    expect(form.values.tax).toBe(20);
    expect(form.values.total).toBe(220);
    expect(form.visibility["specialShipping"]).toBe(true);
    expect(form.validity["total"]?.valid).toBe(true);

    // ── Execute Transaction: Exceed total limit (quantity to 20) ──────────────
    // Tier 1: subtotal -> 1000, tax -> 100, total -> 1100
    // Tier 4: total validation -> 1100 > 1000 -> invalid!
    await form.setValue("quantity", 20);

    expect(form.values.total).toBe(1100);
    expect(form.validity["total"]?.valid).toBe(false);
    expect(form.validity["total"]?.errors[0]?.message).toBe(
      "Total order cannot exceed 1000"
    );
  });

  it("should batch all tier updates into a single global notification to prevent UI re-render flicker", async () => {
    const def: FormDefinition = {
      id: "batch-notify-form",
      title: "Batch Notification Form",
      sections: [
        {
          id: "s1",
          title: "Section",
          fields: [
            { id: "a", name: "a", type: "number", initialValue: 1 },
            {
              id: "b",
              name: "b",
              type: "number",
              computed: {
                formula: "{{a}} * 2",
                dependsOn: ["a"],
                returnType: "number",
              },
            },
            {
              id: "c",
              name: "c",
              type: "number",
              computed: {
                formula: "{{b}} * 2",
                dependsOn: ["b"],
                returnType: "number",
              },
            },
          ],
        },
      ],
    };

    const form = new FormCore(def, {}, { validationMode: "onChange", validationDebounceMs: 0 });

    const globalSubscriber = vi.fn();
    form.subscribe(globalSubscriber);

    // Initial subscriber count: 0 before mutation
    expect(globalSubscriber).not.toHaveBeenCalled();

    // Trigger setValue: ripples through a -> b -> c
    // In setValue, the initial value write notifies immediately (for synchronous React / URL sync),
    // while all downstream cascading tiers (a -> b -> c) are batched together.
    await form.setValue("a", 10);

    // 1 for direct value write + 1 for the converged downstream cascade (instead of 3 separate calls!)
    expect(globalSubscriber).toHaveBeenCalledTimes(2);
    expect(form.values.b).toBe(20);
    expect(form.values.c).toBe(40);

    // When wrapped inside form.batch (e.g. transactional ERP submission or bulk update):
    globalSubscriber.mockClear();
    await form.batch(async () => {
      await form.setValue("a", 20);
    });
    // Exactly 1 unified global notification!
    expect(globalSubscriber).toHaveBeenCalledTimes(1);
    expect(form.values.b).toBe(40);
    expect(form.values.c).toBe(80);
  });

  it("should execute cross-field validation cascade when source dependency mutates", async () => {
    const passwordFormDef: FormDefinition = {
      id: "cross-validation-form",
      title: "Cross Field Validation",
      sections: [
        {
          id: "sec_auth",
          title: "Authentication",
          fields: [
            {
              id: "password",
              name: "password",
              type: "text",
              label: "Password",
              initialValue: "InitialSecret123",
            },
            {
              id: "confirmPassword",
              name: "confirmPassword",
              type: "text",
              label: "Confirm Password",
              initialValue: "InitialSecret123",
              validation: {
                dependsOn: ["password"],
                rules: [
                  {
                    type: "custom",
                    fn: (val: string, values: any) =>
                      val === values?.password,
                    message: "Passwords must match",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const form = new FormCore(
      passwordFormDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );

    // Mark confirmPassword as active (touched)
    form.setVitality("confirmPassword", { touched: true });

    // Validate initially - should be valid
    await form.validateFields(["confirmPassword"]);
    expect(form.validity["confirmPassword"]?.valid).toBe(true);

    // Change password to a different value
    // Tier 4 must automatically cascade validation to confirmPassword!
    await form.setValue("password", "NewSecret456");

    expect(form.validity["confirmPassword"]?.valid).toBe(false);
    expect(form.validity["confirmPassword"]?.errors[0]?.message).toBe(
      "Passwords must match"
    );

    // Re-align confirmPassword to match new password
    await form.setValue("confirmPassword", "NewSecret456");
    expect(form.validity["confirmPassword"]?.valid).toBe(true);
  });

  it("should coordinate visibility pruning and error clearance in Tier 2", async () => {
    const def: FormDefinition = {
      id: "visibility-prune-form",
      title: "Visibility Prune Form",
      sections: [
        {
          id: "s1",
          title: "General",
          fields: [
            {
              id: "hasVat",
              name: "hasVat",
              type: "checkbox",
              initialValue: true,
            },
            {
              id: "vatNumber",
              name: "vatNumber",
              type: "text",
              required: true,
              conditions: {
                groups: [
                  {
                    action: "show",
                    rules: [
                      {
                        field: "hasVat",
                        operator: "equals",
                        value: true,
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const form = new FormCore(def, {}, { validationMode: "onChange", validationDebounceMs: 0 });

    // With hasVat=true, vatNumber is empty and required -> invalid
    await form.setValue("vatNumber", "");
    expect(form.validity["vatNumber"]?.valid).toBe(false);

    // Toggle hasVat to false -> Tier 2 hides vatNumber and clears its validation errors
    await form.setValue("hasVat", false);

    expect(form.visibility["vatNumber"]).toBe(false);
    // Errors on hidden field must be cleared
    expect(form.validity["vatNumber"]?.valid).toBe(true);
    expect(form.validity["vatNumber"]?.errors.length).toBe(0);
  });
});
