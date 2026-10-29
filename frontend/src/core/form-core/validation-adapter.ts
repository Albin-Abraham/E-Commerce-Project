import type { FormField } from "./domain";
import type { DetailedError } from "./int-types";

/**
 * @file validation-adapter.ts
 * @description Port interface for pluggable validation strategies.
 *
 * This is the **boundary contract** (Ports & Adapters / Hexagonal Architecture)
 * between the form engine and any external validation library.
 *
 * The engine only ever depends on this interface — it never imports Yup, Zod,
 * or any other concrete library. To swap validation backends, implement this
 * interface and pass it to `FormCore` at construction time via `validatorAdapter`.
 *
 * Built-in implementation: {@link ValidationProxy} (uses the internal {@link ValidationRegistry}).
 *
 * @example
 * // Yup adapter example:
 * class YupAdapter implements ValidationAdapter {
 *   constructor(private schema: yup.ObjectSchema<any>) {}
 *
 *   async validateField(field, value, values) {
 *     try {
 *       await this.schema.validateAt(field.name, values, { abortEarly: false });
 *       return [];
 *     } catch (err: any) {
 *       return err.inner.map((e: any) => ({
 *         code: e.type ?? "invalid",
 *         message: e.message,
 *         fieldId: field.id
 *       }));
 *     }
 *   }
 *
 *   validateForm(values) { return {}; }
 * }
 *
 * const form = new FormCore(definition, {}, new YupAdapter(mySchema));
 */
export interface ValidationAdapter<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * Validates a single field's value.
   *
   * Called by {@link FormValidator.validateField} on every relevant event
   * (onChange, onBlur, onSubmit) depending on the active `ValidationMode`.
   *
   * @param field  - The complete field definition (includes type, rules, label, etc.)
   * @param value  - The field's current value from the form's `ValuesState`.
   * @param values - The entire form `ValuesState` object. Use this for cross-field
   *                 validation (e.g., "confirmPassword must equal password").
   * @returns      An array of {@link DetailedError}s. Return an empty array for a valid field.
   *               Can be async (returns a Promise) to support server-side or async rule checks.
   */
  validateField(
    field: FormField,
    value: unknown,
    values: TValues
  ): Promise<DetailedError[]> | DetailedError[];

  /**
   * Screens a candidate value that is not yet stored, reporting character-class
   * violations.
   *
   * Optional. Called by {@link FormValidator.screenCandidate} when
   * `disableDeferredValidation` is enabled, so disallowed input can be rejected
   * before it reaches form state.
   *
   * Adapters that do not implement screening may omit this method.
   *
   * @param field  - The complete field definition.
   * @param value  - The incoming value, before any write.
   * @param values - The entire form `ValuesState`, used to evaluate rule conditions.
   * @returns      The value normalized to the allowed character set, plus a
   *               {@link DetailedError} for each character-class violation. An
   *               empty `errors` list means the value is acceptable as-is.
   */
  screenValue?(
    field: FormField,
    value: unknown,
    values?: TValues
  ): { value: unknown; errors: DetailedError[] };

  /**
   * Validates the entire form at once.
   *
   * @remarks
   * In the **engine-driven** default approach, `FormValidator` calls `validateField`
   * in a loop rather than calling this method. `validateForm` is provided for adapters
   * (like Yup) that can validate the whole object schema more efficiently in a single call.
   *
   * The engine itself does **not** call `validateForm` directly — this method exists
   * to satisfy external adapters that prefer whole-form validation. If your adapter
   * only supports per-field validation, you may return an empty object `{}` here.
   *
   * @param values - The entire form `ValuesState`.
   * @returns A map of `fieldId → DetailedError[]`. Fields with no errors should be
   *          omitted or mapped to an empty array.
   */
  validateForm(
    values: TValues
  ): Promise<Record<string, DetailedError[]>> | Record<string, DetailedError[]>;
}
