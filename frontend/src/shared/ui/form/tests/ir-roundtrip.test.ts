import { describe, it, expect } from "vitest";
import { defineFormContract, compileContractToFormDefinition, compileContractToIR, validateContract } from "@/shared/ui/form";
import type { EntityDefinition } from "@/shared/ui/form";
import { compileEntityToFormDef, compileEntityToIR, validateEntityDefinition } from "@/shared/ui/form";
import { IRToFormDefinition } from "@/shared/ui/form/utils/ir-compiler";

describe("IR Round-trip Tests", () => {
  // Sample contract for testing
  const UserContract = defineFormContract({
    id: "user-profile",
    title: "User Profile",
    submitLabel: "Save Profile",
    settings: {
      density: "comfortable",
      layoutMode: "portal",
    },
    sections: [
      {
        id: "basic",
        title: "Basic Information",
        layout: { type: "grid", columns: 12, gap: "md" },
        fields: [
          {
            id: "firstName",
            name: "firstName",
            type: "string",
            component: "text",
            label: "First Name",
            required: true,
            layout: { columnSpan: 6 },
            properties: { placeholder: "John" },
          },
          {
            id: "lastName",
            name: "lastName",
            type: "string",
            component: "text",
            label: "Last Name",
            required: true,
            layout: { columnSpan: 6 },
            properties: { placeholder: "Doe" },
          },
          {
            id: "email",
            name: "email",
            type: "string",
            component: "email",
            label: "Email",
            required: true,
            layout: { columnSpan: 12 },
            properties: { placeholder: "john@example.com" },
          },
          {
            id: "role",
            name: "role",
            type: "string",
            component: "select",
            label: "Role",
            required: true,
            layout: { columnSpan: 12 },
            options: [
              { label: "Admin", value: "admin" },
              { label: "User", value: "user" },
              { label: "Viewer", value: "viewer" },
            ] as const,
          },
        ],
      },
    ],
  });

  // Sample entity for testing
  const UserEntity: EntityDefinition = {
    id: "user-entity",
    name: "User Profile",
    content: {
      sections: [
        {
          id: "basic",
          title: "Basic Info",
          fields: [
            { id: "firstName", name: "firstName", type: "text", label: "First Name", required: true },
            { id: "lastName", name: "lastName", type: "text", label: "Last Name", required: true },
            { id: "email", name: "email", type: "email", label: "Email", required: true },
          ],
        },
      ],
    },
    surface: {
      ui: { density: "comfortable" },
    },
  };

  describe("Contract API → IR → FormDefinition", () => {
    it("should compile contract to valid IR", () => {
      const result = compileContractToIR(UserContract);
      expect(result.validation.valid).toBe(true);
      expect(result.ir.id).toBe("user-profile");
      expect(result.ir.title).toBe("User Profile");
      expect(result.ir.content.sections).toHaveLength(1);
      expect(result.ir.content.sections[0].fields).toHaveLength(4);
    });

    it("should convert IR to FormDefinition", () => {
      const result = compileContractToIR(UserContract);
      const formDef = IRToFormDefinition(result.ir);
      expect(formDef.id).toBe("user-profile");
      expect(formDef.sections).toHaveLength(1);
      expect(formDef.sections[0].fields).toHaveLength(4);
    });

    it("should compile contract directly to FormDefinition", () => {
      const formDef = compileContractToFormDefinition(UserContract);
      expect(formDef.id).toBe("user-profile");
      expect(formDef.sections).toHaveLength(1);
    });

    it("should validate contract", () => {
      const validation = validateContract(UserContract);
      expect(validation.valid).toBe(true);
    });
  });

  describe("EntityDefinition → IR → FormDefinition", () => {
    it("should compile entity to valid IR", () => {
      const result = compileEntityToIR(UserEntity, "user-form", "Save Profile");
      expect(result.validation.valid).toBe(true);
      expect(result.ir.id).toBe("user-form");
      expect(result.ir.title).toBe("User Profile");
      expect(result.ir.content.sections).toHaveLength(1);
    });

    it("should convert IR to FormDefinition", () => {
      const result = compileEntityToIR(UserEntity, "user-form", "Save Profile");
      const formDef = IRToFormDefinition(result.ir);
      expect(formDef.id).toBe("user-form");
      expect(formDef.sections).toHaveLength(1);
    });

    it("should compile entity directly to FormDefinition", () => {
      const formDef = compileEntityToFormDef(UserEntity, "user-form", "Save Profile");
      expect(formDef.id).toBe("user-form");
      expect(formDef.sections).toHaveLength(1);
    });

    it("should validate entity", () => {
      const validation = validateEntityDefinition(UserEntity, "user-form", "Save Profile");
      expect(validation.valid).toBe(true);
    });
  });

  describe("IR Validation", () => {
    it("should reject IR with missing required fields", () => {
      const result = compileToIR({
        ...UserContract,
        title: "",
      } as any, {
        formId: "test",
        submitLabel: "Submit",
        sourceType: "contract",
      });
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors.some(e => e.code === "MISSING_TITLE")).toBe(true);
    });

    it("should reject IR with duplicate field IDs", () => {
      const result = compileToIR({
        ...UserContract,
        sections: [{
          ...UserContract.sections[0],
          fields: [
            ...UserContract.sections[0].fields,
            {
              id: "firstName", // Duplicate ID
              name: "firstName2",
              type: "string",
              component: "text",
              label: "First Name 2",
            }
          ]
        }]
      } as any, {
        formId: "test",
        submitLabel: "Submit",
        sourceType: "contract",
      });
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors.some(e => e.code === "DUPLICATE_FIELD_ID")).toBe(true);
    });

    it("should reject IR with invalid columnSpan", () => {
      const result = compileToIR({
        ...UserContract,
        sections: [{
          ...UserContract.sections[0],
          fields: [
            {
              ...UserContract.sections[0].fields[0],
              layout: { columnSpan: 15 }, // Invalid - max 12
            }
          ]
        }]
      } as any, {
        formId: "test",
        submitLabel: "Submit",
        sourceType: "contract",
      });
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors.some(e => e.code === "INVALID_COLUMN_SPAN")).toBe(true);
    });

    it("should reject IR with dangerous expressions", () => {
      const result = compileToIR({
        ...UserContract,
        sections: [{
          ...UserContract.sections[0],
          fields: [
            {
              ...UserContract.sections[0].fields[0],
              visible: "eval('alert(1)')", // Dangerous
            }
          ]
        }]
      } as any, {
        formId: "test",
        submitLabel: "Submit",
        sourceType: "contract",
      });
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors.some(e => e.code === "EVAL_IN_EXPRESSION")).toBe(true);
    });

    it("should reject IR with function callbacks in schema", () => {
      const result = compileToIR({
        ...UserContract,
        sections: [{
          ...UserContract.sections[0],
          fields: [
            {
              ...UserContract.sections[0].fields[0],
              visible: (values: any) => values.role === "admin", // Function callback - not allowed
            }
          ]
        }]
      } as any, {
        formId: "test",
        submitLabel: "Submit",
        sourceType: "contract",
      });
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors.some(e => e.code === "FUNCTION_CALLBACK_IN_SCHEMA")).toBe(true);
    });

    it("should warn about empty options on select fields", () => {
      const result = compileToIR({
        ...UserContract,
        sections: [{
          ...UserContract.sections[0],
          fields: [
            {
              id: "emptySelect",
              name: "emptySelect",
              type: "string",
              component: "select",
              label: "Empty Select",
              // No options, no remoteOptions
            }
          ]
        }]
      } as any, {
        formId: "test",
        submitLabel: "Submit",
        sourceType: "contract",
      });
      expect(result.validation.warnings.some(w => w.code === "EMPTY_OPTIONS")).toBe(true);
    });

    it("should validate wizard forms have initialStepId", () => {
      const result = compileToIR({
        ...UserContract,
        settings: {
          ...UserContract.settings,
          wizard: {
            enabled: true,
            stepperType: "sidebar",
            linear: true,
            // Missing initialStepId
          }
        }
      } as any, {
        formId: "test",
        submitLabel: "Submit",
        sourceType: "contract",
      });
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors.some(e => e.code === "WIZARD_MISSING_INITIAL_STEP")).toBe(true);
    });
  });

  describe("Equivalence: Entity vs Contract compilation", () => {
    it("should produce equivalent FormDefinitions for same logical form", () => {
      const entityFormDef = compileEntityToFormDef(UserEntity, "user-form", "Save Profile");
      const contractFormDef = compileContractToFormDefinition(UserContract);

      // Both should have same structure
      expect(entityFormDef.id).toBe(contractFormDef.id);
      expect(entityFormDef.sections?.length).toBe(contractFormDef.sections?.length);
      expect(entityFormDef.fields?.length).toBe(contractFormDef.fields?.length);
    });

    it("should produce IR with same field count", () => {
      const entityResult = compileEntityToIR(UserEntity, "user-form", "Save Profile");
      const contractResult = compileContractToIR(UserContract);

      const entityFieldCount = countAllFields(entityResult.ir.content.sections) + entityResult.ir.content.fields.length;
      const contractFieldCount = countAllFields(contractResult.ir.content.sections) + contractResult.ir.content.fields.length;

      expect(entityFieldCount).toBe(contractFieldCount);
    });
  });

  describe("Complex form compilation", () => {
    it("should handle nested sections and repeaters", () => {
      const complexContract = defineFormContract({
        id: "complex-form",
        title: "Complex Form",
        submitLabel: "Submit",
        sections: [
          {
            id: "personal",
            title: "Personal Info",
            fields: [
              { id: "name", name: "name", type: "string", component: "text", label: "Name", required: true },
            ],
            subSections: [
              {
                id: "address",
                title: "Address",
                fields: [
                  { id: "street", name: "street", type: "string", component: "text", label: "Street" },
                  { id: "city", name: "city", type: "string", component: "text", label: "City" },
                ],
              },
            ],
          },
          {
            id: "items",
            title: "Line Items",
            fields: [
              {
                id: "itemsRepeater",
                name: "items",
                type: "repeater",
                component: "repeater",
                label: "Items",
                fields: [
                  { id: "itemName", name: "name", type: "string", component: "text", label: "Item Name" },
                  { id: "itemQty", name: "qty", type: "number", component: "number", label: "Quantity" },
                ],
                repeaterConfig: {
                  rowStateStrategy: "index",
                  minItems: 1,
                  maxItems: 10,
                  addButtonLabel: "Add Item",
                },
              },
            ],
          },
        ],
      });

      const result = compileContractToIR(complexContract);
      expect(result.validation.valid).toBe(true);
      expect(result.ir.content.sections).toHaveLength(2);
      expect(result.ir.content.sections[0].subSections).toHaveLength(1);
      expect(result.ir.content.sections[1].fields[0].component).toBe("repeater");
      expect(result.ir.content.sections[1].fields[0].repeaterConfig).not.toBeNull();
    });

    it("should handle remote options", () => {
      const contractWithRemote = defineFormContract({
        id: "remote-form",
        title: "Remote Options",
        submitLabel: "Submit",
        sections: [
          {
            id: "main",
            fields: [
              {
                id: "country",
                name: "country",
                type: "string",
                component: "select",
                label: "Country",
                options: [{ label: "US", value: "us" }, { label: "UK", value: "uk" }],
              },
              {
                id: "city",
                name: "city",
                type: "string",
                component: "autocomplete",
                label: "City",
                remoteOptions: {
                  url: "/api/cities",
                  method: "GET",
                  params: { countryId: "{{form.values.country}}" },
                  debounceMs: 300,
                },
              },
            ],
          },
        ],
      });

      const result = compileContractToIR(contractWithRemote);
      expect(result.validation.valid).toBe(true);
      const cityField = result.ir.content.sections[0].fields.find(f => f.id === "city");
      expect(cityField?.remoteOptions).not.toBeNull();
      expect(cityField?.remoteOptions?.url).toBe("/api/cities");
      expect(cityField?.remoteOptions?.watch).toContain("country");
    });
  });
});

function countAllFields<T>(sections: ReadonlyArray<any>): number {
  let count = 0;
  for (const section of sections) {
    count += section.fields.length;
    for (const field of section.fields) {
      count += countAllFields(field.fields);
    }
    count += countAllFields(section.subSections || []);
  }
  return count;
}

function compileToIR(source: any, options: any) {
  // Import dynamically to avoid circular deps in test
  const { compileToIR } = require("@/shared/ui/form/utils/ir-compiler");
  return compileToIR(source, options);
}