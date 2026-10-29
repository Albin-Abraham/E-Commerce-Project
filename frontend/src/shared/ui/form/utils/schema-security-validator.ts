/**
 * Schema Security Validator
 *
 * Validates form schemas (EntityDefinition, Contract, FormDefinition) for security
 * violations at compile time. Integrates with IR Validator and ExpressionEngine.
 */

import type { EntityDefinition } from "../types/application";
import type { FormDefinitionContract } from "../types/contract";
import type { FormDefinition } from "../types";
import type { FormField, RawFormField, RawFormSection } from "../fields";
import { ExpressionEngine } from "@form-core/expression-engine";

export interface SchemaSecurityValidationResult {
  valid: boolean;
  errors: SchemaSecurityError[];
  warnings: SchemaSecurityWarning[];
}

export interface SchemaSecurityError {
  code: string;
  message: string;
  path: string;
  severity: "error";
}

export interface SchemaSecurityWarning {
  code: string;
  message: string;
  path: string;
}

/**
 * Validates any form schema for security violations
 */
export function validateSchemaSecurity(
  schema: EntityDefinition | FormDefinitionContract | FormDefinition | RawFormSection | RawFormField,
  options: {
    allowedExpressionFunctions?: ReadonlyArray<string>;
    maxExpressionDepth?: number;
    requireActionRegistration?: boolean;
    tenantIsolation?: boolean;
    tenantId?: string;
  } = {}
): SchemaSecurityValidationResult {
  const errors: SchemaSecurityError[] = [];
  const warnings: SchemaSecurityWarning[] = [];

  const allowedFunctions = options.allowedExpressionFunctions ?? [
    "today", "sum", "uppercase", "lowercase", "currency", "hasrole"
  ];
  const maxDepth = options.maxExpressionDepth ?? 10;

  // Create expression engine for validation
  const expressionEngine = new ExpressionEngine({
    allowedFunctions,
    maxDepth,
    strictMode: true,
  });

  // Validate based on schema type
  if ("content" in schema && "behavior" in schema) {
    // EntityDefinition
    validateEntityDefinition(schema as EntityDefinition, expressionEngine, errors, warnings, options);
  } else if ("sections" in schema && "id" in schema && "title" in schema) {
    // FormDefinitionContract or FormDefinition
    validateFormDefinition(schema as any, expressionEngine, errors, warnings, options);
  } else if ("fields" in schema && "id" in schema) {
    // RawFormSection
    validateSection(schema as RawFormSection, "", expressionEngine, errors, warnings, options);
  } else if ("type" in schema && "id" in schema) {
    // RawFormField
    validateField(schema as RawFormField, "", expressionEngine, errors, warnings, options);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateEntityDefinition(
  entity: EntityDefinition,
  engine: ExpressionEngine,
  errors: SchemaSecurityError[],
  warnings: SchemaSecurityWarning[],
  options: any
) {
  // Validate content
  if (entity.content?.sections) {
    for (let i = 0; i < entity.content.sections.length; i++) {
      validateSection(entity.content.sections[i], `content.sections[${i}]`, engine, errors, warnings, options);
    }
  }

  // Validate behavior middleware
  if (entity.behavior?.pipeline?.middleware) {
    for (let i = 0; i < entity.behavior.pipeline.middleware.length; i++) {
      const mw = entity.behavior.pipeline.middleware[i];
      if (typeof mw === "function") {
        errors.push({
          code: "FUNCTION_CALLBACK_IN_SCHEMA",
          message: "Middleware functions in EntityDefinition must be serializable references, not inline functions",
          path: `behavior.pipeline.middleware[${i}]`,
          severity: "error",
        });
      }
    }
  }

  // Validate remote options URLs
  if (entity.content?.sections) {
    checkRemoteOptionsUrls(entity.content.sections, "content", errors, warnings);
  }
}

function validateFormDefinition(
  form: any,
  engine: ExpressionEngine,
  errors: SchemaSecurityError[],
  warnings: SchemaSecurityWarning[],
  options: any
) {
  // Validate sections
  if (form.sections) {
    for (let i = 0; i < form.sections.length; i++) {
      validateSection(form.sections[i], `sections[${i}]`, engine, errors, warnings, options);
    }
  }

  // Validate root fields
  if (form.fields) {
    for (let i = 0; i < form.fields.length; i++) {
      validateField(form.fields[i], `fields[${i}]`, engine, errors, warnings, options);
    }
  }

  // Validate actions
  if (form.actions && options.requireActionRegistration) {
    for (const [actionId, handler] of Object.entries(form.actions)) {
      if (typeof handler === "function") {
        errors.push({
          code: "FUNCTION_CALLBACK_IN_SCHEMA",
          message: "Action handlers must be registered capabilities, not inline functions",
          path: `actions.${actionId}`,
          severity: "error",
        });
      }
    }
  }

  // Validate remote options
  if (form.sections) {
    checkRemoteOptionsUrls(form.sections, "", errors, warnings);
  }
  if (form.fields) {
    checkRemoteOptionsUrls(form.fields, "", errors, warnings);
  }
}

function validateSection(
  section: RawFormSection,
  path: string,
  engine: ExpressionEngine,
  errors: SchemaSecurityError[],
  warnings: SchemaSecurityWarning[],
  options: any
) {
  const sectionPath = path ? `${path}.sections[${section.id || "unknown"}]` : `section[${section.id || "unknown"}]`;

  // Validate section visible/enabled conditions
  if (section.visible !== undefined) {
    validateVisibilityCondition(section.visible, `${sectionPath}.visible`, engine, errors, warnings);
  }

  if (section.meta?.conditions) {
    validateConditionExpression(section.meta.conditions, `${sectionPath}.meta.conditions`, engine, errors, warnings);
  }

  // Validate fields
  if (section.fields) {
    for (let i = 0; i < section.fields.length; i++) {
      validateField(section.fields[i], `${sectionPath}.fields[${i}]`, engine, errors, warnings, options);
    }
  }

  // Validate sub-sections
  if (section.subSections) {
    for (let i = 0; i < section.subSections.length; i++) {
      validateSection(section.subSections[i], sectionPath, engine, errors, warnings, options);
    }
  }
}

function validateField(
  field: RawFormField,
  path: string,
  engine: ExpressionEngine,
  errors: SchemaSecurityError[],
  warnings: SchemaSecurityWarning[],
  options: any
) {
  const fieldPath = path;

  // Check for function callbacks (security violation)
  if (typeof field.visible === "function") {
    errors.push({
      code: "FUNCTION_CALLBACK_IN_SCHEMA",
      message: "Function callbacks in 'visible' are not allowed - use expression strings instead",
      path: `${fieldPath}.visible`,
      severity: "error",
    });
  }

  if (typeof field.enabled === "function") {
    errors.push({
      code: "FUNCTION_CALLBACK_IN_SCHEMA",
      message: "Function callbacks in 'enabled' are not allowed - use expression strings instead",
      path: `${fieldPath}.enabled`,
      severity: "error",
    });
  }

  if (typeof field.required === "function") {
    errors.push({
      code: "FUNCTION_CALLBACK_IN_SCHEMA",
      message: "Function callbacks in 'required' are not allowed - use expression strings instead",
      path: `${fieldPath}.required`,
      severity: "error",
    });
  }

  if (field.onChange && typeof field.onChange === "function") {
    warnings.push({
      code: "FUNCTION_CALLBACK_IN_SCHEMA",
      message: "onChange callbacks should be registered as middleware, not inline functions",
      path: `${fieldPath}.onChange`,
    });
  }

  if (field.onSelectChange && typeof field.onSelectChange === "function") {
    warnings.push({
      code: "FUNCTION_CALLBACK_IN_SCHEMA",
      message: "onSelectChange callbacks should be registered as middleware, not inline functions",
      path: `${fieldPath}.onSelectChange`,
    });
  }

  // Validate computed field
  if (field.computed) {
    if (typeof field.computed.expression === "function") {
      errors.push({
        code: "FUNCTION_CALLBACK_IN_SCHEMA",
        message: "Function callbacks in 'computed.expression' are not allowed - use expression strings",
        path: `${fieldPath}.computed.expression`,
        severity: "error",
      });
    } else if (typeof field.computed.expression === "string") {
      const validation = engine.validateExpression(field.computed.expression, engine.config.allowedFunctions, engine.config.maxDepth);
      if (!validation.valid) {
        errors.push({
          code: "INVALID_COMPUTED_EXPRESSION",
          message: `Computed expression invalid: ${validation.errors.join("; ")}`,
          path: `${fieldPath}.computed.expression`,
          severity: "error",
        });
      }
    }
  }

  // Validate conditions
  if (field.conditions) {
    validateConditionExpression(field.conditions, `${fieldPath}.conditions`, engine, errors, warnings);
  }

  if (field.meta?.conditions) {
    validateConditionExpression(field.meta.conditions, `${fieldPath}.meta.conditions`, engine, errors, warnings);
  }

  // Validate visibility/enabled expressions
  if (typeof field.visible === "string") {
    validateVisibilityCondition(field.visible, `${fieldPath}.visible`, engine, errors, warnings);
  }

  if (typeof field.enabled === "string") {
    validateVisibilityCondition(field.enabled, `${fieldPath}.enabled`, engine, errors, warnings);
  }

  // Validate remote options URL
  if (field.remoteOptions?.url) {
    validateRemoteOptionsUrl(field.remoteOptions.url, `${fieldPath}.remoteOptions.url`, errors, warnings, options);
  }

  // Validate nested fields
  if (field.fields) {
    for (let i = 0; i < field.fields.length; i++) {
      validateField(field.fields[i], `${fieldPath}.fields[${i}]`, engine, errors, warnings, options);
    }
  }
}

function validateVisibilityCondition(
  condition: string | boolean | any,
  path: string,
  engine: ExpressionEngine,
  errors: SchemaSecurityError[],
  warnings: SchemaSecurityWarning[]
) {
  if (typeof condition === "boolean") return; // Boolean is fine
  if (typeof condition === "function") {
    errors.push({
      code: "FUNCTION_CALLBACK_IN_SCHEMA",
      message: "Function callbacks in visibility conditions are not allowed - use expression strings",
      path,
      severity: "error",
    });
    return;
  }
  if (typeof condition === "string") {
    const validation = engine.validateExpression(condition, engine.config.allowedFunctions, engine.config.maxDepth);
    if (!validation.valid) {
      errors.push({
        code: "INVALID_VISIBILITY_EXPRESSION",
        message: `Visibility expression invalid: ${validation.errors.join("; ")}`,
        path,
        severity: "error",
      });
    }
  }
}

function validateConditionExpression(
  conditions: any,
  path: string,
  engine: ExpressionEngine,
  errors: SchemaSecurityError[],
  warnings: SchemaSecurityWarning[]
) {
  if (!conditions) return;

  // Validate 'when' clause
  if (conditions.when) {
    const whenStr = JSON.stringify(conditions.when);
    // Extract potential expressions from when clause
    extractExpressionsFromObject(conditions.when).forEach(({ expr, exprPath }) => {
      if (typeof expr === "string") {
        const validation = engine.validateExpression(expr, engine.config.allowedFunctions, engine.config.maxDepth);
        if (!validation.valid) {
          errors.push({
            code: "INVALID_CONDITION_EXPRESSION",
            message: `Condition 'when' expression invalid: ${validation.errors.join("; ")}`,
            path: `${path}.when${exprPath}`,
            severity: "error",
          });
        }
      }
    });
  }

  // Validate 'then'/'else' clauses for setValue effects
  if (conditions.then) {
    validateSetValueEffects(conditions.then, `${path}.then`, engine, errors, warnings);
  }
  if (conditions.else) {
    validateSetValueEffects(conditions.else, `${path}.else`, engine, errors, warnings);
  }
}

function validateSetValueEffects(
  effects: any,
  path: string,
  engine: ExpressionEngine,
  errors: SchemaSecurityError[],
  warnings: SchemaSecurityWarning[]
) {
  if (!effects) return;

  // Effects can be array or object
  const effectsArray = Array.isArray(effects) ? effects : [effects];

  for (let i = 0; i < effectsArray.length; i++) {
    const effect = effectsArray[i];
    const effectPath = `${path}[${i}]`;

    // Check for function in value
    if (effect.value && typeof effect.value === "function") {
      errors.push({
        code: "FUNCTION_CALLBACK_IN_SCHEMA",
        message: "Function callbacks in setValue effects are not allowed - use expressions",
        path: `${effectPath}.value`,
        severity: "error",
      });
    }

    // Validate expression if string
    if (effect.value && typeof effect.value === "string") {
      const validation = engine.validateExpression(effect.value, engine.config.allowedFunctions, engine.config.maxDepth);
      if (!validation.valid) {
        errors.push({
          code: "INVALID_SETVALUE_EXPRESSION",
          message: `setValue expression invalid: ${validation.errors.join("; ")}`,
          path: `${effectPath}.value`,
          severity: "error",
        });
      }
    }
  }
}

function extractExpressionsFromObject(obj: any): Array<{ expr: string; exprPath: string }> {
  const results: Array<{ expr: string; exprPath: string }> = [];

  function traverse(current: any, path: string) {
    if (!current || typeof current !== "object") return;

    for (const [key, value] of Object.entries(current)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === "string") {
        // Heuristic: strings with operators or function calls are likely expressions
        if (ExpressionEngine.validateExpression(value, []).valid || value.includes("(") || /[=!<>]=|&&|\|\||\?/.test(value)) {
          results.push({ expr: value, exprPath: currentPath });
        }
      } else if (value && typeof value === "object") {
        traverse(value, currentPath);
      }
    }
  }

  traverse(obj, "");
  return results;
}

function validateRemoteOptionsUrl(
  url: string,
  path: string,
  errors: SchemaSecurityError[],
  warnings: SchemaSecurityWarning[],
  options: any
) {
  if (!url) return;

  try {
    const parsed = new URL(url);

    // Check protocol
    if (!["https:", "http:"].includes(parsed.protocol)) {
      errors.push({
        code: "INVALID_REMOTE_URL_PROTOCOL",
        message: `Remote URL must use http: or https: protocol`,
        path,
        severity: "error",
      });
    }

    // In production, warn about http
    if (parsed.protocol === "http:" && process.env.NODE_ENV === "production") {
      warnings.push({
        code: "INSECURE_REMOTE_URL",
        message: "Remote URL uses insecure HTTP protocol",
        path,
      });
    }

    // Check against allowlist if tenant isolation enabled
    if (options.tenantIsolation && options.tenantId) {
      // In real implementation, check against tenant's allowlist
      // For now, just warn about external domains
      if (!parsed.hostname.includes("localhost") && !parsed.hostname.includes("127.0.0.1")) {
        warnings.push({
          code: "EXTERNAL_REMOTE_URL",
          message: `Remote URL points to external domain: ${parsed.hostname}. Ensure this is in tenant allowlist.`,
          path,
        });
      }
    }
  } catch {
    errors.push({
      code: "INVALID_REMOTE_URL",
      message: `Remote URL is not valid: ${url}`,
      path,
      severity: "error",
    });
  }
}

function checkRemoteOptionsUrls(
  items: any[],
  basePath: string,
  errors: SchemaSecurityError[],
  warnings: SchemaSecurityWarning[]
) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemPath = basePath ? `${basePath}[${i}]` : `[${i}]`;

    if (item.remoteOptions?.url) {
      validateRemoteOptionsUrl(item.remoteOptions.url, `${itemPath}.remoteOptions.url`, errors, warnings, {});
    }

    if (item.fields) {
      checkRemoteOptionsUrls(item.fields, `${itemPath}.fields`, errors, warnings);
    }
  }
}

/**
 * Validates a single expression string for security
 */
export function validateExpressionSecurity(
  expression: string,
  allowedFunctions: ReadonlyArray<string> = DEFAULT_EXPRESSION_CONFIG.allowedFunctions,
  maxDepth: number = DEFAULT_EXPRESSION_CONFIG.maxDepth
): { valid: boolean; errors: string[] } {
  return ExpressionEngine.validateExpression(expression, allowedFunctions, maxDepth);
}

/**
 * Batch validates multiple expressions
 */
export function validateExpressionsBatch(
  expressions: Array<{ expression: string; path: string }>,
  allowedFunctions: ReadonlyArray<string> = DEFAULT_EXPRESSION_CONFIG.allowedFunctions,
  maxDepth: number = DEFAULT_EXPRESSION_CONFIG.maxDepth
): Array<{ path: string; valid: boolean; errors: string[] }> {
  return expressions.map(({ expression, path }) => ({
    path,
    ...validateExpressionSecurity(expression, allowedFunctions, maxDepth),
  }));
}

// Re-export constants for external use
export const DEFAULT_EXPRESSION_CONFIG = {
  allowedFunctions: ["today", "sum", "uppercase", "lowercase", "currency", "hasrole"],
  maxDepth: 10,
  maxEvaluationTimeMs: 50,
  strictMode: true,
  customFunctions: {},
};