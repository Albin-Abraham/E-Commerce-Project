import type { FieldCapabilities } from "../domain";

export interface CategoryDefinition {
  name: string;
  defaultCapabilities: FieldCapabilities;
  allowedInRepeater?: boolean;
  allowedAsRoot?: boolean;
}

export interface FieldTypeConfig {
  category: string;
  capabilities?: Partial<FieldCapabilities>;
  defaultProps?: Record<string, any>;

  /** Custom prop transformer — runs inside resolution pipeline before props reach the component */
  resolveProps?: (
    resolved: any, // ResolvedFieldProps
    state: any, // FieldStateSnapshot
    context: any // FormCore
  ) => Record<string, any>;

  /** Custom change handler — runs inside FormExecution pipeline before hit V1 */
  handleChange?: (
    rawValue: any,
    context: any // FieldHandlerContext
  ) => any;

  /** Custom validation — runs in V2 parallel execution */
  validate?: (
    value: any,
    context: any // FieldValidationContext
  ) => any | Promise<any>;
}

export interface ResolvedFieldType extends FieldTypeConfig {
  type: string;
  category: string;
  capabilities: FieldCapabilities;
}

class CategoryRegistry {
  private categories = new Map<string, CategoryDefinition>();

  public register(key: string, definition: CategoryDefinition) {
    if (this.categories.has(key)) {
      throw new Error(`Category "${key}" is already registered.`);
    }
    this.categories.set(key, definition);
  }

  public get(key: string): CategoryDefinition {
    const cat = this.categories.get(key);
    if (!cat) {
      throw new Error(`Unknown category "${key}". Register it before use.`);
    }
    return cat;
  }
}

class FieldTypeRegistry {
  private types = new Map<string, ResolvedFieldType>();

  constructor(private categoryRegistry: CategoryRegistry) {}

  public register(type: string, config: FieldTypeConfig) {
    const category = this.categoryRegistry.get(config.category);

    const capabilities: FieldCapabilities = {
      ...category.defaultCapabilities,
      ...(config.capabilities || {}),
    };

    this.types.set(type, {
      type,
      category: config.category,
      capabilities,
      defaultProps: config.defaultProps,
      resolveProps: config.resolveProps,
      handleChange: config.handleChange,
      validate: config.validate,
    });
  }

  public get(type: string): ResolvedFieldType {
    const resolved = this.types.get(type);
    if (!resolved) {
      // Fallback for unknown types (closed-world safety)
      throw new Error(
        `Field type "${type}" is not registered. All field types must be registered with explicit capabilities.`
      );
    }
    return resolved;
  }

  public getCapabilities(type: string): FieldCapabilities {
    return this.get(type).capabilities;
  }

  public has(type: string): boolean {
    return this.types.has(type);
  }
}

// ── SINGLETONS ───────────────────────────────────────────────────────────────

export const categoryRegistry = new CategoryRegistry();
export const fieldTypeRegistry = new FieldTypeRegistry(categoryRegistry);

// ── BOOTSTRAP: Standard Categories ──────────────────────────────────────────

categoryRegistry.register("input", {
  name: "Input",
  defaultCapabilities: {
    hasValue: true,
    hasValidity: true,
    hasVisibility: true,
    hasView: true,
    hasVitality: true,
    derivesValidityFromChildren: false,
  },
  allowedInRepeater: true,
  allowedAsRoot: true,
});

categoryRegistry.register("static", {
  name: "Static",
  defaultCapabilities: {
    hasValue: false,
    hasValidity: false,
    hasVisibility: true,
    hasView: true,
    hasVitality: false,
    derivesValidityFromChildren: false,
  },
});

categoryRegistry.register("structure", {
  name: "Structure",
  defaultCapabilities: {
    hasValue: false,
    hasValidity: false,
    hasVisibility: true,
    hasView: true,
    hasVitality: false,
    derivesValidityFromChildren: false,
  },
  allowedAsRoot: true,
});

categoryRegistry.register("repeater", {
  name: "Repeater",
  defaultCapabilities: {
    hasValue: true,
    hasValidity: false,
    hasVisibility: true,
    hasView: true,
    hasVitality: true,
    derivesValidityFromChildren: true,
  },
});

// ── BOOTSTRAP: Standard Field Types ──────────────────────────────────────────

const INPUT_TYPES = [
  // Primitives (Decoupled Domain Types)
  "string",
  "boolean",
  "number",
  "array",
  "object",
  // Legacy UI-bound types
  "text",
  "textarea",
  "email",
  "number_input",
  "NumberField",
  "password",
  "phone",
  "url",
  "date",
  "datetime",
  "time",
  "checkbox",
  "radio",
  "select",
  "multiselect",
  "switch",
  "autocomplete",
  "async-select",
  "file",
  "signature",
  "rating",
  "range",
  "rich-text",
  "formatted-number",
  "search_input",
  "table_filter",
  "branch-address-group",
  "code",
  "code_input",
  "CodeInput",
  "pin",
  "otp",
];

INPUT_TYPES.forEach((t) =>
  fieldTypeRegistry.register(t, { category: "input" })
);

const STATIC_TYPES = [
  "button",
  "header",
  "paragraph",
  "image",
  "message",
  "html",
  "qr-code",
  "tooltip",
  "divider",
  "progress-line",
  "progress-circle",
  "social",
  "divider-label",
];

STATIC_TYPES.forEach((t) =>
  fieldTypeRegistry.register(t, { category: "static" })
);

const STRUCTURE_TYPES = [
  "container",
  "card",
  "section",
  "spacer",
  "tab",
  "slot",
  "accordion",
  "fieldset",
  "group",
  "address-group",
  "table-filter-section",
];

STRUCTURE_TYPES.forEach((t) =>
  fieldTypeRegistry.register(t, { category: "structure" })
);

fieldTypeRegistry.register("repeater", { category: "repeater" });
