import type { ResolvedFieldProps } from "@form-core/int-types";
import { useForm } from "./useForm";

/**
 * useFormField
 *
 * A convenience wrapper for rendering form fields manually (outside of FormComposer).
 * DELEGATION PRINCIPLE: This hook MUST always delegate to form.getComponentProps()
 * to ensure visual and behavioral consistency with the v2 engine.
 */
export function useFormField(
  formHook: ReturnType<typeof useForm>,
  name: string // Simplified to string for dynamic field IDs or names
) {
  const { form } = formHook;

  // Delegate entirely to the engine's ReactAdapter
  // This ensures we get the correct value, error, handlers, and meta-data sync.
  const props = form.getComponentProps(name) as unknown as ResolvedFieldProps;

  return {
    ...props,
    // Provide explicit semantic aliases for easier use in custom components
    value: props.inputProps?.value,
    error: Boolean(props.inputProps?.errors?.length),
    onChange: props.inputProps?.onChange,
    onBlur: props.inputProps?.onBlur,
    onFocus: props.inputProps?.onFocus,
    // Add raw field access if needed for advanced visibility logic in custom renderers
    field: form.resolveField(name),
  };
}
