import type { FormDefinition } from "../types";
import type { EntityDefinition } from "../types/application";
import { compileToIR, IRToFormDefinition } from "./ir-compiler";
import { validateIR } from "./ir-validator";

/**
 * ── TRUE MDAP COMPILER ───────────────────────────────────────────────────────
 *
 * Consumes a complete 6-Layer MDAP Entity (Content, Behavior, Surface, Presentation)
 * and compiles it down into a flattened runtime FormDefinition.
 *
 * Now uses the unified CanonicalFormIR pipeline for consistency with Contract API.
 */
export function compileEntityToFormDef<T extends Record<string, any>>(
  entity: EntityDefinition<T>,
  formId: string,
  submitLabel: string
): FormDefinition<T> {
  // Compile through the unified IR pipeline
  const result = compileToIR(entity, {
    formId,
    submitLabel,
    sourceType: "entity",
  });

  // Validate IR
  if (!result.validation.valid) {
    const errorMessages = result.validation.errors.map(e => `${e.path}: ${e.message}`).join("; ");
    console.error("[MDAP Compiler] IR validation failed:", errorMessages);
    throw new Error(`MDAP compilation failed: ${errorMessages}`);
  }

  // Log warnings
  if (result.validation.warnings.length > 0) {
    result.validation.warnings.forEach(w => {
      console.warn(`[MDAP Compiler] ${w.path}: ${w.message}`);
    });
  }

  // Convert IR to runtime FormDefinition
  return IRToFormDefinition(result.ir);
}

/**
 * Compile EntityDefinition to CanonicalFormIR (for advanced use cases)
 */
export function compileEntityToIR<T extends Record<string, any>>(
  entity: EntityDefinition<T>,
  formId: string,
  submitLabel: string
) {
  return compileToIR(entity, { formId, submitLabel, sourceType: "entity" });
}

/**
 * Validate EntityDefinition without compiling
 */
export function validateEntityDefinition<T extends Record<string, any>>(
  entity: EntityDefinition<T>,
  formId: string,
  submitLabel: string
) {
  const result = compileToIR(entity, { formId, submitLabel, sourceType: "entity" });
  return result.validation;
}