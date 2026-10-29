/**
 * @file history.ts
 * @description Undo/redo history stack for form field values.
 *
 * Captures deep-cloned snapshots of `form.values` on each mutation
 * and supports undo/rewind with configurable capacity.
 *
 * ## Usage (via FormCore)
 * ```ts
 * form.undo();         // revert to previous snapshot
 * form.redo();         // re-apply a reverted snapshot
 * form.canUndo;        // boolean
 * form.canRedo;        // boolean
 * form.history.clear(); // reset
 * ```
 *
 * ## Design
 * - **Capacity-bound**: defaults to 50 snapshots to prevent memory leaks.
 * - **Coalescing**: rapid successive mutations within 300ms overwrite the last snapshot
 *   so that a typed word is one undo step, not 5 keystrokes.
 * - **Deep clones**: each snapshot is a structured clone (via `structuredClone` or fallback).
 */

const DEFAULT_CAPACITY = 50;
const COALESCE_WINDOW_MS = 300;

/** A single snapshot in the undo stack. */
export interface HistorySnapshot<T = Record<string, any>> {
  values: T;
  timestamp: number;
}

export interface HistoryOptions {
  /** Max snapshots to retain (default: 50). */
  capacity?: number;
  /** Coalesce window in ms (default: 300). Rapid changes within this window
   *  overwrite the last snapshot rather than creating a new one. */
  coalesceWindowMs?: number;
}

function deepClone<T>(obj: T): T {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(obj);
    } catch {
      // fallback to manual deep clone
    }
  }
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(deepClone) as unknown as T;
  }
  const copy = {} as Record<string, any>;
  for (const [k, v] of Object.entries(obj)) {
    copy[k] = deepClone(v);
  }
  return copy as T;
}


export class FormHistory<T extends Record<string, any> = Record<string, any>> {
  /** Snapshots before the current position (past). */
  private past: HistorySnapshot<T>[] = [];
  /** Snapshots after the current position (future for redo). */
  private future: HistorySnapshot<T>[] = [];

  private capacity: number;
  private coalesceWindowMs: number;

  /** The current values (not in past or future). */
  private currentValues: T;

  constructor(initialValues: T, options?: HistoryOptions) {
    this.capacity = options?.capacity ?? DEFAULT_CAPACITY;
    this.coalesceWindowMs = options?.coalesceWindowMs ?? COALESCE_WINDOW_MS;
    this.currentValues = deepClone(initialValues);
  }

  /** Push a new snapshot. Called after each setValue. */
  push(values: T) {
    const snapshot: HistorySnapshot<T> = {
      values: deepClone(this.currentValues),
      timestamp: Date.now(),
    };

    // Coalescing: if last snapshot is recent, overwrite it
    if (this.past.length > 0) {
      const last = this.past[this.past.length - 1];
      if (Date.now() - last.timestamp < this.coalesceWindowMs) {
        this.past[this.past.length - 1] = snapshot;
        this.currentValues = deepClone(values);
        return;
      }
    }

    this.past.push(snapshot);

    // Capacity: drop oldest
    if (this.past.length > this.capacity) {
      this.past.shift();
    }

    // Redo stack is cleared on new mutation
    this.future = [];
    this.currentValues = deepClone(values);
  }

  /** Undo one step. Returns the restored values, or null if nothing to undo. */
  undo(): T | null {
    if (this.past.length === 0) return null;

    // Save current as future for redo
    this.future.push({
      values: deepClone(this.currentValues),
      timestamp: Date.now(),
    });

    const snapshot = this.past.pop()!;
    this.currentValues = deepClone(snapshot.values);
    return this.currentValues;
  }

  /** Redo one step. Returns the restored values, or null if nothing to redo. */
  redo(): T | null {
    if (this.future.length === 0) return null;

    // Save current as past for undo
    this.past.push({
      values: deepClone(this.currentValues),
      timestamp: Date.now(),
    });

    const snapshot = this.future.pop()!;
    this.currentValues = deepClone(snapshot.values);
    return this.currentValues;
  }

  /** Whether undo is available. */
  get canUndo(): boolean {
    return this.past.length > 0;
  }

  /** Whether redo is available. */
  get canRedo(): boolean {
    return this.future.length > 0;
  }

  /** Number of past snapshots. */
  get undoCount(): number {
    return this.past.length;
  }

  /** Number of future snapshots. */
  get redoCount(): number {
    return this.future.length;
  }

  /** Clear all history. */
  clear() {
    this.past = [];
    this.future = [];
  }

  /** Peek at the most recent past snapshot without consuming it. */
  peekUndo(): HistorySnapshot<T> | null {
    return this.past[this.past.length - 1] ?? null;
  }

  /** Peek at the most recent future snapshot without consuming it. */
  peekRedo(): HistorySnapshot<T> | null {
    return this.future[this.future.length - 1] ?? null;
  }
}
