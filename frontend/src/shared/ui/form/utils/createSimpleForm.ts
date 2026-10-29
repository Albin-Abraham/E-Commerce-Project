import type { FieldType, FormField } from "../fields";
import type { FormDefinition } from "../types";

export interface SimpleFormField<
  T extends Record<string, any> = Record<string, any>,
> {
  /** Field identifier and form data key */
  name: keyof T | string;
  /** Logical field type or UI alias (e.g. "text", "number", "select", "switch", "textarea") */
  type?: FieldType | string;
  /** UI presentation component override (e.g. "select", "radio") */
  component?: string;
  /** Display label */
  label?: string;
  /** Input placeholder text */
  placeholder?: string;
  /** Optional helper or description text */
  helpText?: string;
  /** Whether the field is mandatory */
  required?: boolean;
  /** Dropdown / Radio options */
  options?: Array<{ label: string; value: any }>;
  /** Default value for the field */
  defaultValue?: any;
  /** Column span in a 12-column grid (Default: 12) */
  columnSpan?: number;
  /** Field-level validation rule (e.g. regex, custom validator) */
  validation?: any;
  /** Additional component-specific props */
  properties?: Record<string, any>;
  /** UI metadata (e.g. icons, custom classes) */
  meta?: Record<string, any>;
}

export interface SimpleFormOptions<
  T extends Record<string, any> = Record<string, any>,
> {
  /** Unique form identifier */
  id: string;
  /** Form title */
  title?: string;
  /** Form description or subtitle */
  description?: string;
  /** Submit button label (Default: "Submit") */
  submitLabel?: string;
  /** Cancel button label (Default: "Cancel") */
  cancelLabel?: string;
  /** Layout density (Default: "comfortable") */
  density?: "compact" | "comfortable" | "spacious";
  /** Shell container type (Default: "card") */
  shell?: "card" | "modal" | "plain";
  /** Default component variant (Default: "outlined") */
  variant?: "outlined" | "filled" | "underlined";
  /** Semantic color intent (Default: "primary") */
  intent?: "primary" | "secondary" | "danger" | "subtle";
  /** Array of simple field definitions */
  fields: SimpleFormField<T>[];
  /** External validation schema (Zod or Yup) */
  validationSchema?: any;
  /** Validation trigger mode */
  validationMode?: "onChange" | "onBlur" | "onSubmit" | "manual" | "lazy";
  /** Form submission handler */
  onSubmit?: (data: T) => Promise<void | Record<string, string>> | void;
}

/**
 * createSimpleForm
 *
 * Ergonomic shortcut helper for authoring simple 2–5 field forms (e.g. modals,
 * rename dialogs, quick entry panels) in a single definition without the overhead
 * of splitting into separate *-logical, *-surface, and *-schema files.
 *
 * @example
 * ```typescript
 * export const renameFileForm = createSimpleForm<{ fileName: string }>({
 *   id: "rename-file-form",
 *   title: "Rename File",
 *   submitLabel: "Rename",
 *   fields: [
 *     { name: "fileName", label: "New File Name", required: true }
 *   ],
 * });
 * ```
 */
export function createSimpleForm<
  T extends Record<string, any> = Record<string, any>,
>(options: SimpleFormOptions<T>): FormDefinition<T> {
  const {
    id,
    title = "",
    description,
    submitLabel = "Submit",
    cancelLabel = "Cancel",
    density = "comfortable",
    shell = "card",
    variant = "outlined",
    intent = "primary",
    fields,
    validationSchema,
    validationMode = "onBlur",
    onSubmit,
  } = options;

  const normalizedFields: FormField<any, any, T>[] = fields.map((f) => {
    const fieldId = String(f.name);
    const effectiveType = (f.type || "text") as FieldType;

    const meta = {
      ...(f.meta || {}),
      ui: {
        ...(f.meta?.ui || {}),
        ...(f.component ? { component: f.component } : {}),
      },
    };

    return {
      id: fieldId,
      name: fieldId,
      type: effectiveType,
      label: f.label || fieldId,
      placeholder: f.placeholder,
      helpText: f.helpText,
      required: f.required,
      options: f.options,
      defaultValue: f.defaultValue,
      validation: f.validation,
      layout: { columnSpan: f.columnSpan ?? 12 },
      properties: {
        intent,
        ...(f.properties || {}),
      },
      meta: Object.keys(meta.ui).length > 0 ? meta : f.meta,
    } as unknown as FormField<any, any, T>;
  });

  const formDef: FormDefinition<T> = {
    id,
    title,
    description,
    submitLabel,
    cancelLabel,
    settings: {
      density,
    },
    surface: {
      ui: {
        target: "screen",
        density,
        shell: shell as any,
      },
    },
    presentation: {
      style: {
        variant,
        intent,
      } as any,
    },
    sections: [
      {
        id: `${id}_section`,
        title: "",
        layout: {
          type: shell === "card" ? "card" : "flex",
        } as any,
        fields: normalizedFields as any,
      },
    ],
    validation: validationSchema
      ? {
          mode: validationMode,
          schema: validationSchema,
        } as any
      : undefined,
    events: onSubmit ? { onSubmit: onSubmit as any } : undefined,
  };

  return formDef;
}
