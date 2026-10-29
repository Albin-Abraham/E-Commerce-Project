import { z } from "zod";

/**
 * Zod schema for runtime FormDefinition validation.
 * Ensures ingested schemas from backend/APIs/CMS meet contract requirements
 * before passing into Canonical IR compilation or React rendering.
 */

const TranslatedTextSchema = z.union([
  z.string(),
  z.record(z.string(), z.string()),
]);

const FieldTypeSchema = z.string().min(1, "Field type must not be empty");

export const FormFieldSchema: z.ZodType<any> = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  type: FieldTypeSchema,
  label: TranslatedTextSchema.optional(),
  placeholder: TranslatedTextSchema.optional(),
  required: z.boolean().optional(),
  disabled: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  hidden: z.boolean().optional(),
  defaultValue: z.any().optional(),
  value: z.any().optional(),
  validation: z.record(z.string(), z.any()).optional(),
  rules: z.array(z.any()).optional(),
  options: z.array(z.any()).optional(),
  children: z.lazy(() => z.array(FormFieldSchema)).optional(),
  layout: z.record(z.string(), z.any()).optional(),
  properties: z.record(z.string(), z.any()).optional(),
  componentProps: z.record(z.string(), z.any()).optional(),
}).passthrough();

export const FormSectionSchema = z.object({
  id: z.string().min(1, "Section ID is required"),
  title: TranslatedTextSchema.optional(),
  description: TranslatedTextSchema.optional(),
  fields: z.array(FormFieldSchema).optional(),
  layout: z.record(z.string(), z.any()).optional(),
}).passthrough();

export const FormStyleSchema = z.object({
  themeBrand: z.enum(["zenith", "emerald", "obsidian", "corporate"]).optional(),
  density: z.enum(["compact" , "comfortable" , "spacious"]).optional(),
  surfaceVariant: z.enum(["default", "surface", "card", "glass", "subtle", "elevated"]).optional(),
  radius: z.enum(["sharp", "rounded", "pill"]).optional(),
  primaryColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.string().optional(),
  fontFamily: z.string().optional(),
  customClasses: z.string().optional(),
  classNames: z.record(z.string(), z.string().optional()).optional(),
}).passthrough();

export const FormSettingsSchema = z.object({
  width: z.enum(["full", "contained", "centered"]).optional(),
  density: z.enum(["compact", "comfortable", "spacious"]).optional(),
  maxHeight: z.string().optional(),
  stickyHeader: z.boolean().optional(),
  stickyFooter: z.boolean().optional(),
  hideHeader: z.boolean().optional(),
  hideFooter: z.boolean().optional(),
  mode: z.enum(["edit", "view"]).optional(),
}).passthrough();

export const FormDefinitionSchema = z.object({
  id: z.string().min(1, "Form definition requires a non-empty `id`"),
  title: TranslatedTextSchema.optional(),
  description: TranslatedTextSchema.optional(),
  version: z.string().optional(),
  fields: z.array(FormFieldSchema).optional(),
  sections: z.array(FormSectionSchema).optional(),
  settings: FormSettingsSchema.optional(),
  style: FormStyleSchema.optional(),
  content: z.record(z.string(), z.any()).optional(),
  surface: z.record(z.string(), z.any()).optional(),
  behavior: z.record(z.string(), z.any()).optional(),
  presentation: z.record(z.string(), z.any()).optional(),
}).passthrough();

export interface ValidationDiagnostic {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a FormDefinition object at runtime, checking both structural schema
 * compliance and logical integrity (duplicate IDs, missing field keys, hex color leaks).
 */
export function validateFormDefinition(def: unknown): ValidationDiagnostic {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!def || typeof def !== "object") {
    return {
      valid: false,
      errors: ["Form definition must be a valid non-null object."],
      warnings: [],
    };
  }

  const result = FormDefinitionSchema.safeParse(def);

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const pathStr = issue.path.length > 0 ? issue.path.join(".") : "root";
      errors.push(`[${pathStr}] ${issue.message}`);
    });
  }

  const typedDef = def as Record<string, any>;

  // Logical checks: verify either sections, fields, or content layer is supplied
  const hasFields = Array.isArray(typedDef.fields) && typedDef.fields.length > 0;
  const hasSections = Array.isArray(typedDef.sections) && typedDef.sections.length > 0;
  const hasContent = Boolean(typedDef.content);

  if (!hasFields && !hasSections && !hasContent) {
    warnings.push("Form definition has no fields, sections, or content layer declared.");
  }

  // Duplicate field key tracking
  const seenFieldKeys = new Set<string>();

  const checkFields = (fieldsList: any[], context = "fields") => {
    fieldsList.forEach((field, idx) => {
      if (!field || typeof field !== "object") return;
      const key = field.id || field.name;
      if (!key) {
        errors.push(`[${context}[${idx}]] Field missing both 'id' and 'name'.`);
      } else {
        if (seenFieldKeys.has(key)) {
          errors.push(`Duplicate field identifier detected: '${key}'.`);
        } else {
          seenFieldKeys.add(key);
        }
      }
      if (Array.isArray(field.children)) {
        checkFields(field.children, `${context}[${idx}].children`);
      }
    });
  };

  if (Array.isArray(typedDef.fields)) {
    checkFields(typedDef.fields, "fields");
  }

  if (Array.isArray(typedDef.sections)) {
    typedDef.sections.forEach((sec: any, secIdx: number) => {
      if (Array.isArray(sec?.fields)) {
        checkFields(sec.fields, `sections[${secIdx}].fields`);
      }
    });
  }

  // Check for deprecated raw hex values in style
  if (typedDef.style?.primaryColor && typedDef.style.primaryColor.startsWith("#")) {
    warnings.push(
      `Deprecated raw hex color '${typedDef.style.primaryColor}' found in style.primaryColor. Use semantic tokens or 'themeBrand' instead.`
    );
  }
  if (typedDef.style?.backgroundColor && typedDef.style.backgroundColor.startsWith("#")) {
    warnings.push(
      `Deprecated raw hex color '${typedDef.style.backgroundColor}' found in style.backgroundColor. Use semantic tokens or 'surfaceVariant' instead.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Asserts that a form definition is valid, throwing an Error with diagnostic details if not.
 */
export function assertValidFormDefinition(def: unknown): void {
  const diagnostic = validateFormDefinition(def);
  if (!diagnostic.valid) {
    throw new Error(
      `[FormConfigValidationError] Invalid FormDefinition:\n- ${diagnostic.errors.join("\n- ")}`
    );
  }
}
