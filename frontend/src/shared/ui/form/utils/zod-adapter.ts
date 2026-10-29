import type { DetailedError } from "@form-core/int-types";
import { z } from "zod";

/**
 * Validates values against a Zod schema and returns structured errors.
 */
export async function validateZodSchema(
  schema: z.ZodType<any>,
  values: any
): Promise<DetailedError[]> {
  const result = schema.safeParse(values);

  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    fieldId: issue.path.join("."),
    details: issue,
  }));
}
