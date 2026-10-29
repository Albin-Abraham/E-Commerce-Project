import type { FormField } from "@ui/form/fields";
import type { FormDefinition } from "@ui/form/types";
import type { TranslatedText } from "@ui/form/types/i18n-accessibility";

/**
 * Resolves the **effective UI type** of a field for style and pipeline decisions.
 *
 * In the decoupled architecture, `field.type` carries the **logical domain type**
 * (e.g. `"string"`, `"number"`) while `field.meta?.ui?.component` optionally
 * carries the **UI presentation override** (e.g. `"select"`, `"autocomplete"`).
 *
 * Any code that needs to branch on *how a field renders* (style classes,
 * event pipelines, isNativeDelegation guards) must call this instead of reading
 * `field.type` directly.
 *
 * @example
 * resolveEffectiveFieldType({ type: "string", meta: { ui: { component: "select" } } })
 * // → "select"
 *
 * resolveEffectiveFieldType({ type: "text" })
 * // → "text"  (no override, falls through to type)
 */
export { resolveEffectiveFieldType } from "@form-core/utils/field-layout-utils";

interface RenderField {
  id: string;
  name: string;
  type: string;
  label: string | TranslatedText; // Updated to match FieldLayout
  value: any;
  error?: string;
  placeholder?: string | TranslatedText;
  helpText?: string | TranslatedText;
  readOnly?: boolean;
  disabled?: boolean;
  options?: any[];
  onChange: (val: any) => void;
}

export function getFormFields<T>(
  definition: FormDefinition | null,
  data: T,
  errors: Record<string, string>,
  setValue: (name: keyof T, value: any) => void
): RenderField[] {
  if (!definition) return [];

  const fields: RenderField[] = [];

  definition.sections?.forEach((section) => {
    section.fields?.forEach((field) => {
      const layout = getFieldLayout(field);
      fields.push({
        id: field.id || "",
        name: field.name || "",
        type: field.type || "",
        label: layout.label || "",
        options: field.meta?.options?.options || [],
        value: field.name ? (data as any)[field.name] : undefined,
        error: field.name ? errors[field.name] : undefined,
        placeholder: layout.placeholder,
        helpText: layout.helpText,
        readOnly: layout.readOnly,
        disabled: layout.disabled,
        onChange: (val: any) =>
          field.name && setValue(field.name as keyof T, val),
      });
    });
  });

  return fields;
}

export interface FieldLayout {
  id?: string;
  name?: string;
  type?: string;
  label?: string | TranslatedText;
  placeholder?: string | TranslatedText;
  tooltip?: string | string[] | TranslatedText;
  readOnly?: boolean;
  disabled?: boolean;
  helpText?: string | TranslatedText;
  className?: string;
  prefix?: string;
  suffix?: string;
  rows?: number;
  cols?: number;
  min?: number;
  max?: number;
  step?: number;
  columnSpan?: number;
  fullWidth?: boolean;
  span?: "full" | "half" | "third" | "quarter";
  width?: "full" | "half" | "third" | "quarter";
  labelPlacement?: "top" | "side" | "hidden";
}

/**
 * Extract layout-related metadata from a field
 * Note: FieldUI is strictly for visual metadata (icon, variant, color).
 * Functional props (readOnly, disabled) should be handled via field.enabled / field.readOnly logic if added.
 */
export function getFieldLayout<T>(
  field: import("@ui/form/fields").RawFormField<T>
): FieldLayout {
  const enabled = field.enabled === undefined ? true : field.enabled === true;
  const disabled = !enabled;

  // Extract layout from field.layout (preferred) or direct props
  const layout = (field.layout as any) || {};

  // ── className resolution (canonical → deprecated → layout fallback) ────
  const canonical = field.meta?.ui?.classNames?.base;
  const legacyMeta = field.properties?.classNames?.base;
  const legacyFlat = field.properties?.customClasses || layout.className;
  const className = canonical || legacyMeta || flattenClassName(legacyFlat);

  return {
    id: field.id || "",
    name: field.name || "",
    type: field.type || "",
    label: (field.label as any) || "",
    placeholder:
      (field as any).placeholder ||
      field.properties?.placeholder ||
      layout.placeholder,
    tooltip: (field.properties?.tooltip || layout.tooltip) as any,
    readOnly: !!layout.readOnly,
    disabled: disabled || !!layout.disabled,
    helpText: (field.description as any) || layout.helpText || "",
    min: (field.properties as any)?.min ?? layout.min,
    max: (field.properties as any)?.max ?? layout.max,
    step: (field.properties as any)?.step ?? layout.step,
    columnSpan: layout.columnSpan || (field as any).columnSpan,
    labelPlacement: field.properties?.labelPlacement || layout.labelPlacement,
    className,
  };
}

/**
 * Normalize a className value that may be a string or string[].
 * Returns a single space-separated string, or undefined if empty.
 */
function flattenClassName(
  value: string | string[] | undefined
): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value.join(" ") : value;
}

// ============================================================================
// HIERARCHICAL LAYOUT UTILS
// ============================================================================

/**
 * Converts a flat list of sections into a hierarchical tree of FormFields.
 * Sections are treated as fields of type 'section' or 'card' (Structure category).
 */
export function getFormLayoutTree(
  definition: FormDefinition | null
): FormField[] {
  if (!definition) return [];

  const mapSectionToField = (
    section: import("@ui/form/fields").RawFormSection
  ): FormField => {
    const type = section.layout?.type === "card" ? "card" : "section";
    const fields: FormField[] = [];

    // 1. Add fields in this section
    if (section.fields) {
      fields.push(...(section.fields as any));
    }

    // 2. Add sub-sections recursively
    if (section.subSections) {
      section.subSections.forEach((sub) => {
        fields.push(mapSectionToField(sub));
      });
    }

    // Map Section to FormField Structure
    return {
      id: section.id || Math.random().toString(36).substr(2, 9),
      name: section.id, // ID as name for structure
      type: type as any, // Valid FieldType
      label: section.title || "",
      fields: fields, // Children
      layout: {
        // Spread the entire original layout config so CardField/Grid can see it
        ...(section.layout || {}),
        gridClass: section.layout?.className, // keep legacy field for safety
      } as any,
      // IMPORTANT: Map section variant to meta.ui.variant for CardField
      meta: {
        ui: {
          variant: (section.layout as any)?.variant, // Map 'outlined' | 'elevated' | 'flat'
        },
      },
      // IMPORTANT: Attach the original section layout config AND description to customData
      customData: {
        originalLayout: section.layout,
        originalSection: section, // Keep ref for buildSectionClasses
        description: section.description, // Store description here
      },
    };
  };

  return (definition.sections || []).map(mapSectionToField);
}

// ============================================================================
// CANONICAL FIELD ATTRIBUTE EXTRACTORS
// ============================================================================

/**
 * Canonically extracts field options across schema definitions, nested metadata, and direct props.
 *
 * Evaluation order:
 * 1. Direct `props.options`
 * 2. `field.options`
 * 3. `field.properties.options`
 * 4. `field.meta.options.options`
 * 5. Empty array `[]`
 */
export function getFieldOptions(
  field?: Partial<FormField> | Record<string, any>,
  props?: Record<string, any>
): any[] {
  if (props?.options && Array.isArray(props.options)) {
    return props.options;
  }
  if (field?.options && Array.isArray(field.options)) {
    return field.options;
  }
  if (field?.properties?.options && Array.isArray(field.properties.options)) {
    return field.properties.options;
  }
  if (
    field?.meta?.options?.options &&
    Array.isArray(field.meta.options.options)
  ) {
    return field.meta.options.options;
  }
  return [];
}

/**
 * Canonically extracts field placeholder across direct props, layout, and schema properties.
 */
export function getFieldPlaceholder(
  field?: Partial<FormField> | Record<string, any>,
  props?: Record<string, any>,
  layout?: FieldLayout
): string | undefined {
  if (props?.placeholder !== undefined) {
    return typeof props.placeholder === "string"
      ? props.placeholder
      : String(props.placeholder);
  }
  if (layout?.placeholder !== undefined) {
    return typeof layout.placeholder === "string"
      ? layout.placeholder
      : String(layout.placeholder);
  }
  if ((field as any)?.placeholder !== undefined) {
    return String((field as any).placeholder);
  }
  if (field?.properties?.placeholder !== undefined) {
    return String(field.properties.placeholder);
  }
  return undefined;
}

/**
 * Canonically extracts field icons (start, end, right) across direct props, properties, and meta.
 */
export function getFieldIcon(
  field?: Partial<FormField> | Record<string, any>,
  props?: Record<string, any>,
  _layout?: FieldLayout
): {
  startIcon?: string | React.ReactNode;
  endIcon?: string | React.ReactNode;
  rightIcon?: string | React.ReactNode;
} {
  const startIcon =
    props?.startIcon ??
    props?.leftIcon ??
    field?.properties?.startIcon ??
    field?.properties?.leftIcon ??
    field?.meta?.ui?.startIcon ??
    field?.meta?.ui?.icon;

  const endIcon =
    props?.endIcon ??
    props?.rightIcon ??
    field?.properties?.endIcon ??
    field?.properties?.rightIcon ??
    field?.meta?.ui?.endIcon;

  return {
    startIcon,
    endIcon,
    rightIcon: endIcon,
  };
}

