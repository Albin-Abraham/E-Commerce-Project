import { useFormRegistry } from "@ui/form/context/FormRegistryContext";
import type { FormCore } from "@form-core/engine";

/**
 * useFormContext<T>
 *
 * Typed access to the live `FormCore` instance from anywhere inside a `<Form>` tree.
 * The generic `T` should match the shape of the form's data model to get full
 * autocomplete on `form.values`, `form.setValue()`, etc.
 *
 * Resolves fields by `key` (which auto-sets both `id` and `name` to the same value),
 * eliminating the id/name split entirely when a schema uses `key`.
 *
 * @example
 * // Inside any component rendered within a <Form>:
 * const form = useFormContext<{ email: string; role: string }>();
 * const email = form.values.email;
 * await form.setValue("email", "alice@example.com");
 * const isValid = form.isValid;
 *
 * @throws If called outside of a `<FormRegistryProvider>` (i.e., outside a `<Form>`).
 */
export function useFormContext<
  T extends Record<string, any> = Record<string, any>,
>(): FormCore<T> {
  const { form } = useFormRegistry();

  if (!form) {
    throw new Error(
      "[useFormContext] Must be used inside a <Form> component.\n" +
        "Wrap your component tree with <Form> or <FormRegistryProvider>."
    );
  }

  // Cast: FormRegistryContext stores FormCore<any>, we narrow to T here.
  // This is safe — T is a pure compile-time constraint, not a runtime check.
  return form as unknown as FormCore<T>;
}
