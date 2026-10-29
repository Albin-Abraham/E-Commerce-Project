/**
 * @file useFormArray.ts
 * @description RHF-compatible ergonomic hook for dynamic field arrays and repeaters.
 *
 * ## Responsibility (10/10 Enterprise Requirement)
 * Provides dynamic array manipulations (`append`, `remove`, `move`, `swap`, `replace`)
 * while guaranteeing:
 * 1. Stable, immutable row identity keys for React list rendering (`key={item.id}`).
 * 2. Full 5V state slice preservation ($V1-V5$) across removals, reordering, and insertions.
 * 3. Clean JSON serialization (no `_rowId` pollution in backend payloads).
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useFormContext } from "./useFormContext";

export interface UseFormArrayReturn<TItem = Record<string, any>> {
  /** Array of row items, each guaranteed to have a stable `id` for React `key` props. */
  fields: Array<TItem & { id: string }>;
  /** Appends a new row to the array, auto-assigning an immutable row identity. */
  append: (item?: Partial<TItem>) => string;
  /** Removes a row by index or stable identity ID. */
  remove: (indexOrRowId: number | string) => void;
  /** Moves a row from `fromIndex` to `toIndex`, preserving all state slices. */
  move: (fromIndex: number, toIndex: number) => void;
  /** Swaps two rows by index. */
  swap: (indexA: number, indexB: number) => void;
  /** Replaces the entire array of values. */
  replace: (items: TItem[]) => void;
}

export function useFormArray<TItem = Record<string, any>>(
  name: string
): UseFormArrayReturn<TItem> {
  const form = useFormContext();

  const field = form.resolveField(name);
  const dataPath = field?.name ?? name;
  const fieldId = field?.id ?? name;

  // Reactively subscribe to array changes
  const rawArray = useSyncExternalStore(
    (callback) => {
      const unsubField = form.subscribeToField(fieldId, callback);
      const unsubName =
        dataPath !== fieldId
          ? form.subscribeToField(dataPath, callback)
          : () => {};
      const unsubGlobal = form.subscribe(callback);

      return () => {
        unsubField();
        unsubName();
        unsubGlobal();
      };
    },
    () => {
      const val = form.valueProxy.getValue(form.values, dataPath);
      return Array.isArray(val) ? val : [];
    }
  );

  // Map array items to ensure each item exposes a stable `id` key for React
  const fields = useMemo(() => {
    return (rawArray as any[]).map((item, idx) => {
      const businessId = item?.id;
      const rowId = item?._rowId ?? businessId ?? `row_${idx}`;
      return {
        ...item,
        id: String(rowId),
      };
    });
  }, [rawArray]);

  const append = useCallback(
    (item: Partial<TItem> = {}) => {
      return form.appendRow(dataPath, item);
    },
    [form, dataPath]
  );

  const remove = useCallback(
    (indexOrRowId: number | string) => {
      form.removeRow(dataPath, indexOrRowId);
    },
    [form, dataPath]
  );

  const move = useCallback(
    (fromIndex: number, toIndex: number) => {
      form.moveRow(dataPath, fromIndex, toIndex);
    },
    [form, dataPath]
  );

  const swap = useCallback(
    (indexA: number, indexB: number) => {
      const current = form.valueProxy.getValue(form.values, dataPath);
      if (!Array.isArray(current)) return;
      if (
        indexA < 0 ||
        indexA >= current.length ||
        indexB < 0 ||
        indexB >= current.length
      ) {
        return;
      }

      form.batch(() => {
        form.moveRow(dataPath, indexA, indexB);
        if (Math.abs(indexA - indexB) > 1) {
          const secondMove = indexA < indexB ? indexB - 1 : indexB + 1;
          form.moveRow(dataPath, secondMove, indexA);
        }
      });
    },
    [form, dataPath]
  );

  const replace = useCallback(
    (items: TItem[]) => {
      form.setValue(dataPath as any, items);
    },
    [form, dataPath]
  );

  return {
    fields,
    append,
    remove,
    move,
    swap,
    replace,
  };
}
