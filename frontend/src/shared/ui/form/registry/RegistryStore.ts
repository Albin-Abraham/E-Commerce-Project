import React from "react";
import { z } from "zod";

import type { FieldComponent } from "@ui/form/fields/registry";

/**
 * FieldDefinition
 *
 * Defines the strict structural, validation, and rendering contract for a field type.
 * Bundles raw API payload validation, lightweight mappers, and pure presenter components.
 */
export interface FieldDefinition<TRaw = any, TProps = any> {
  type: string;
  schema: z.ZodSchema<TRaw>;
  mapper: (raw: TRaw) => TProps;
  component: React.ComponentType<TProps>;
  defaultValue: any;
}

/**
 * RegistryStore - Manages the mapping of field types to React components.
 *
 * Extends the static registry into a dynamic plugin system supporting:
 * 1. Runtime component and contract definition registration.
 * 2. Context-dependent definition overrides (e.g. per-tenant, per-form overrides).
 * 3. Zod-powered schema contract verification at boundary level.
 * 4. Lightweight pure mapping & elegant fallbacks.
 */
export class RegistryStore {
  protected components: Map<string, FieldComponent>;
  private definitions: Map<string, FieldDefinition<any, any>>;

  constructor(initialFields?: Record<string, FieldComponent>) {
    this.components = new Map(Object.entries(initialFields || {}));
    this.definitions = new Map();
  }

  /**
   * Register a new field component or override an existing one (legacy).
   */
  public register(type: string, component: FieldComponent): void {
    this.components.set(type, component);
  }

  /**
   * Register multiple components at once (legacy).
   */
  public registerMany(fields: Record<string, FieldComponent>): void {
    Object.entries(fields).forEach(([type, component]) => {
      this.register(type, component);
    });
  }

  /**
   * Resolve a component by its type (legacy).
   * Falls back to 'text' if not found.
   */
  public get(type: string): FieldComponent {
    const component = this.components.get(type);
    if (!component) {
      console.warn(
        `[RegistryStore] Unknown field type: "${type}". Falling back to "text" renderer.`
      );
      return this.components.get("text")!;
    }
    return component;
  }

  /**
   * Clone the current registry store.
   * Useful for scoping registries to specific form instances.
   */
  public clone(): RegistryStore {
    const newStore = new RegistryStore({});
    this.components.forEach((comp, type) => newStore.register(type, comp));
    this.definitions.forEach((defn, key) =>
      newStore.definitions.set(key, defn)
    );
    return newStore;
  }

  /**
   * Internal access for context mapping.
   */
  public getAll(): Record<string, FieldComponent> {
    const all: Record<string, FieldComponent> = {};
    this.components.forEach((comp, type) => {
      all[type] = comp;
    });
    return all;
  }

  // ── Pluggable Dynamic Registry & Field Contract System ──────────

  /**
   * Register a new FieldDefinition contract plugin at runtime.
   */
  public registerDefinition(definition: FieldDefinition<any, any>): void {
    this.definitions.set(definition.type, definition);
    this.register(definition.type, definition.component as any);
  }

  /**
   * Validate raw API/JSON schema payload against a field definition's boundary schema.
   */
  public validateRaw(type: string, raw: any): boolean {
    const def = this.definitions.get(type);
    if (!def) return true; // Graceful skip if no schema attached
    const res = def.schema.safeParse(raw);
    return res.success;
  }

  /**
   * Transform raw payload into mapped UI component props using the registered definition mapper.
   */
  public mapProps(type: string, raw: any): any {
    const def = this.definitions.get(type);
    if (!def) return raw;
    try {
      return def.mapper(raw);
    } catch (err) {
      console.error(
        `[RegistryStore] Failed to map props for type "${type}". Falling back to raw.`,
        err
      );
      return raw;
    }
  }

  /**
   * Retrieve fallback/default value declared for a specific field definition.
   */
  public getDefaultValue(type: string): any {
    const def = this.definitions.get(type);
    return def ? def.defaultValue : undefined;
  }

  /**
   * Override a FieldDefinition contract for a specific form/tenant/page context.
   */
  public overrideDefinition(
    type: string,
    context: string,
    definition: FieldDefinition<any, any>
  ): void {
    this.definitions.set(`${type}::${context}`, definition);
  }

  /**
   * Resolve a FieldDefinition contract with context fallback support.
   */
  public resolveDefinition(
    type: string,
    context?: string
  ): FieldDefinition<any, any> | undefined {
    if (context) {
      const scoped = this.definitions.get(`${type}::${context}`);
      if (scoped) return scoped;
    }
    return this.definitions.get(type);
  }

  /**
   * Render any raw field data cleanly using contract definitions.
   * Performs loud Zod schema verification and mapper coercion at runtime boundaries.
   */
  public render(
    rawField: { type: string; [key: string]: any },
    context?: string
  ): React.ReactElement {
    const definition = this.resolveDefinition(rawField.type, context);

    if (!definition) {
      return React.createElement(
        "div",
        {
          className:
            "p-4 border border-dashed border-warning/50 bg-warning/5 rounded-lg text-xs text-warning",
          "data-testid": `unknown-fallback-${rawField.type}`,
        },
        `[Registry Warning]: Unknown field type "${rawField.type}" requested.`
      );
    }

    // 1. Zod payload boundary schema verification
    const parsed = definition.schema.safeParse(rawField);
    if (!parsed.success) {
      const issues = parsed.error.issues || [];
      return React.createElement(
        "div",
        {
          className:
            "p-4 border border-solid border-danger/60 bg-danger/5 rounded-lg text-xs text-danger flex flex-col gap-2",
          "data-testid": `schema-error-${rawField.type}`,
        },
        [
          React.createElement(
            "span",
            { key: "title", className: "font-semibold" },
            `[Contract Error]: Invalid API payload for "${rawField.type}"`
          ),
          React.createElement(
            "ul",
            { key: "list", className: "list-disc pl-4 text-xs space-y-1" },
            issues.map((err, idx) =>
              React.createElement(
                "li",
                { key: idx },
                `${err.path.join(".") || "field"}: ${err.message}`
              )
            )
          ),
        ]
      );
    }

    // 2. Perform pure data-to-props mapping
    const props = definition.mapper(parsed.data);

    // 3. Render pure presentation component
    return React.createElement(definition.component as any, props);
  }

  /**
   * Check if a field definition or legacy component exists for a given type.
   */
  public has(type: string): boolean {
    return this.components.has(type) || this.definitions.has(type);
  }
}
