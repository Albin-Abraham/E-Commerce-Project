import { useSyncExternalStore } from "react";

import { useFormRegistry } from "../context/FormRegistryContext";

/**
 * useField Hook — Performs ATOMIC subscriptions to a specific field's state.
 *
 * PERFORMANCE: This is the core of the O(1) re-render architecture.
 * Instead of subscribing to the entire form state in the shell, each field
 * component uses this hook to listen only for changes to its specific ID.
 *
 * `subscribeToField` is defined on `StateManager` and surfaced on `FormCore`
 * (engine.ts L1054). It maintains a per-field subscriber set and only notifies
 * listeners when `notifyField(fieldId)` is called — not on every global mutation.
 *
 * `getComponentProps` is on the `Form` facade (form.ts L120) which extends `FormCore`.
 *
 * @param fieldId - The ID of the field to subscribe to.
 * @returns The merged props for the field, derived from the latest engine state.
 */
export function useField(fieldId: string) {
  const { form } = useFormRegistry();

  if (!form) {
    throw new Error(
      `[useField] Field "${fieldId}" must be rendered within a <FormRegistryProvider>.`
    );
  }

  // ATOMIC SUBSCRIPTION:
  // useSyncExternalStore wires React's scheduler into the field-level subscriber set.
  // The 'getSnapshot' returns a reference-stable prop object from the ReactFormAdapter's cache.
  const fieldProps = useSyncExternalStore(
    (callback) => form.subscribeToField(fieldId, callback),
    () => form.getComponentProps(fieldId)
  );

  return fieldProps;
}
