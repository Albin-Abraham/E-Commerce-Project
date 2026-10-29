/**
 * @file schema-migrator.ts
 * @description Bidirectional & forward AST schema transformer for ZenOS Form & Detail definitions.
 * Automatically upgrades legacy v1 schema variants (e.g., dependsOn, legacy validation rules,
 * un-normalized conditions, root events) into canonical v2 FormDefinition schemas.
 */

import type { FormDefinition, FormField, ConditionRule, ValidationRule } from "../domain";
import { toCanonicalMetadataEvents } from "../utils/schema-compat";

export interface SchemaMigrationReport {
  originalVersion: "1.0" | "2.0";
  targetVersion: "2.0";
  transformations: string[];
  warnings: string[];
}

export interface MigrationResult {
  schema: FormDefinition;
  report: SchemaMigrationReport;
}

/**
 * Detect the schema contract version based on structural signatures.
 */
export function detectSchemaVersion(schema: any): "1.0" | "2.0" {
  if (!schema || typeof schema !== "object") return "1.0";
  if (schema.version === "2.0" || schema.schemaVersion === "2.0") return "2.0";

  // Signature checks for v1 legacy structures
  if (schema.events && !schema.metadata?.events) return "1.0";
  if (Array.isArray(schema.fields)) {
    for (const field of schema.fields) {
      if (field.dependsOn || field.showIf || field.hideIf) return "1.0";
      if (field.rules && !Array.isArray(field.validation)) return "1.0";
    }
  }

  return schema.version ? (schema.version as "1.0" | "2.0") : "1.0";
}

/**
 * Transform a legacy v1 field into a canonical v2 FormField.
 */
function migrateFieldToV2(
  field: any,
  transformations: string[],
  warnings: string[]
): FormField {
  if (!field || typeof field !== "object") return field;

  const migratedField: any = { ...field };

  // 1. Migrate ID / Name hygiene
  if (!migratedField.id && migratedField.name) {
    migratedField.id = migratedField.name;
    transformations.push(`Derived missing field.id from name "${migratedField.name}"`);
  }
  if (!migratedField.name && migratedField.id) {
    migratedField.name = migratedField.id;
    transformations.push(`Derived missing field.name from id "${migratedField.id}"`);
  }

  // 2. Normalize legacy validation rules
  if (migratedField.rules && !Array.isArray(migratedField.validation)) {
    const canonicalValidation: ValidationRule[] = [];
    for (const rule of migratedField.rules) {
      if (typeof rule === "string") {
        canonicalValidation.push({ type: rule as any });
      } else if (typeof rule === "object") {
        canonicalValidation.push(rule);
      }
    }
    migratedField.validation = canonicalValidation;
    delete migratedField.rules;
    transformations.push(
      `Normalized field "${migratedField.id}" legacy "rules" into canonical "validation" array`
    );
  }

  // Handle object-style validation map (e.g. { required: true, min: 5 })
  if (
    migratedField.validation &&
    typeof migratedField.validation === "object" &&
    !Array.isArray(migratedField.validation)
  ) {
    const rawVal = migratedField.validation;
    const rulesList: ValidationRule[] = [];
    if (rawVal.required) {
      rulesList.push({
        type: "required",
        message: typeof rawVal.required === "string" ? rawVal.required : undefined,
      });
    }
    if (rawVal.min !== undefined) {
      rulesList.push({ type: "min", value: rawVal.min });
    }
    if (rawVal.max !== undefined) {
      rulesList.push({ type: "max", value: rawVal.max });
    }
    if (rawVal.pattern) {
      rulesList.push({ type: "pattern", value: rawVal.pattern });
    }
    migratedField.validation = rulesList;
    transformations.push(
      `Converted object validation map on "${migratedField.id}" to canonical ValidationRule[]`
    );
  }

  // 3. Normalize legacy conditional visibility (dependsOn, showIf, hideIf)
  const canonicalConditions: ConditionRule[] = Array.isArray(migratedField.conditions)
    ? [...migratedField.conditions]
    : [];

  if (migratedField.dependsOn) {
    const dep = migratedField.dependsOn;
    if (typeof dep === "object" && dep.field) {
      canonicalConditions.push({
        field: dep.field,
        operator: dep.operator || "equals",
        value: dep.value,
        action: dep.action || "show",
      });
      transformations.push(
        `Migrated legacy "dependsOn" on "${migratedField.id}" to canonical condition rule`
      );
    }
    delete migratedField.dependsOn;
  }

  if (migratedField.showIf) {
    if (typeof migratedField.showIf === "object" && migratedField.showIf.field) {
      canonicalConditions.push({
        field: migratedField.showIf.field,
        operator: migratedField.showIf.operator || "equals",
        value: migratedField.showIf.value,
        action: "show",
      });
      transformations.push(
        `Migrated "showIf" object on "${migratedField.id}" to canonical condition rule`
      );
    } else if (typeof migratedField.showIf === "string") {
      warnings.push(
        `Field "${migratedField.id}" contains expression-based showIf ("${migratedField.showIf}"). Consider using ExpressionEngine syntax.`
      );
    }
    delete migratedField.showIf;
  }

  if (migratedField.hideIf) {
    if (typeof migratedField.hideIf === "object" && migratedField.hideIf.field) {
      canonicalConditions.push({
        field: migratedField.hideIf.field,
        operator: migratedField.hideIf.operator || "equals",
        value: migratedField.hideIf.value,
        action: "hide",
      });
      transformations.push(
        `Migrated "hideIf" object on "${migratedField.id}" to canonical condition rule`
      );
    }
    delete migratedField.hideIf;
  }

  if (canonicalConditions.length > 0) {
    migratedField.conditions = canonicalConditions;
  }

  // 4. Recursive migration for child fields / sections
  if (Array.isArray(migratedField.fields)) {
    migratedField.fields = migratedField.fields.map((child: any) =>
      migrateFieldToV2(child, transformations, warnings)
    );
  }

  return migratedField as FormField;
}

/**
 * Migrate any v1 or un-normalized schema to the canonical v2 FormDefinition contract.
 */
export function migrateSchemaToV2(schema: any): MigrationResult {
  if (!schema || typeof schema !== "object") {
    throw new Error("[SchemaMigrator] Cannot migrate non-object schema");
  }

  const originalVersion = detectSchemaVersion(schema);
  const transformations: string[] = [];
  const warnings: string[] = [];

  // Deep clone to preserve immutability
  const draft: any = JSON.parse(JSON.stringify(schema));

  // Ensure top-level ID
  if (!draft.id) {
    draft.id = `form-${Date.now().toString(36)}`;
    transformations.push(`Assigned generated id "${draft.id}" to schema`);
  }

  // Version stamp
  draft.version = "2.0";
  if (originalVersion !== "2.0") {
    transformations.push(`Upgraded version stamp from "${originalVersion}" to "2.0"`);
  }

  // Canonical metadata events
  const withEvents = toCanonicalMetadataEvents(draft);
  draft.metadata = withEvents.metadata;
  draft.events = withEvents.events;

  // Migrate top-level fields
  if (Array.isArray(draft.fields)) {
    draft.fields = draft.fields.map((field: any) =>
      migrateFieldToV2(field, transformations, warnings)
    );
  } else if (Array.isArray(draft.sections)) {
    // If sections exist, migrate fields within each section
    draft.sections = draft.sections.map((section: any) => {
      const secDraft = { ...section };
      if (Array.isArray(secDraft.fields)) {
        secDraft.fields = secDraft.fields.map((field: any) =>
          migrateFieldToV2(field, transformations, warnings)
        );
      }
      return secDraft;
    });
    transformations.push(`Migrated nested fields across ${draft.sections.length} sections`);
  }

  return {
    schema: draft as FormDefinition,
    report: {
      originalVersion,
      targetVersion: "2.0",
      transformations,
      warnings,
    },
  };
}

/**
 * Convenience entry point to migrate a schema to a target version.
 */
export function migrateSchema(
  schema: any,
  targetVersion: "2.0" = "2.0"
): FormDefinition {
  if (targetVersion === "2.0") {
    return migrateSchemaToV2(schema).schema;
  }
  throw new Error(`[SchemaMigrator] Unsupported target version: ${targetVersion}`);
}
