import { describe, it, expect, vi } from "vitest";
import { FormCore } from "../engine";
import { normalizeFormDefinition } from "../modules/field-registry";
import { detectDependencyCycles } from "../domain/dependency-graph";
import type { FormDefinition } from "../domain";

describe("FieldDependencyGraph & Reactive Cascade", () => {
  describe("Normalization & Graph Construction", () => {
    it("extracts categorized dependencies across visibility, computed, validation, and remoteOptions", () => {
      const def: FormDefinition = {
        id: "cascade-form",
        sections: [
          {
            id: "sec1",
            fields: [
              {
                id: "country",
                name: "country",
                type: "select",
                label: "Country",
              },
              {
                id: "city",
                name: "city",
                type: "select",
                label: "City",
                remoteOptions: {
                  url: "/api/cities",
                  watch: ["country"],
                },
              },
              {
                id: "qty",
                name: "qty",
                type: "number",
                label: "Quantity",
              },
              {
                id: "unitPrice",
                name: "unitPrice",
                type: "number",
                label: "Unit Price",
              },
              {
                id: "subtotal",
                name: "subtotal",
                type: "number",
                label: "Subtotal",
                computed: {
                  formula: "{{qty}} * {{unitPrice}}",
                  dependsOn: ["qty", "unitPrice"],
                },
              },
              {
                id: "password",
                name: "password",
                type: "password",
                label: "Password",
              },
              {
                id: "confirmPassword",
                name: "confirmPassword",
                type: "password",
                label: "Confirm Password",
                validation: {
                  dependsOn: ["password"],
                  rules: [
                    {
                      type: "match",
                      field: "password",
                      message: "Passwords must match",
                    },
                  ],
                },
              },
              {
                id: "taxId",
                name: "taxId",
                type: "text",
                label: "Tax ID",
                visible: {
                  expression: "{{country}} === 'US'",
                },
              },
            ],
          },
        ],
      };

      const norm = normalizeFormDefinition(def);
      const graph = norm.fieldDependencyGraph;

      expect(graph).toBeDefined();

      // Country should trigger city remote options AND taxId visibility
      expect(graph["country"]).toBeDefined();
      expect(graph["country"].remoteOptions.has("city")).toBe(true);
      expect(graph["country"].visibility.has("taxId")).toBe(true);

      // Qty should trigger subtotal computed
      expect(graph["qty"]).toBeDefined();
      expect(graph["qty"].computed.has("subtotal")).toBe(true);

      // UnitPrice should trigger subtotal computed
      expect(graph["unitPrice"]).toBeDefined();
      expect(graph["unitPrice"].computed.has("subtotal")).toBe(true);

      // Password should trigger confirmPassword validation
      expect(graph["password"]).toBeDefined();
      expect(graph["password"].validation.has("confirmPassword")).toBe(true);
    });

    it("detects cyclic dependencies in computed and visibility graphs", () => {
      const cyclicGraph = {
        fieldA: {
          visibility: new Set<string>(),
          computed: new Set<string>(["fieldB"]),
          validation: new Set<string>(),
          remoteOptions: new Set<string>(),
        },
        fieldB: {
          visibility: new Set<string>(),
          computed: new Set<string>(["fieldC"]),
          validation: new Set<string>(),
          remoteOptions: new Set<string>(),
        },
        fieldC: {
          visibility: new Set<string>(),
          computed: new Set<string>(["fieldA"]),
          validation: new Set<string>(),
          remoteOptions: new Set<string>(),
        },
      };

      const cycle = detectDependencyCycles(cyclicGraph, ["computed"]);
      expect(cycle).not.toBeNull();
      expect(cycle).toEqual(["fieldA", "fieldB", "fieldC", "fieldA"]);
    });
  });

  describe("Targeted O(D) Computed Cascade", () => {
    it("recomputes only dependent fields without touching unrelated fields", async () => {
      const def: FormDefinition = {
        id: "calc-form",
        sections: [
          {
            id: "s1",
            fields: [
              { id: "a", name: "a", type: "number", label: "A" },
              { id: "b", name: "b", type: "number", label: "B" },
              {
                id: "c",
                name: "c",
                type: "number",
                label: "C (A + 10)",
                computed: {
                  formula: "{{a}} + 10",
                  dependsOn: ["a"],
                },
              },
              {
                id: "d",
                name: "d",
                type: "number",
                label: "D (C * 2)",
                computed: {
                  formula: "{{c}} * 2",
                  dependsOn: ["c"],
                },
              },
              { id: "unrelated", name: "unrelated", type: "text", label: "Unrelated" },
            ],
          },
        ],
      };

      const form = new FormCore(def, {
        a: 5,
        b: 20,
        c: 15,
        d: 30,
        unrelated: "hello",
      });

      // Update A from 5 to 10
      await form.setValue("a", 10);

      // C should be 10 + 10 = 20
      expect(form.getValue("c")).toBe(20);
      // D should cascade from C: 20 * 2 = 40
      expect(form.getValue("d")).toBe(40);
      // B and Unrelated must remain completely unchanged
      expect(form.getValue("b")).toBe(20);
      expect(form.getValue("unrelated")).toBe("hello");
    });
  });

  describe("Cross-Field Validation Cascade", () => {
    it("triggers re-validation of dependent field when target field is dirty", async () => {
      const def: FormDefinition = {
        id: "validation-form",
        sections: [
          {
            id: "s1",
            fields: [
              {
                id: "password",
                name: "password",
                type: "password",
                label: "Password",
              },
              {
                id: "confirmPassword",
                name: "confirmPassword",
                type: "password",
                label: "Confirm Password",
                validation: {
                  dependsOn: ["password"],
                  rules: [
                    {
                      type: "match",
                      value: "password",
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
        def,
        {},
        {
          validationMode: "onChange",
          validationDebounceMs: 0,
        }
      );

      // Case 1: Untouched confirmPassword should NOT show error when password changes
      await form.setValue("password", "secret123");
      const confirmValidityBefore = form.validity["confirmPassword"];
      expect(confirmValidityBefore?.valid ?? true).toBe(true);

      // Case 2: Now user touches confirmPassword with mismatch
      await form.setValue("confirmPassword", "wrong");
      expect(form.validity["confirmPassword"]?.valid).toBe(false);
      expect(form.validity["confirmPassword"]?.errors[0]?.message).toContain(
        "Passwords must match"
      );

      // Case 3: User corrects password to match "wrong"
      await form.setValue("password", "wrong");
      // Because confirmPassword is dirty, changing password revalidates confirmPassword!
      expect(form.validity["confirmPassword"]?.valid).toBe(true);
    });
  });

  describe("Cascading Remote Options", () => {
    it("triggers remote options reload for dependent fields on change", async () => {
      const def: FormDefinition = {
        id: "remote-form",
        sections: [
          {
            id: "s1",
            fields: [
              {
                id: "country",
                name: "country",
                type: "select",
                label: "Country",
              },
              {
                id: "state",
                name: "state",
                type: "select",
                label: "State",
                remoteOptions: {
                  url: "/api/states",
                  watch: ["country"],
                  debounceMs: 0,
                },
              },
            ],
          },
        ],
      };

      const form = new FormCore(def);
      const handleValueChangeSpy = vi.spyOn(
        (form as any).remoteOptions,
        "handleValueChange"
      );

      await form.setValue("country", "US");

      expect(handleValueChangeSpy).toHaveBeenCalledWith(
        "country",
        expect.any(Set)
      );
      const callArgs = handleValueChangeSpy.mock.calls[0];
      const depSet = callArgs[1] as Set<string>;
      expect(depSet.has("state")).toBe(true);
    });
  });
});
