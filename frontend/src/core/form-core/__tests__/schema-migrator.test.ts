import { describe, expect, it } from "vitest";
import {
  detectSchemaVersion,
  migrateSchema,
  migrateSchemaToV2,
} from "../transformers/schema-migrator";

describe("schema-migrator", () => {
  it("detects v1 vs v2 schemas accurately", () => {
    expect(detectSchemaVersion({ version: "2.0", fields: [] })).toBe("2.0");
    expect(detectSchemaVersion({ fields: [{ id: "name", dependsOn: { field: "role" } }] })).toBe("1.0");
    expect(detectSchemaVersion({ events: { onChange: () => {} }, fields: [] })).toBe("1.0");
  });

  it("migrates legacy dependsOn and rules to canonical conditions and validation", () => {
    const legacySchema = {
      id: "legacy-user-form",
      fields: [
        {
          name: "role",
          type: "text",
          rules: ["required"],
        },
        {
          id: "department",
          type: "text",
          dependsOn: {
            field: "role",
            operator: "equals",
            value: "admin",
            action: "show",
          },
          validation: {
            required: "Department is mandatory for admin",
            min: 3,
          },
        },
      ],
    };

    const { schema, report } = migrateSchemaToV2(legacySchema);

    expect(schema.version).toBe("2.0");
    expect(report.originalVersion).toBe("1.0");
    expect(report.targetVersion).toBe("2.0");

    // Field 1: derived ID and normalized validation
    expect(schema.fields![0].id).toBe("role");
    expect(schema.fields![0].validation).toEqual([{ type: "required" }]);

    // Field 2: converted dependsOn to conditions, and object validation to array
    const deptField = schema.fields![1];
    expect(deptField.conditions).toEqual([
      {
        field: "role",
        operator: "equals",
        value: "admin",
        action: "show",
      },
    ]);
    expect(deptField.validation).toEqual([
      { type: "required", message: "Department is mandatory for admin" },
      { type: "min", value: 3 },
    ]);
    expect((deptField as any).dependsOn).toBeUndefined();
  });

  it("migrates legacy root events to metadata.events", () => {
    const legacyWithEvents = {
      id: "event-form",
      events: {
        onChange: "handleFormChange",
      },
      fields: [{ id: "f1", name: "f1", type: "text" }],
    };

    const migrated = migrateSchema(legacyWithEvents);
    expect(migrated.version).toBe("2.0");
    expect(migrated.metadata?.events?.onChange).toBe("handleFormChange");
  });
});
