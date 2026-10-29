import { useSyncExternalStore } from "react";

import type { FormCore } from "@form-core/engine";
import type {
  InternalFormState,
  ResolvedFieldProps,
} from "@form-core/int-types";

/**
 * Subscribe to global form state via `useSyncExternalStore`.
 *
 * Re-renders on any structural change (visibility, isDirty, isValid, etc.).
 * Does NOT re-render on per-field keystrokes — use `useFieldExternalStore` for that.
 *
 * @param form - A `FormCore` or `Form` instance.
 * @returns The current `structuralVersion` (monotonic counter).
 *
 * @example
 * function FormStatus({ form }) {
 *   const version = useFormExternalStore(form);
 *   return <span>Form v{version}</span>;
 * }
 */
export function useFormExternalStore(form: FormCore<any>): number {
  const store = form.toSyncExternalStore();
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );
}

/**
 * Subscribe to a single field's props via `useSyncExternalStore`.
 *
 * Atomic per-field subscription — only re-renders when this specific field changes.
 * Returns the cached `FieldComponentProps` from the React adapter.
 *
 * @param form - A `FormCore` or `Form` instance.
 * @param fieldId - The field's internal state key.
 * @returns The field's resolved component props (value, onChange, error, etc.).
 *
 * @example
 * function ExternalEmailDisplay({ form }) {
 *   const props = useFieldExternalStore(form, "email_field_id");
 *   return <div>{props.label}: {props.value}</div>;
 * }
 */
export function useFieldExternalStore(
  form: FormCore<any>,
  fieldId: string
): ResolvedFieldProps {
  const store = form.toFieldSyncExternalStore(fieldId);
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );
}

/**
 * Subscribe to a derived slice of form state via `useSyncExternalStore`.
 *
 * Only re-renders when the selected slice changes (identity check).
 *
 * @param form - A `FormCore` or `Form` instance.
 * @param selector - Pure function that extracts a slice from `InternalFormState`.
 * @returns The selected slice.
 *
 * @example
 * // Subscribe to only validity:
 * const validity = useFormSlice(form, (state) => state.validity);
 *
 * @example
 * // Subscribe to visible field IDs:
 * const visibleIds = useFormSlice(form, (state) =>
 *   Object.keys(state.visibility).filter(k => state.visibility[k])
 * );
 */
export function useFormSlice<TSlice>(
  form: FormCore<any>,
  selector: (state: InternalFormState<any>) => TSlice
): TSlice {
  const store = form.toSliceSyncExternalStore(selector);
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );
}
