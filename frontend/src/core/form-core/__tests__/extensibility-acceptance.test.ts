import { describe, it, expect, vi, beforeEach } from "vitest";
import { FormCore } from "../engine";
import {
  fieldAdapterRegistry,
  registerFieldAdapter,
  type FieldAdapter,
  type FormDefinition,
} from "../domain";
import {
  registerValidationStrategy,
  ValidationRegistry,
} from "../validation-registry";
import { ConditionRegistry } from "../condition-registry";

describe("Form-Core 3.0: Practical Extensibility & Architectural Acceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // CAPABILITY 1: Field Extensibility via Pluggable FieldAdapter
  // ==========================================================================
  describe("1. Field Extensibility (Pluggable FieldAdapter without Core Changes)", () => {
    interface ColorModel {
      hex: string;
      alpha: number;
    }

    const ColorPaletteAdapter: FieldAdapter<ColorModel> = {
      type: "color-palette",
      parse(input: unknown): ColorModel {
        if (typeof input === "string") {
          const hex = input.startsWith("#") ? input : `#${input}`;
          return { hex, alpha: 1.0 };
        }
        if (typeof input === "object" && input !== null && "hex" in input) {
          const val = input as any;
          return { hex: val.hex, alpha: val.alpha ?? 1.0 };
        }
        return { hex: "#000000", alpha: 1.0 };
      },
      serialize(value: ColorModel): string {
        return `rgba(${value.hex}, ${value.alpha})`;
      },
      format(value: ColorModel): string {
        return `Color: ${value.hex.toUpperCase()} (${Math.round(value.alpha * 100)}%)`;
      },
    };

    it("registers a custom field type and executes parse/serialize/format via adapter", async () => {
      // 1. Register the adapter into fieldAdapterRegistry
      registerFieldAdapter(ColorPaletteAdapter);
      expect(fieldAdapterRegistry.has("color-palette")).toBe(true);

      // 2. Instantiate FormCore with a color-palette field
      const formDef: FormDefinition = {
        id: "theme-config-form",
        title: "Theme Config",
        fields: [
          {
            id: "primaryColor",
            name: "primaryColor",
            type: "color-palette" as any,
            label: "Primary Theme Color",
            defaultValue: "#ffffff",
          },
        ],
      };

      const form = new FormCore(formDef);

      // 3. Setting a raw hex string should trigger adapter.parse
      await form.setValue("primaryColor", "ff5733");

      const parsedValue = form.values.primaryColor as ColorModel;
      expect(parsedValue).toEqual({ hex: "#ff5733", alpha: 1.0 });

      // 4. Test format and serialize helpers
      const formatted = fieldAdapterRegistry.format("color-palette", parsedValue);
      expect(formatted).toBe("Color: #FF5733 (100%)");

      const serialized = fieldAdapterRegistry.serialize("color-palette", parsedValue);
      expect(serialized).toBe("rgba(#ff5733, 1)");
    });
  });

  // ==========================================================================
  // CAPABILITY 2: Validation Extensibility via ValidationRegistry
  // ==========================================================================
  describe("2. Validation Extensibility (Pluggable Custom Async Validation Rule)", () => {
    it("registers and executes an asynchronous domain validation strategy", async () => {
      // Register custom async rule "vat-id-verification"
      registerValidationStrategy("vat-id-verification", {
        async validate(value: any) {
          if (!value) return true; // empty values handled by required rule
          await new Promise((resolve) => setTimeout(resolve, 10)); // simulate network delay
          // Must start with EU and have exactly 9 digits
          return typeof value === "string" && /^EU\d{9}$/.test(value);
        },
        defaultMessage(_rule, field) {
          return `${field.label || field.name} is not a valid EU VAT number`;
        },
      });

      expect(ValidationRegistry["vat-id-verification"]).toBeDefined();

      const formDef: FormDefinition = {
        id: "billing-form",
        title: "Billing Details",
        fields: [
          {
            id: "vatNumber",
            name: "vatNumber",
            type: "text",
            label: "VAT Number",
            validation: {
              rules: [
                {
                  type: "vat-id-verification" as any,
                },
              ],
            },
          },
        ],
      };

      const form = new FormCore(formDef, undefined, { validationMode: "onChange" });

      // 1. Invalid VAT Number
      await form.setValue("vatNumber", "INVALID_VAT");
      // Wait for debounce and async validation
      await new Promise((resolve) => setTimeout(resolve, 350));

      const fieldId = form.nameToIdMap["vatNumber"];
      let errors = form.validity[fieldId]?.errors || [];
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("VAT Number is not a valid EU VAT number");

      // 2. Valid VAT Number
      await form.setValue("vatNumber", "EU123456789");
      await new Promise((resolve) => setTimeout(resolve, 350));

      errors = form.validity[fieldId]?.errors || [];
      expect(errors.length).toBe(0);
    });
  });

  // ==========================================================================
  // CAPABILITY 3: Dependency Extensibility via ConditionRegistry
  // ==========================================================================
  describe("3. Dependency Extensibility (Custom Reactive Condition Operator)", () => {
    it("registers a custom condition operator and coordinates reactive visibility", async () => {
      const conditionReg = ConditionRegistry.getInstance();

      // Register custom operator "isFiscalQuarter"
      // Checks whether the period's month falls into the specified fiscal quarter
      const quarterMap: Record<string, string[]> = {
        Q1: ["January", "February", "March"],
        Q2: ["April", "May", "June"],
        Q3: ["July", "August", "September"],
        Q4: ["October", "November", "December"],
      };

      conditionReg.register("isFiscalQuarter", (fieldValue: any, targetQuarter: any) => {
        const allowedMonths = quarterMap[String(targetQuarter)] || [];
        return allowedMonths.includes(String(fieldValue));
      });

      const formDef: FormDefinition = {
        id: "financial-reporting-form",
        title: "Financial Reporting",
        fields: [
          {
            id: "reportingMonth",
            name: "reportingMonth",
            type: "select",
            label: "Reporting Month",
            defaultValue: "January",
          },
          {
            id: "annualAuditReport",
            name: "annualAuditReport",
            type: "text",
            label: "Annual Audit Report (Q4 Only)",
            conditions: {
              groups: [
                {
                  action: "show",
                  rules: [
                    {
                      field: "reportingMonth",
                      operator: "isFiscalQuarter" as any,
                      value: "Q4",
                    },
                  ],
                },
              ],
            },
          },
        ],
      };

      const form = new FormCore(formDef);

      // Month is January (Q1) -> annualAuditReport should be hidden
      const auditFieldId = form.nameToIdMap["annualAuditReport"];
      expect(form.visibility[auditFieldId]).toBe(false);

      // Change month to November (Q4) -> annualAuditReport should become visible
      await form.setValue("reportingMonth", "November");
      expect(form.visibility[auditFieldId]).toBe(true);

      // Change month to May (Q2) -> annualAuditReport should hide again
      await form.setValue("reportingMonth", "May");
      expect(form.visibility[auditFieldId]).toBe(false);
    });
  });

  // ==========================================================================
  // CAPABILITY 4: Behavior Extensibility via Middleware (form.use)
  // ==========================================================================
  describe("4. Behavior Extensibility (Lifecycle Middleware without Core Changes)", () => {
    it("attaches cross-cutting audit logger middleware via form.use()", async () => {
      interface AuditEntry {
        fieldId: string;
        value: unknown;
        timestamp: number;
      }

      const auditTrail: AuditEntry[] = [];

      const formDef: FormDefinition = {
        id: "vendor-management",
        title: "Vendor Management",
        fields: [
          { id: "vendorName", name: "vendorName", type: "text", label: "Vendor Name" },
          { id: "creditRating", name: "creditRating", type: "number", label: "Credit Rating" },
        ],
      };

      const form = new FormCore(formDef);

      // Attach middleware
      form.use(async ({ form: f, fieldId }) => {
        if (!fieldId) return;
        const field = f.resolver.resolveField(fieldId);
        const fieldName = field?.name || fieldId;
        const currentValue = f.values[fieldName];
        auditTrail.push({
          fieldId,
          value: currentValue,
          timestamp: Date.now(),
        });
      });

      // Perform field mutations
      await form.setValue("vendorName", "Cyberdyne Systems");
      await form.setValue("creditRating", 95);

      expect(auditTrail).toHaveLength(2);
      expect(auditTrail[0].value).toBe("Cyberdyne Systems");
      expect(auditTrail[1].value).toBe(95);
    });
  });

  // ==========================================================================
  // CAPABILITY 5: MetaConfig v2 Four Pillars Integration
  // ==========================================================================
  describe("5. MetaConfig v2 Canonical IR (Content, Surface, Behavior, Governance)", () => {
    it("instantiates cleanly from a MetaConfig v2 canonical definition", () => {
      const canonicalConfig: FormDefinition = {
        id: "purchase-order-v2",
        schemaVersion: 2,
        title: "Purchase Order Request",

        // Pillar 1: Content
        content: {
          id: "po-content",
          title: "PO Content",
          fields: [
            {
              id: "vendorId",
              name: "vendorId",
              type: "text",
              label: "Vendor ID",
              required: true,
              defaultValue: "VEND-001",
            },
          ],
        },

        // Pillar 2: Surface
        surface: {
          target: "screen",
          density: "compact",
          width: "full",
        },

        // Pillar 3: Behavior
        behavior: {
          rules: [],
        },

        // Pillar 4: Governance
        governance: {
          permissions: {
            roles: ["procurement_officer", "finance_admin"],
            rules: [
              {
                fieldId: "vendorId",
                access: "editable",
                roles: ["procurement_officer"],
              },
            ],
          },
          audit: {
            trackChanges: true,
            requireReasonOnEdit: true,
          },
          concurrency: {
            mode: "optimistic",
            versionField: "lockVersion",
          },
          schemaVersion: 2,
        },

        fields: [
          {
            id: "vendorId",
            name: "vendorId",
            type: "text",
            label: "Vendor ID",
            required: true,
            defaultValue: "VEND-001",
          },
        ],
      };

      const form = new FormCore(canonicalConfig);

      expect(form.values.vendorId).toBe("VEND-001");
      expect(form.definition.metadata.schemaVersion).toBe(2);
      expect(form.definition.metadata.governance?.concurrency?.mode).toBe("optimistic");
      expect(form.definition.metadata.surface?.target).toBe("screen");
    });
  });
});
