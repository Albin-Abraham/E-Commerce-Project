import { useMemo } from "react";

import { useFieldAtom } from "./useFieldAtom";
import { useFormContext } from "./useFormContext";

/**
 * useController<T>(fieldKey)
 *
 * Full controlled field hook. Provides the complete field state + handlers
 * needed to build a custom controlled input component connected to the form engine.
 *
 * Internally delegates to `useFieldAtom` (the engine's micro-subscription primitive)
 * but resolves the field by `key`, `name`, OR `id` — removing the need to know
 * which addressing mode to use.
 *
 * ## Key-Based Addressing
 * When a schema uses `key`, `id === name === key`. Passing `key` to `useController`
 * always resolves correctly regardless of whether the engine looks up by id or name.
 *
 * @param fieldKey - The field's `key`, `name`, or `id`.
 *
 * @returns Full field state + stable handlers + resolved field definition.
 *
 * @example
 * // Schema: { key: "email", type: "text", validation: { required: true } }
 *
 * function CustomEmailInput() {
 *   const { value, error, errorMessage, onChange, onBlur, field } = useController("email");
 *   return (
 *     <input
 *       value={value ?? ""}
 *       onChange={(e) => onChange(e.target.value)}
 *       onBlur={onBlur}
 *       aria-invalid={!!error}
 *       aria-describedby={error ? `${field?.id}-error` : undefined}
 *     />
 *   );
 * }
 */
export function useController<T = any>(fieldKey: string) {
  const form = useFormContext();

  // Enforce strict key-based addressing to prevent ambiguity
  const field = useMemo(() => form.resolveField(fieldKey), [form, fieldKey]);

  // Micro-subscription: only re-renders when THIS field's value/validity/vitality changes
  const atom = useFieldAtom(fieldKey, field?.name ?? fieldKey);

  return {
    // ── Field State ─────────────────────────────────────────────────
    value: atom.value as T,
    error: atom.error,
    errorMessage: atom.errorMessage,
    vitality: atom.vitality,

    // ── Stable Handlers ─────────────────────────────────────────────
    onChange: atom.onChange,
    onBlur: atom.onBlur,
    onFocus: atom.onFocus,

    // ── Field Meta ──────────────────────────────────────────────────
    field,
    fieldId: fieldKey,
    fieldName: field?.name ?? fieldKey,

    /**
     * Full merged component props from the ReactFormAdapter.
     * Spread directly onto any UI component for full engine integration:
     * `<MyInput {...componentProps} />`
     *
     * Memoized to avoid redundant `getComponentProps` rebuilds.
     * The adapter's internal prop cache provides reference stability
     * when engine version hasn't changed.
     */
    componentProps: useMemo(
      () => form.getComponentProps(fieldKey),
      [form, fieldKey, atom.value, atom.error, atom.errorMessage, atom.vitality]
    ),
  };
}
