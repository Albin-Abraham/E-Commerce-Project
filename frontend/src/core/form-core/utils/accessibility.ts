import type { FormField } from "../domain";

/** Aria roles for each field category. */
export const FIELD_ROLES: Record<string, string> = {
  text: "textbox",
  textarea: "textbox",
  email: "textbox",
  number: "spinbutton",
  password: "textbox",
  phone: "textbox",
  url: "textbox",
  search_input: "searchbox",
  select: "combobox",
  multiselect: "listbox",
  checkbox: "checkbox",
  radio: "radio",
  switch: "switch",
  slider: "slider",
  rating: "slider",
  date: "textbox",
  time: "textbox",
  autocomplete: "combobox",
};

/**
 * Builds ARIA attributes for a field based on type, validation, and metadata.
 */
export function buildAriaAttributes(
  field: FormField,
  error?: string | boolean,
  errorMessage?: string
): Record<string, string | boolean | undefined> {
  const role = FIELD_ROLES[field.type];
  const aria: Record<string, string | boolean | undefined> = {};

  if (role) {
    aria.role = role;
  }

  if (field.label) {
    aria["aria-label"] =
      typeof field.label === "string" ? field.label : undefined;
  }

  if (field.required) {
    aria["aria-required"] = true;
  }

  if (field.enabled === false) {
    aria["aria-disabled"] = true;
  }

  if (field.description) {
    aria["aria-describedby"] = `${field.id}-description`;
  }

  if (error || errorMessage) {
    aria["aria-invalid"] = true;
    aria["aria-errormessage"] = `${field.id}-error`;
  } else {
    aria["aria-invalid"] = false;
  }

  if (field.type === "accordion") {
    aria["aria-expanded"] = field.properties?.expanded ?? false;
  }

  return aria;
}

/**
 * Audit a field for common accessibility issues.
 * Only runs in development mode.
 */
export function auditField(field: FormField) {
  if (process.env.NODE_ENV !== "development") return;

  const warnings: string[] = [];

  if (!field.label && FIELD_ROLES[field.type]) {
    warnings.push(
      `Missing accessible label for "${field.id}" (type: ${field.type})`
    );
  }

  if (field.type === "image" && !field.properties?.alt) {
    warnings.push(`Image field "${field.id}" is missing alt text`);
  }

  if (warnings.length > 0) {
    console.warn(`[Accessibility] ${warnings.join("; ")}`);
  }
}

/**
 * Enhances field props with runtime ARIA attributes.
 */
export function enhanceFieldProps(
  field: FormField,
  baseProps: Record<string, any>,
  config?: {
    error?: string | boolean;
    errorMessage?: string;
  }
): Record<string, any> {
  auditField(field);

  const schemaAria: Record<string, any> = {};
  const a11y = field.meta?.accessibility as any;
  if (a11y) {
    if (a11y.ariaLabel) schemaAria["aria-label"] = a11y.ariaLabel;
    if (a11y.description) schemaAria["aria-description"] = a11y.description;
    if (a11y.role) schemaAria.role = a11y.role;
    if (a11y.liveRegion) schemaAria["aria-live"] = a11y.liveRegion;
    if (a11y.atomic) schemaAria["aria-atomic"] = a11y.atomic;
  }

  const runtimeAria = buildAriaAttributes(
    field,
    config?.error ?? baseProps.error,
    config?.errorMessage ?? baseProps.errorMessage
  );

  return {
    ...baseProps,
    ...schemaAria,
    ...runtimeAria,
    ...(field.description
      ? { "aria-describedby": `${field.id}-description` }
      : {}),
  };
}
