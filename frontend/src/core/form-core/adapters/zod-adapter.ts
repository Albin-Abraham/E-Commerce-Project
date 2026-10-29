/**
 * @file zod-adapter.ts
 * @description Native Zod Validation Adapter for the form engine.
 *
 * Implements the hexagonal ValidationAdapter port using Zod schemas without
 * UI or framework coupling. Enables keystroke, blur, and submission validation
 * directly inside FormCore while preserving cross-field Zod refinements.
 *
 * @module ZodValidationAdapter
 */
import { z } from "zod";
import type { FormField } from "../domain/field";
import type { DetailedError } from "../int-types";
import type { ValidationAdapter } from "../validation-adapter";

/**
 * Pluggable ValidationAdapter implementing Zod validation for FormCore.
 *
 * @template TValues - Inferred data shape of the Zod schema.
 */
export class ZodValidationAdapter<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> implements ValidationAdapter<TValues> {
  constructor(public readonly schema: z.ZodType<TValues>) {}

  /**
   * Validates a single field's candidate value in the context of the full form values.
   *
   * Evaluates the schema against candidate values to preserve cross-field validation
   * rules (e.g. `.refine((data) => data.password === data.confirmPassword)`).
   */
  public validateField(
    field: FormField,
    value: unknown,
    values: TValues
  ): DetailedError[] {
    const fieldPath = field.name || field.id;
    const testValues = {
      ...(values || {}),
      [fieldPath]: value,
    } as unknown as TValues;

    const result = this.schema.safeParse(testValues);
    if (result.success) {
      return [];
    }

    // Filter issues for this specific field path or its children
    const fieldIssues = result.error.issues.filter((issue) => {
      const pathStr = issue.path.join(".");
      return (
        pathStr === fieldPath ||
        pathStr === field.id ||
        pathStr.startsWith(`${fieldPath}.`)
      );
    });

    return fieldIssues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      fieldId: field.id,
      details: issue,
    }));
  }

  /**
   * Validates the entire form state in a single pass.
   *
   * @param values - Current values state of the form.
   * @returns Map of fieldId to DetailedError array.
   */
  public validateForm(values: TValues): Record<string, DetailedError[]> {
    const result = this.schema.safeParse(values);
    if (result.success) {
      return {};
    }

    const errorsMap: Record<string, DetailedError[]> = {};
    for (const issue of result.error.issues) {
      const fieldId = issue.path.join(".") || "root";
      if (!errorsMap[fieldId]) {
        errorsMap[fieldId] = [];
      }
      errorsMap[fieldId].push({
        code: issue.code,
        message: issue.message,
        fieldId,
        details: issue,
      });
    }
    return errorsMap;
  }
}

/**
 * Factory helper for instantiating a ZodValidationAdapter with type inference.
 *
 * @example
 * const schema = z.object({ email: z.string().email() });
 * const adapter = createZodValidator(schema);
 */
export function createZodValidator<T extends Record<string, unknown>>(
  schema: z.ZodType<T>
): ZodValidationAdapter<T> {
  return new ZodValidationAdapter<T>(schema);
}
