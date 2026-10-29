/**
 * IR Validator
 *
 * Validates CanonicalFormIR for correctness, consistency, and security.
 * Runs after compilation and before FormCore consumption.
 */

import type {
  CanonicalFormIR,
  IRField,
  IRSection,
  IRFieldOption,
  IRRemoteOptions,
  IRValidationResult,
  IRValidationError,
  IRValidationWarning,
} from "../types/ir";
import type { TranslatedText } from "../types/i18n-accessibility";

/**
 * Main validation entry point
 */
export function validateIR<T extends Record<string, any>>(
  ir: CanonicalFormIR<T>
): IRValidationResult {
  const errors: IRValidationError[] = [];
  const warnings: IRValidationWarning[] = [];

  // 1. Structural validation
  validateStructure(ir, errors, warnings);

  // 2. Field validation
  validateFields(ir, errors, warnings);

  // 3. Reference integrity
  validateReferences(ir, errors, warnings);

  // 4. Security validation
  validateSecurity(ir, errors, warnings);

  // 5. Performance validation
  validatePerformance(ir, errors, warnings);

  // 6. Accessibility validation
  validateAccessibility(ir, errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate overall IR structure
 */
function validateStructure<T>(
  ir: CanonicalFormIR<T>,
  errors: IRValidationError[],
  warnings: IRValidationWarning[]
) {
  // Required fields
  if (!ir.id) {
    errors.push({ code: "MISSING_ID", message: "Form IR must have an id", path: "id", severity: "error" });
  }
  if (!ir.title) {
    errors.push({ code: "MISSING_TITLE", message: "Form IR must have a title", path: "title", severity: "error" });
  }
  if (!ir.submitLabel) {
    warnings.push({ code: "MISSING_SUBMIT_LABEL", message: "Form should have a submit label", path: "submitLabel" });
  }

  // Version format
  if (ir.version && !/^\d+\.\d+\.\d+/.test(ir.version)) {
    warnings.push({ code: "INVALID_VERSION", message: "Version should follow semver (x.y.z)", path: "version" });
  }

  // At least one content field
  const totalFields = countAllFields(ir.content.sections) + ir.content.fields.length;
  if (totalFields === 0) {
    warnings.push({ code: "EMPTY_FORM", message: "Form has no fields", path: "content" });
  }

  // Wizard validation
  if (ir.settings.wizard.enabled) {
    if (!ir.settings.wizard.initialStepId) {
      errors.push({ code: "WIZARD_MISSING_INITIAL_STEP", message: "Wizard forms must have initialStepId", path: "settings.wizard.initialStepId", severity: "error" });
    }
    // Check initial step exists
    const stepIds = getAllSectionIds(ir.content.sections);
    if (ir.settings.wizard.initialStepId && !stepIds.includes(ir.settings.wizard.initialStepId)) {
      errors.push({ code: "WIZARD_INVALID_INITIAL_STEP", message: `Initial step '${ir.settings.wizard.initialStepId}' not found`, path: "settings.wizard.initialStepId", severity: "error" });
    }
  }
}

/**
 * Validate all fields recursively
 */
function validateFields<T>(
  ir: CanonicalFormIR<T>,
  errors: IRValidationError[],
  warnings: IRValidationWarning[]
) {
  const allFields = collectAllFields(ir.content.sections).concat(ir.content.fields);
  const fieldIds = new Set<string>();
  const fieldNames = new Map<string, string>(); // name -> id

  for (const field of allFields) {
    validateField(field, "", fieldIds, fieldNames, errors, warnings);
  }

  // Check for duplicate names (used for data binding)
  for (const [name, id] of fieldNames.entries()) {
    if (name && name !== id) {
      // Names should be unique for data binding
      const duplicates = allFields.filter(f => f.name === name);
      if (duplicates.length > 1) {
        warnings.push({
          code: "DUPLICATE_FIELD_NAME",
          message: `Field name '${name}' used by ${duplicates.length} fields - may cause data binding conflicts`,
          path: `fields[name=${name}]`,
        });
      }
    }
  }
}

/**
 * Validate a single field
 */
function validateField<T>(
  field: IRField<any, T>,
  path: string,
  fieldIds: Set<string>,
  fieldNames: Map<string, string>,
  errors: IRValidationError[],
  warnings: IRValidationWarning[]
) {
  const fieldPath = path ? `${path}.fields[${field.id}]` : `content.fields[${field.id}]`;

  // Unique ID
  if (fieldIds.has(field.id)) {
    errors.push({ code: "DUPLICATE_FIELD_ID", message: `Duplicate field id: ${field.id}`, path: fieldPath, severity: "error" });
  }
  fieldIds.add(field.id);

  // Track name for duplicate detection
  if (field.name) {
    fieldNames.set(field.name, field.id);
  }

  // Required field properties
  if (!field.label) {
    warnings.push({ code: "MISSING_LABEL", message: "Field should have a label", path: `${fieldPath}.label` });
  }

  // Category-specific validation
  switch (field.category) {
    case "input":
      validateInputField(field, fieldPath, errors, warnings);
      break;
    case "select":
    case "multiselect":
    case "radio":
    case "autocomplete":
      validateSelectField(field, fieldPath, errors, warnings);
      break;
    case "structure":
      validateStructureField(field, fieldPath, errors, warnings);
      break;
  }

  // Validate options for select-like fields
  if (["select", "multiselect", "radio", "autocomplete"].includes(field.component)) {
    if (field.options.length === 0 && !field.remoteOptions) {
      warnings.push({ code: "EMPTY_OPTIONS", message: `${field.component} field has no options and no remoteOptions`, path: `${fieldPath}.options` });
    }
    // Check for duplicate option values
    const optionValues = new Set<string>();
    for (const opt of field.options) {
      if (optionValues.has(String(opt.value))) {
        warnings.push({ code: "DUPLICATE_OPTION_VALUE", message: `Duplicate option value: ${opt.value}`, path: `${fieldPath}.options` });
      }
      optionValues.add(String(opt.value));
    }
  }

  // Validate remote options
  if (field.remoteOptions) {
    validateRemoteOptions(field.remoteOptions, `${fieldPath}.remoteOptions`, errors, warnings);
  }

  // Validate layout
  if (field.layout.columnSpan < 1 || field.layout.columnSpan > 12) {
    errors.push({ code: "INVALID_COLUMN_SPAN", message: `columnSpan must be 1-12, got ${field.layout.columnSpan}`, path: `${fieldPath}.layout.columnSpan`, severity: "error" });
  }

  // Validate visibility condition
  if (typeof field.visible === "string" && field.visible.length > 0) {
    validateExpression(field.visible, `${fieldPath}.visible`, errors, warnings);
  }
  if (typeof field.enabled === "string" && field.enabled.length > 0) {
    validateExpression(field.enabled, `${fieldPath}.enabled`, errors, warnings);
  }

  // Validate nested fields
  for (let i = 0; i < field.fields.length; i++) {
    validateField(field.fields[i], fieldPath, fieldIds, fieldNames, errors, warnings);
  }
}

/**
 * Validate input field (text, number, date, etc.)
 */
function validateInputField<T>(
  field: IRField<any, T>,
  path: string,
  errors: IRValidationError[],
  warnings: IRValidationWarning[]
) {
  // Type-specific validation
  if (field.component === "email" && field.validation.pattern) {
    warnings.push({ code: "EMAIL_WITH_PATTERN", message: "Email field has custom pattern - consider using built-in email validation", path: `${path}.validation` });
  }

  if (["number", "range", "rating"].includes(field.component)) {
    if (field.properties.min !== undefined && field.properties.max !== undefined) {
      if (Number(field.properties.min) > Number(field.properties.max)) {
        errors.push({ code: "INVALID_MIN_MAX", message: "min cannot be greater than max", path: `${path}.properties`, severity: "error" });
      }
    }
  }

  if (field.component === "file") {
    if (!field.properties.accept) {
      warnings.push({ code: "FILE_MISSING_ACCEPT", message: "File field should specify accept types", path: `${path}.properties.accept` });
    }
    if (!field.properties.maxSize) {
      warnings.push({ code: "FILE_MISSING_MAX_SIZE", message: "File field should specify maxSize", path: `${path}.properties.maxSize` });
    }
  }
}

/**
 * Validate select-like fields
 */
function validateSelectField<T>(
  field: IRField<any, T>,
  path: string,
  errors: IRValidationError[],
  warnings: IRValidationWarning[]
) {
  if (field.component === "multiselect" && field.properties.maxSelected !== undefined) {
    if (field.properties.maxSelected < 1) {
      errors.push({ code: "INVALID_MAX_SELECTED", message: "maxSelected must be >= 1", path: `${path}.properties.maxSelected`, severity: "error" });
    }
  }

  // Check display config consistency
  if (field.properties.displayConfig) {
    const dc = field.properties.displayConfig;
    if (!dc.titleKey) {
      errors.push({ code: "DISPLAY_CONFIG_MISSING_TITLE", message: "displayConfig must have titleKey", path: `${path}.properties.displayConfig.titleKey`, severity: "error" });
    }
  }
}

/**
 * Validate structure fields (containers, repeaters, etc.)
 */
function validateStructureField<T>(
  field: IRField<any, T>,
  path: string,
  errors: IRValidationError[],
  warnings: IRValidationWarning[]
) {
  if (field.component === "repeater") {
    if (!field.repeaterConfig) {
      errors.push({ code: "REPEATER_MISSING_CONFIG", message: "Repeater field must have repeaterConfig", path: `${path}.repeaterConfig`, severity: "error" });
    } else {
      if (field.repeaterConfig.minItems > field.repeaterConfig.maxItems) {
        errors.push({ code: "REPEATER_INVALID_MIN_MAX", message: "minItems cannot exceed maxItems", path: `${path}.repeaterConfig`, severity: "error" });
      }
    }
    if (field.fields.length === 0) {
      warnings.push({ code: "REPEATER_EMPTY", message: "Repeater has no child fields", path: `${path}.fields` });
    }
  }

  if (["card", "accordion", "tabs", "fieldset", "group", "container"].includes(field.component)) {
    if (field.fields.length === 0) {
      warnings.push({ code: "CONTAINER_EMPTY", message: `${field.component} has no child fields`, path: `${path}.fields` });
    }
  }

  if (field.component === "tabs") {
    // Each tab should be a container/section
    const nonContainerFields = field.fields.filter(f => f.category !== "structure");
    if (nonContainerFields.length > 0) {
      warnings.push({ code: "TABS_NON_CONTAINER_CHILDREN", message: "Tabs should contain container/structure fields as children", path: `${path}.fields` });
    }
  }
}

/**
 * Validate remote options
 */
function validateRemoteOptions(
  remote: IRRemoteOptions,
  path: string,
  errors: IRValidationError[],
  warnings: IRValidationWarning[]
) {
  if (!remote.url) {
    errors.push({ code: "REMOTE_MISSING_URL", message: "remoteOptions must have url", path: `${path}.url`, severity: "error" });
  } else {
    try {
      new URL(remote.url);
    } catch {
      warnings.push({ code: "REMOTE_INVALID_URL", message: "remoteOptions.url should be a valid URL", path: `${path}.url` });
    }
  }

  if (remote.debounceMs < 0 || remote.debounceMs > 5000) {
    warnings.push({ code: "REMOTE_INVALID_DEBOUNCE", message: "debounceMs should be 0-5000ms", path: `${path}.debounceMs` });
  }

  if (!remote.mapping.valuePath || !remote.mapping.labelPath) {
    warnings.push({ code: "REMOTE_MISSING_MAPPING", message: "remoteOptions.mapping should have valuePath and labelPath", path: `${path}.mapping` });
  }
}

/**
 * Validate references (field names, section IDs, etc.)
 */
function validateReferences<T>(
  ir: CanonicalFormIR<T>,
  errors: IRValidationError[],
  warnings: IRValidationWarning[]
) {
  const allFields = collectAllFields(ir.content.sections).concat(ir.content.fields);
  const fieldIdSet = new Set(allFields.map(f => f.id));
  const fieldNameMap = new Map(allFields.map(f => [f.name, f.id]).filter(([, v]) => v));
  const sectionIdSet = new Set(getAllSectionIds(ir.content.sections));

  // Validate nextStep references
  for (const section of ir.content.sections) {
    if (section.nextStep && typeof section.nextStep === "string") {
      if (!sectionIdSet.has(section.nextStep)) {
        warnings.push({ code: "NEXT_STEP_NOT_FOUND", message: `nextStep references unknown section: ${section.nextStep}`, path: `content.sections[${section.id}].nextStep` });
      }
    }
  }

  // Validate condition references (basic check)
  for (const field of allFields) {
    if (field.conditions) {
      validateConditionReferences(field.conditions, fieldIdSet, fieldNameMap, `${field.id}.conditions`, errors, warnings);
    }
  }

  // Validate injection references
  for (const [fieldPath, validation] of Object.entries(ir.injections.validations)) {
    if (!fieldIdSet.has(fieldPath) && !fieldNameMap.has(fieldPath)) {
      warnings.push({ code: "INJECTION_FIELD_NOT_FOUND", message: `Validation injection references unknown field: ${fieldPath}`, path: `injections.validations[${fieldPath}]` });
    }
  }
}

/**
 * Validate condition expression references
 */
function validateConditionReferences(
  conditions: any,
  fieldIds: Set<string>,
  fieldNames: Map<string, string>,
  path: string,
  errors: IRValidationError[],
  warnings: IRValidationWarning[]
) {
  if (!conditions) return;

  // Handle FieldConditionExpression structure
  if (conditions.when) {
    // Extract field references from when clause
    const whenStr = JSON.stringify(conditions.when);
    const refs = whenStr.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g) || [];
    for (const ref of refs) {
      if (!fieldIds.has(ref) && !fieldNames.has(ref) && !["true", "false", "null", "undefined", "and", "or", "not"].includes(ref.toLowerCase())) {
        // Could be a field reference
        warnings.push({ code: "CONDITION_UNKNOWN_FIELD", message: `Condition references possibly unknown field: ${ref}`, path: `${path}.when` });
      }
    }
  }

  if (conditions.then) {
    const thenStr = JSON.stringify(conditions.then);
    const refs = thenStr.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g) || [];
    for (const ref of refs) {
      if (!fieldIds.has(ref) && !fieldNames.has(ref) && !["true", "false", "null", "undefined", "show", "hide", "enable", "disable", "setValue"].includes(ref.toLowerCase())) {
        warnings.push({ code: "CONDITION_UNKNOWN_FIELD_THEN", message: `Condition 'then' references possibly unknown field: ${ref}`, path: `${path}.then` });
      }
    }
  }
}

/**
 * Validate expressions for security
 */
function validateExpression(
  expr: string,
  path: string,
  errors: IRValidationError[],
  warnings: IRValidationWarning[]
) {
  // Check for dangerous patterns
  const dangerousPatterns = [
    { pattern: /eval\s*\(/, code: "EVAL_IN_EXPRESSION", message: "eval() is not allowed in expressions" },
    { pattern: /Function\s*\(/, code: "FUNCTION_CONSTRUCTOR_IN_EXPRESSION", message: "Function constructor is not allowed in expressions" },
    { pattern: /require\s*\(/, code: "REQUIRE_IN_EXPRESSION", message: "require() is not allowed in expressions" },
    { pattern: /import\s*\(/, code: "DYNAMIC_IMPORT_IN_EXPRESSION", message: "Dynamic import is not allowed in expressions" },
    { pattern: /process\.env/, code: "PROCESS_ENV_IN_EXPRESSION", message: "process.env access is not allowed in expressions" },
    { pattern: /globalThis/, code: "GLOBAL_THIS_IN_EXPRESSION", message: "globalThis access is not allowed in expressions" },
    { pattern: /__proto__/, code: "PROTO_POLLUTION_IN_EXPRESSION", message: "__proto__ access is not allowed in expressions" },
    { pattern: /constructor\.prototype/, code: "PROTOTYPE_POLLUTION_IN_EXPRESSION", message: "Prototype manipulation is not allowed in expressions" },
  ];

  for (const { pattern, code, message } of dangerousPatterns) {
    if (pattern.test(expr)) {
      errors.push({ code, message, path, severity: "error" });
    }
  }

  // Check expression depth (nested ternaries, etc.)
  const depth = (expr.match(/\?/g) || []).length + (expr.match(/\|\|/g) || []).length + (expr.match(/&&/g) || []).length;
  if (depth > 10) {
    warnings.push({ code: "EXPRESSION_TOO_COMPLEX", message: `Expression has high complexity (depth: ${depth})`, path });
  }
}

/**
 * Validate security settings
 */
function validateSecurity<T>(
  ir: CanonicalFormIR<T>,
  errors: IRValidationError[],
  warnings: IRValidationWarning[]
) {
  // Check that security settings are consistent
  if (ir.security.tenantIsolation && !ir.security.requireActionRegistration) {
    warnings.push({ code: "TENANT_ISOLATION_WITHOUT_ACTION_REG", message: "tenantIsolation requires requireActionRegistration", path: "security" });
  }

  // Validate allowed functions are actually safe
  const unsafeFunctions = ["eval", "Function", "require", "import", "setTimeout", "setInterval", "fetch", "XMLHttpRequest"];
  for (const fn of ir.security.allowedExpressionFunctions) {
    if (unsafeFunctions.includes(fn.toLowerCase())) {
      errors.push({ code: "UNSAFE_ALLOWED_FUNCTION", message: `Allowed function '${fn}' is potentially unsafe`, path: `security.allowedExpressionFunctions`, severity: "error" });
    }
  }

  // Check for function callbacks in schema (security risk)
  checkForFunctionCallbacks(ir.content.sections, "", errors, warnings);
}

function checkForFunctionCallbacks<T>(
  sections: ReadonlyArray<IRSection<T>>,
  path: string,
  errors: IRValidationError[],
  warnings: IRValidationWarning[]
) {
  for (const section of sections) {
    // Check section visible/enabled
    if (typeof section.visible === "function" || typeof section.enabled === "function") {
      errors.push({ code: "FUNCTION_CALLBACK_IN_SCHEMA", message: "Function callbacks in schema are not allowed - use expressions instead", path: `${path}.sections[${section.id}].visible/enabled`, severity: "error" });
    }

    for (const field of section.fields) {
      checkFieldForFunctionCallbacks(field, `${path}.sections[${section.id}]`, errors, warnings);
    }

    checkForFunctionCallbacks(section.subSections, path, errors, warnings);
  }
}

function checkFieldForFunctionCallbacks<T>(
  field: IRField<any, T>,
  path: string,
  errors: IRValidationError[],
  warnings: IRValidationWarning[]
) {
  // Check field visible/enabled/conditions
  if (typeof field.visible === "function") {
    errors.push({ code: "FUNCTION_CALLBACK_IN_SCHEMA", message: "Function callbacks in schema are not allowed - use expressions instead", path: `${path}.fields[${field.id}].visible`, severity: "error" });
  }
  if (typeof field.enabled === "function") {
    errors.push({ code: "FUNCTION_CALLBACK_IN_SCHEMA", message: "Function callbacks in schema are not allowed - use expressions instead", path: `${path}.fields[${field.id}].enabled`, severity: "error" });
  }
  if (field.computed && typeof field.computed.expression === "function") {
    errors.push({ code: "FUNCTION_CALLBACK_IN_SCHEMA", message: "Function callbacks in schema are not allowed - use expressions instead", path: `${path}.fields[${field.id}].computed`, severity: "error" });
  }

  for (const child of field.fields) {
    checkFieldForFunctionCallbacks(child, `${path}.fields[${field.id}]`, errors, warnings);
  }
}

/**
 * Validate performance characteristics
 */
function validatePerformance<T>(
  ir: CanonicalFormIR<T>,
  errors: IRValidationError[],
  warnings: IRValidationWarning[]
) {
  const allFields = collectAllFields(ir.content.sections).concat(ir.content.fields);

  // Warn about large forms
  if (allFields.length > 500) {
    warnings.push({ code: "LARGE_FORM", message: `Form has ${allFields.length} fields - consider splitting into multiple forms`, path: "content" });
  }

  // Check for deeply nested structures
  const maxDepth = calculateMaxDepth(ir.content.sections);
  if (maxDepth > 5) {
    warnings.push({ code: "DEEP_NESTING", message: `Form has nesting depth of ${maxDepth} - may impact performance`, path: "content" });
  }

  // Check for many remote options
  const remoteCount = allFields.filter(f => f.remoteOptions).length;
  if (remoteCount > 20) {
    warnings.push({ code: "MANY_REMOTE_OPTIONS", message: `Form has ${remoteCount} fields with remote options - consider batching`, path: "content" });
  }

  // Check for many repeaters
  const repeaterCount = allFields.filter(f => f.component === "repeater").length;
  if (repeaterCount > 10) {
    warnings.push({ code: "MANY_REPEATERS", message: `Form has ${repeaterCount} repeaters - may impact performance`, path: "content" });
  }
}

/**
 * Validate accessibility
 */
function validateAccessibility<T>(
  ir: CanonicalFormIR<T>,
  errors: IRValidationError[],
  warnings: IRValidationWarning[]
) {
  const allFields = collectAllFields(ir.content.sections).concat(ir.content.fields);

  for (const field of allFields) {
    // Required fields should have labels
    if (field.required && !field.label) {
      errors.push({ code: "REQUIRED_FIELD_MISSING_LABEL", message: "Required field must have a label for accessibility", path: `${field.id}.label`, severity: "error" });
    }

    // Fields with validation should have help text or description
    if ((field.validation?.required || field.validation?.pattern || field.validation?.minLength) && !field.helpText && !field.description) {
      warnings.push({ code: "VALIDATION_MISSING_HELP", message: "Field with validation should have help text or description", path: `${field.id}.helpText` });
    }

    // Check for autocomplete on sensitive fields
    if (["password", "email", "phone", "credit-card", "ssn", "ccv"].some(s => field.name.toLowerCase().includes(s))) {
      if (!field.properties.autoComplete) {
        warnings.push({ code: "SENSITIVE_FIELD_MISSING_AUTOCOMPLETE", message: "Sensitive field should have autoComplete attribute", path: `${field.id}.properties.autoComplete` });
      }
    }
  }
}

/**
 * Count all fields recursively
 */
function countAllFields<T>(sections: ReadonlyArray<IRSection<T>>): number {
  let count = 0;
  for (const section of sections) {
    count += section.fields.length;
    for (const field of section.fields) {
      count += field.fields.length;
    }
    count += countAllFields(section.subSections);
  }
  return count;
}

/**
 * Collect all fields recursively
 */
function collectAllFields<T>(sections: ReadonlyArray<IRSection<T>>): IRField<any, T>[] {
  const fields: IRField<any, T>[] = [];
  for (const section of sections) {
    fields.push(...section.fields);
    for (const field of section.fields) {
      fields.push(...field.fields);
    }
    fields.push(...collectAllFields(section.subSections));
  }
  return fields;
}

/**
 * Get all section IDs recursively
 */
function getAllSectionIds<T>(sections: ReadonlyArray<IRSection<T>>): string[] {
  const ids: string[] = [];
  for (const section of sections) {
    ids.push(section.id);
    ids.push(...getAllSectionIds(section.subSections));
  }
  return ids;
}

/**
 * Calculate maximum nesting depth
 */
function calculateMaxDepth<T>(sections: ReadonlyArray<IRSection<T>>, currentDepth = 1): number {
  let max = currentDepth;
  for (const section of sections) {
    // Check field nesting
    for (const field of section.fields) {
      const fieldDepth = calculateFieldDepth(field, currentDepth + 1);
      max = Math.max(max, fieldDepth);
    }
    // Check subsection nesting
    const subDepth = calculateMaxDepth(section.subSections, currentDepth + 1);
    max = Math.max(max, subDepth);
  }
  return max;
}

function calculateFieldDepth<T>(field: IRField<any, T>, currentDepth: number): number {
  let max = currentDepth;
  for (const child of field.fields) {
    const childDepth = calculateFieldDepth(child, currentDepth + 1);
    max = Math.max(max, childDepth);
  }
  return max;
}