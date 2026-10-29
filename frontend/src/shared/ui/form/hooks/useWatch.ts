import { useCallback, useRef, useSyncExternalStore } from "react";

import { useFormContext } from "./useFormContext";

/**
 * useWatch<T>(fieldKey)
 *
 * Reactively subscribes to a single field's value. Re-renders the calling component
 * ONLY when that field's value changes — not on every form keystroke.
 *
 * ## Key-Based Addressing
 * Pass a field's `key` (preferred), `name`, or `id` — they all resolve via
 * `form.resolveField()`. When using `key` in the schema, `id === name === key`,
 * making this hook the single, consistent way to address any field.
 *
 * @param fieldKey - The field's `key`, `name`, or `id`.
 * @returns The current value of the field (type-safe via generic T).
 *
 * @example
 * // Schema uses key:
 * // { key: "role", type: "select", options: [...] }
 *
 * function RoleAwarePanel() {
 *   const role = useWatch<string>("role"); // key = name = id = "role"
 *   return role === "admin" ? <AdminPanel /> : null;
 * }
 */
export function useWatch<T = any>(fieldKey: string): T {
  const form = useFormContext();

  // Resolve field by key/name/id (FieldResolver handles all three)
  // When schema uses `key`, this always finds the field regardless of addressing.
  const field = form.resolveField(fieldKey);
  const valuePath = field?.name ?? fieldKey;
  const fieldId = field?.id ?? fieldKey;

  return useSyncExternalStore(
    (callback) => {
      // True O(1) Atomic Stream: subscribe only to this specific field
      const unsubField = form.subscribeToField(fieldId, callback);
      const unsubName =
        valuePath !== fieldId
          ? form.subscribeToField(valuePath, callback)
          : () => {};

      return () => {
        unsubField();
        unsubName();
      };
    },
    () => form.valueProxy.getValue(form.values, valuePath) as T
  );
}

/**
 * useWatchFields<T>(fieldKeys)
 *
 * Reactively subscribes to multiple field values simultaneously.
 * Returns a partial object keyed by the field keys you passed in.
 *
 * @param fieldKeys - Array of field keys/names/ids to watch.
 * @returns A stable object updated whenever any of the watched fields change.
 *
 * @example
 * const { country, city } = useWatchFields(["country", "city"]);
 * // Shows "city" only when country is set
 * if (!country) return null;
 */
export function useWatchFields<
  T extends Record<string, any> = Record<string, any>,
>(fieldKeys: string[]): Partial<T> {
  const form = useFormContext();
  const prevRef = useRef<Partial<T>>({});
  // Stable reference for the keys to avoid re-subscribing if array reference changes but content is same
  const keysStr = fieldKeys.join(",");

  const getSnapshot = useCallback(() => {
    let changed = false;
    const next: Partial<T> = {};
    const keys = keysStr.split(",");

    keys.forEach((key) => {
      if (!key) return;
      const field = form.resolveField(key);
      const valuePath = field?.name ?? key;
      const val = form.valueProxy.getValue(form.values, valuePath);
      (next as any)[key] = val;
      if ((prevRef.current as any)[key] !== val) {
        changed = true;
      }
    });

    if (
      changed ||
      Object.keys(prevRef.current).length !== keys.filter(Boolean).length
    ) {
      prevRef.current = next;
    }
    return prevRef.current;
  }, [form, keysStr]);

  const subscribe = useCallback(
    (callback: () => void) => form.subscribe(callback),
    [form]
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
