import type { DetailedError } from "@form-core/int-types";
import * as yup from "yup";

/**
 * @deprecated Use validateZodSchema instead. Yup support is maintained for
 * backwards compatibility only. New code should use Zod schemas.
 *
 * Validates values against a Yup schema and returns structured errors.
 */
export async function validateYupSchema(
  schema: yup.AnyObjectSchema,
  values: any
): Promise<DetailedError[]> {
  try {
    await schema.validate(values, { abortEarly: false });
    return [];
  } catch (err: any) {
    if (err instanceof yup.ValidationError) {
      return err.inner.map((e) => ({
        code: e.type || "yup-validation",
        message: e.message,
        fieldId: e.path || "", // Assumes path matches field ID/Name
        details: e.params,
      }));
    }
    throw err;
  }
}
