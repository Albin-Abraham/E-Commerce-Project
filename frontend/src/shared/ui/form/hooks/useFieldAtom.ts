import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";

import { useFormRegistry } from "../context/FormRegistryContext";

export interface FieldAtomSnapshot {
  value: any;
  error: any;
  vitality: any;
}

const EMPTY_SNAPSHOT: FieldAtomSnapshot = Object.freeze({
  value: undefined,
  error: undefined,
  vitality: Object.freeze({}),
});

/**
 * useFieldAtom
 *
 * ATOMIC SUBSCRIPTION HOOK (React 18/19 Concurrent-Safe via useSyncExternalStore):
 * Subscribes directly to a specific field's state slice via the engine's per-field
 * notification channel (`subscribeToField`).
 *
 * Guarantees reference-stable snapshots and zero layout thrashing on keystrokes.
 * If rendered outside a FormRegistryProvider, gracefully returns safe undefined defaults.
 *
 * @param fieldId - The unique ID of the field entity.
 * @param fieldName - Optional dot-notation path for value resolution.
 */
export function useFieldAtom(fieldId: string, fieldName?: string) {
  const { form } = useFormRegistry();

  const snapshotRef = useRef<FieldAtomSnapshot>(EMPTY_SNAPSHOT);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!form) return () => {};
      return form.stateManager.subscribeToField(fieldId, onStoreChange);
    },
    [form, fieldId]
  );

  const getSnapshot = useCallback((): FieldAtomSnapshot => {
    if (!form) return EMPTY_SNAPSHOT;

    const nextValue = form.valueProxy.getValue(
      form.values,
      fieldName || fieldId
    );
    const nextError = form.validity[fieldId];
    const nextVitality = form.vitality[fieldId];

    const prev = snapshotRef.current;
    if (
      prev.value === nextValue &&
      prev.error === nextError &&
      prev.vitality === nextVitality
    ) {
      return prev;
    }

    const next: FieldAtomSnapshot = {
      value: nextValue,
      error: nextError,
      vitality: nextVitality,
    };
    snapshotRef.current = next;
    return next;
  }, [form, fieldId, fieldName]);

  const state = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => EMPTY_SNAPSHOT
  );

  // Expose stable handlers
  const handlers = useMemo(
    () => ({
      onChange: (val: any) => form?.setValue(fieldName || fieldId, val),
      onBlur: () => form?.setTouched(fieldId),
      onFocus: () => form?.setVitality(fieldId, { focused: true }),
    }),
    [form, fieldId, fieldName]
  );

  return {
    ...state,
    ...handlers,
    errorMessage:
      state.error?.valid === false
        ? state.error.errors?.[0]?.message
        : undefined,
  };
}
