import { describe, expect, it } from "vitest";
import type { FormDefinition } from "../domain";
import { FormCore } from "../engine";

describe("Layer 1: Contract Conformance Tests (Pure Headless FormCore)", () => {
  const canonicalDefinition: FormDefinition = {
    id: "canonical-contract-form",
    title: "Canonical Contract Form",
    sections: [
      {
        id: "step_one",
        title: "Step 1: Account Type",
        fields: [
          {
            id: "accountType",
            name: "accountType",
            type: "select",
            label: "Account Type",
            required: true,
            options: [
              { label: "Personal", value: "personal" },
              { label: "Business", value: "business" },
            ],
          },
          {
            id: "companyName",
            name: "companyName",
            type: "text",
            label: "Company Name",
            required: true,
            meta: {
              conditions: {
                groups: [
                  {
                    action: "show",
                    rules: [
                      {
                        field: "accountType",
                        operator: "equals",
                        value: "business",
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
      },
      {
        id: "step_two",
        title: "Step 2: Profile",
        fields: [
          {
            id: "email",
            name: "email",
            type: "email",
            label: "Email Address",
            required: true,
          },
        ],
      },
    ],
  };

  describe("1. Initial State Contract", () => {
    it("should initialize complete 5V state adhering to canonical contract", () => {
      const form = new FormCore(canonicalDefinition, {
        accountType: "personal",
      });

      // V1: Values
      expect(form.values).toMatchObject({ accountType: "personal" });

      // V2: Validity
      expect(form.validity).toBeDefined();
      expect(form.validity.accountType).toMatchObject({ valid: true });

      // V3: Visibility (companyName condition: accountType === 'business')
      expect(form.visibility).toBeDefined();
      expect(form.visibility.companyName).toBe(false);

      // V4: View
      expect(form.view).toBeDefined();

      // V5: Vitality
      expect(form.vitality.accountType).toMatchObject({
        touched: false,
        dirty: false,
        version: 0,
      });

      expect(form.isDirty).toBe(false);
      expect(form.isValid).toBe(true);
    });
  });

  describe("2. State Transition & Mutation Semantics", () => {
    it("should immutably transition values and update vitality flags on setValue", async () => {
      const form = new FormCore(canonicalDefinition);

      // Default value before set is null
      expect(form.values.accountType).toBeNull();
      expect(form.vitality.accountType.dirty).toBe(false);

      await form.setValue("accountType", "personal");

      // Values updated
      expect(form.values.accountType).toBe("personal");

      // Vitality updated
      expect(form.vitality.accountType.dirty).toBe(true);
      expect(form.vitality.accountType.version).toBe(1);
      expect(form.isDirty).toBe(true);
    });

    it("should update touched vitality on setTouched", () => {
      const form = new FormCore(canonicalDefinition);

      expect(form.vitality.accountType.touched).toBe(false);
      form.setTouched("accountType");
      expect(form.vitality.accountType.touched).toBe(true);
    });
  });

  describe("3. Conditional Visibility Engine Contract", () => {
    it("should dynamically evaluate condition expression and transition visibility slice", async () => {
      const form = new FormCore(canonicalDefinition, { accountType: "personal" });

      // Initial: companyName hidden because accountType === 'personal'
      expect(form.visibility.companyName).toBe(false);

      // Mutate accountType to 'business' -> triggers condition re-evaluation
      await form.setValue("accountType", "business");

      // companyName should now be visible
      expect(form.visibility.companyName).toBe(true);

      // Revert to 'personal' -> companyName hidden again
      await form.setValue("accountType", "personal");
      expect(form.visibility.companyName).toBe(false);
    });
  });

  describe("4. Validation Pipeline & Error Diagnostics Contract", () => {
    it("should validate required fields and emit structured DetailedError records", async () => {
      const form = new FormCore(canonicalDefinition);

      // Attempt validate on empty form
      const isFieldValid = await form.validateFields(["accountType"]);
      expect(isFieldValid).toBe(false);

      const validity = form.validity.accountType;
      expect(validity.valid).toBe(false);
      expect(validity.errors).toBeDefined();
      expect(validity.errors?.length).toBeGreaterThan(0);

      const err = validity.errors![0];
      expect(err).toMatchObject({
        code: "required",
        fieldId: "accountType",
      });
      expect(typeof err.message).toBe("string");
    });

    it("should block submit and return false when form contains validation errors", async () => {
      const form = new FormCore(canonicalDefinition);
      const submitSuccess = await form.submit();

      expect(submitSuccess).toBe(false);
      expect(form.isValid).toBe(false);
      expect(form.validity.accountType.valid).toBe(false);
    });

    it("should resolve true on submit when all required visible fields are valid", async () => {
      const form = new FormCore(canonicalDefinition, {
        accountType: "personal",
        email: "alice@example.com",
      });

      const submitSuccess = await form.submit();
      expect(submitSuccess).toBe(true);
      expect(form.isValid).toBe(true);
    });
  });

  describe("5. Wizard & Flow Proxy Contract", () => {
    it("should compute sequential step navigation through rootSections", () => {
      const form = new FormCore(canonicalDefinition);
      const flow = form.flow;

      expect(flow.getNextStep("step_one")).toBe("step_two");
      expect(flow.getNextStep("step_two")).toBeNull();
      expect(flow.isLastStep("step_one")).toBe(false);
      expect(flow.isLastStep("step_two")).toBe(true);
    });
  });

  describe("6. Reset Semantics Contract", () => {
    it("should restore pristine values, clear dirty and touched flags, and clear errors", async () => {
      const initialValues = { accountType: "personal" };
      const form = new FormCore(canonicalDefinition, initialValues);

      await form.setValue("accountType", "business");
      form.setTouched("accountType");
      expect(form.vitality.accountType.dirty).toBe(true);
      expect(form.vitality.accountType.touched).toBe(true);

      // Trigger reset with original pristine baseline
      form.reset(initialValues);

      // State restored
      expect(form.values.accountType).toBe("personal");
      expect(form.vitality.accountType.dirty).toBe(false);
      expect(form.vitality.accountType.touched).toBe(false);
      expect(form.isDirty).toBe(false);
    });
  });
});
