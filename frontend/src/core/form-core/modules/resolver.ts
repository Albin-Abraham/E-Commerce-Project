/**
 * @file resolver.ts
 * @description Resolves field definitions from ID, name, or dynamic array path strings.
 *
 * ## Problem
 * Fields in the normalized form are indexed by ID (e.g., `"name_field_id"`).
 * But consumers often identify fields by name (e.g., `"name"`) or by a lodash-style
 * repeater path (e.g., `"users[0].name"`). This class bridges that gap.
 *
 * ## Resolution Strategy (fastest → slowest)
 * 1. **Direct ID lookup** — `O(1)`. Fastest path. Checks `norm.fields[identifier]`.
 * 2. **Name-to-ID lookup** — `O(1)`. Uses the pre-built `nameToIdMap`.
 * 3. **Dynamic repeater resolution** — `O(depth)`. Parses `"users[0].name"` via regex
 *    and constructs a virtual `FieldEntity` for the specific array index.
 *
 * ## Repeater Virtual Fields
 * Repeater children are defined as templates (e.g., field `"userName"` inside `"users"`).
 * When rendered at index 0, the path becomes `"users[0].userName"`. A real field with
 * that ID doesn't exist — so the resolver **creates a virtual field instance**:
 * ```ts
 * { ...template, id: "users[0].userName", name: "users[0].userName" }
 * ```
 * This lets the engine treat dynamic repeater fields identically to static fields.
 */
import type { FormField } from "../domain";
import { getFieldCategory, fieldAdapterRegistry } from "../domain";

import { fieldTypeRegistry } from "./capability-registry";
import type { ResolvedFieldType } from "./capability-registry";
import { FieldRegistry } from "./field-registry";

export class FieldResolver {
  /**
   * Pre-built map from field `name` → field `id` for all input and repeater fields.
   *
   * Constructed once in {@link initializeMap}. Used for O(1) name-based resolution.
   *
   * Only **input** fields (text, select, date, etc.) and **repeater** fields are mapped.
   * Structural fields (group, section, layout) are excluded — they hold no values.
   *
   * @example
   * this.nameToIdMap["city"] → "city_field_abc123"
   */
  public nameToIdMap: Record<string, string> = {};

  /**
   * @param registry - The `FieldRegistry` holding the normalized form definition.
   *   The resolver reads from it but never mutates it.
   * @param getState - Optional callback to get the current form state (required for identity resolution).
   */
  constructor(
    public readonly registry: FieldRegistry,
    private getState?: () => import("../int-types").InternalFormState<any>
  ) {
    this.initializeMap();
  }

  /**
   * Pre-builds the `nameToIdMap` by iterating all normalized fields once.
   *
   * Only maps `input` category fields and `repeater` fields — these are the ones
   * that participate in data binding and value resolution.
   *
   * Called once during construction; result is stable for the lifetime of the form.
   */
  private initializeMap() {
    Object.values(this.registry.definition.fields).forEach((field) => {
      if (
        (getFieldCategory(field.type) === "input" ||
          field.type === "repeater") &&
        field.name
      ) {
        this.nameToIdMap[field.name] = field.id;

        // Register explicit schema-level field aliases
        const aliases =
          (field as any).aliases || (field.meta as any)?.aliases;
        if (Array.isArray(aliases)) {
          aliases.forEach((alias: string) => {
            if (alias && typeof alias === "string") {
              this.nameToIdMap[alias] = field.id;
            }
          });
        }
      }
    });
  }

  /**
   * Resolves a field definition from an identifier — which may be:
   * - A field **ID** (e.g., `"name_field_abc123"`)
   * - A field **name** (e.g., `"name"`)
   * - A **dynamic repeater path** (e.g., `"users[0].name"`, `"users[1].addresses[2].street"`)
   *
   * Returns `undefined` if no matching field can be found or inferred.
   *
   * **Resolution order:**
   * 1. Direct ID lookup in `norm.fields` — O(1).
   * 2. Name-to-ID map lookup — O(1).
   * 3. Dynamic array path parsing — O(depth), creates a virtual field.
   *
   * @param identifier - The field identifier to resolve.
   * @returns The `FormField` definition (real or virtual), or `undefined` if not found.
   *
   * @example
   * // By ID:
   * resolver.resolveField("name_field_abc123");
   *
   * // By name:
   * resolver.resolveField("city");
   *
   * // By repeater path (single level):
   * resolver.resolveField("users[0].userName");
   * // → Virtual field: { ...userName_template, id: "users[0].userName", name: "users[0].userName" }
   *
   * // By repeater path (nested):
   * resolver.resolveField("users[0].addresses[1].street");
   * // → Virtual field for street inside addresses[1] inside users[0]
   */
  public resolveField(identifier: string): FormField | undefined {
    // ── 1. Direct ID lookup (fastest path) ───────────────────────────────
    if (this.registry.definition.fields[identifier]) {
      return this.registry.definition.fields[identifier];
    }

    // ── 2. Name → ID map lookup ───────────────────────────────────────────
    if (this.nameToIdMap[identifier]) {
      return this.registry.definition.fields[this.nameToIdMap[identifier]];
    }

    // ── 3. Dynamic repeater path resolution ──────────────────────────────
    // Pattern: "parentPath[index].childField"
    // Example: "users[0].name" → parentPath="users", index="0", childPath="name"
    //          "users[0].addresses[1].street" → parentPath="users[0].addresses", index="1", childPath="street"
    const arrayMatch = identifier.match(/^(.+)\[(\d+)\]\.(.+)$/);
    if (arrayMatch) {
      const [_match, parentPath, _index, childPath] = arrayMatch;

      // Recursively resolve the parent — this handles deeply nested paths
      // e.g., "users[0].addresses" itself resolves the users repeater, then the addresses template
      const parentField = this.resolveField(parentPath);

      if (parentField && parentField.fields) {
        // Find the child template by name or ID within the parent's template fields
        const template = parentField.fields.find(
          (f) => f.name === childPath || f.id === childPath
        );

        if (template) {
          // If the template was found, ensure we use the normalized version with capabilities
          const normalizedTemplate =
            (this.registry.definition.fields as any)[template.id!] || template;

          // Create a Virtual Field Instance for this specific array index.
          return {
            ...normalizedTemplate,
            id: identifier, // positional path
            stateKey: identifier, // Resolver currently stays positional; RenderTree handles identities
            name: identifier,
            parentId: parentPath,
            isTemplate: false,
          };
        }
      }
    }

    // ── 4. Identity-based repeater path resolution ──────────────────────
    // Pattern: "parentPath__rowId__childField"
    // Example: "users__abc__name" → parentPath="users", rowId="abc", childPath="name"
    const identityMatch = identifier.match(/^(.+)__(.+)__(.+)$/);
    if (identityMatch) {
      const [_match, parentPath, rowId, childPath] = identityMatch;
      const parentField = this.resolveField(parentPath);

      if (parentField && parentField.fields) {
        const template = parentField.fields.find(
          (f) => f.name === childPath || f.id === childPath
        );

        if (template) {
          const normalizedTemplate =
            (this.registry.definition.fields as any)[template.id!] || template;

          // Resolve the positional dataPath if state is available
          let dataPath = identifier; // Fallback
          const state = this.getState?.();

          if (state && parentField.name) {
            const repeaterValue = (state.values as any)[parentField.name];
            if (Array.isArray(repeaterValue)) {
              // find index by identity
              // Note: this assumes "id" is the identity field.
              // A more robust implementation would check the repeater configuration.
              const index = repeaterValue.findIndex(
                (row) =>
                  String(row?.id) === rowId ||
                  String(row?._rowId) === rowId
              );
              if (index !== -1) {
                dataPath = `${parentField.name}[${index}].${childPath}`;
              }
            }
          }

          return {
            ...normalizedTemplate,
            id: identifier,
            stateKey: identifier,
            dataPath,
            parentId: parentPath,
            isTemplate: false,
          };
        }
      }
    }

    // Nothing matched — field not defined in this form
    return undefined;
  }

  /**
   * Returns the registered configuration for a field's type.
   * Useful for accessing custom handlers (handleChange, resolveProps, etc).
   */
  public getFieldType(fieldId: string): ResolvedFieldType | undefined {
    const field = this.resolveField(fieldId);
    if (!field) return undefined;
    if (fieldTypeRegistry.has(field.type)) {
      return fieldTypeRegistry.get(field.type);
    }
    const adapter = fieldAdapterRegistry.get(field.type);
    if (adapter) {
      return {
        type: adapter.type,
        category: "input",
        capabilities: {
          hasValue: true,
          hasValidity: true,
          hasVisibility: true,
          hasView: true,
          hasVitality: true,
          derivesValidityFromChildren: false,
        },
        handleChange: adapter.parse ? (raw) => adapter.parse!(raw) : undefined,
        validate: adapter.validate
          ? (val, ctx) => adapter.validate!(val, ctx)
          : undefined,
      };
    }
    return fieldTypeRegistry.get(field.type);
  }
}
