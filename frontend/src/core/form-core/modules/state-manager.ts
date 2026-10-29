/**
 * @file state-manager.ts
 * @description The reactive state store for the form engine.
 *
 * ## Responsibilities
 * 1. **Hold** the single `InternalFormState<T>` object — the one source of truth
 *    for all five V-slices (values, validity, visibility, view, vitality) and debug.
 * 2. **Initialize** all state slices from the normalized form definition and optional
 *    `initialValues` passed to the `FormCore` constructor.
 * 3. **Mutate** state via typed setter methods (`setRawValue`, `setVitality`, etc.)
 *    All mutations call `notify()` to propagate changes.
 * 4. **Notify** subscribers (React hooks, adapters) whenever state changes.
 *    This is a simple pub/sub pattern — not Redux/Zustand, but intentionally minimal.
 *
 * ## Dev-Mode Mutation Guard
 * In development, the `values` getter returns a **deep Proxy** that warns when
 * anyone tries to mutate `form.values` directly (bypassing `setValue`). In production,
 * it returns the raw object for maximum performance.
 *
 * ## Category Immutability Contract
 * To maintain the performance benefits of **Vitality Pruning**, field categories
 * (`input`, `static`, `structure`) are immutable after registration. If a field's
 * type changes at runtime such that its category shifts, the engine will not
 * re-allocate the pruned state slices.
 *
 * ## Used By
 * Every other module holds a reference to `StateManager` and reads from `state` directly.
 * Writes always go through dedicated managers/methods to maintain single-responsibility.
 */
import { set } from "lodash-es";

import type {
  InternalFormState,
  NormalizedForm,
  ValidityState,
  ViewState,
  VisibilityState,
  VitalityState,
} from "../int-types";
import type { FieldResolver } from "./resolver";

export class StateManager<T extends Record<string, any> = Record<string, any>> {
  /** The live state tree. All modules read from this directly. */
  public state: InternalFormState<T>;

  /**
   * Set of registered listener functions.
   * Called synchronously on every state mutation via `notify()`.
   */
  private subscribers: Set<(state: InternalFormState<T>) => void> = new Set();
  /** Granular subscribers for specific field IDs (Atomic Subscription Stream) */
  private fieldSubscribers: Map<string, Set<(props: any) => void>> = new Map();
  private batchCount = 0;
  private pendingNotify = false;

  /**
   * Monotonically increasing counter bumped on every mutation.
   * ReactFormAdapter uses this to invalidate its per-field prop cache.
   */
  public version = 0;

  /**
   * Monotonically increasing counter bumped only on structural (global) notifications.
   * Unlike `version`, this is NOT incremented per-field — only when the full
   * state notification fires (visibility, isDirty, etc.).
   * Used by `useForm` as a cheap O(1) snapshot key instead of `JSON.stringify(visibility)`.
   */
  public structuralVersion = 0;

  /**
   * Executes a function within a batching context.
   * Notifications triggered during the function execution are deferred until the function settles.
   * Note: Atomic notifyField calls are always immediate to ensure UI responsiveness.
   */
  public batch = async (fn: () => void | Promise<void>) => {
    this.batchCount++;
    try {
      await fn();
    } finally {
      this.batchCount--;
      if (this.batchCount === 0) {
        if (this.pendingNotify) {
          this.pendingNotify = false;
          this.notify();
        }
      }
    }
  };

  /**
   * Bound notification handler.
   * Notifies global subscribers (Shells, DevTools).
   * If batching is active, the notification is deferred.
   */
  public notify = () => {
    if (this.batchCount > 0) {
      this.pendingNotify = true;
      return;
    }

    this.version++;
    this.structuralVersion++;

    // Increment concurrency version if locking is enabled
    if (this.state.concurrency) {
      this.state.concurrency.version++;
    }

    // Notify Global Listeners (Shells/DevTools)
    this.subscribers.forEach((fn) => fn(this.state));
  };

  /**
   * Notifies subscribers for a specific field ID.
   * PERFORMANCE: This is the "Atomic Stream" entry point.
   * This is ALWAYS synchronous and immediate to prevent input lag.
   */
  public notifyField = (fieldId: string) => {
    // Increment version so getComponentProps builds new props
    this.version++;

    const listeners = this.fieldSubscribers.get(fieldId);
    if (listeners) {
      listeners.forEach((fn) => fn(this.state));
    }
  };

  /**
   * @param definition   - The normalized form definition. Used during `initializeState`
   *   to set up values, validity, vitality, view, and visibility for all known fields.
   * @param initialValues - Optional partial initial data. Provided values won't be
   *   overridden by the field's `initialValue` default.
   */
  constructor(
    private definition: NormalizedForm,
    initialValues?: Partial<T>,
    public resolver: FieldResolver | null = null
  ) {
    this.state = this.initializeState(initialValues);
  }

  /**
   * Builds the initial `InternalFormState<T>` from the normalized definition.
   *
   * **Per-field initialization logic:**
   * - **Repeater template fields** are skipped — they are schema templates and must
   *   not appear as root state values or in validity/vitality maps.
   * - **Input fields**: initialized to `field.initialValue` if not already in `initialValues`,
   *   otherwise left as-is to preserve the caller's provided value.
   * - **Repeater fields**: initialized to `field.initialValue` (typically `[]`) if not provided.
   * - **Visibility**: defaults to `field.visible !== false` (visible unless explicitly hidden).
   * - **Validity**: all fields start as `{ valid: true, errors: [] }`.
   * - **Vitality**: all fields start as `{ touched: false, dirty: false, focused: false, version: 0 }`.
   * - **View**: initialized from `field.label` and `field.properties`.
   *
   * @param initialValues - Optional caller-supplied initial data.
   * @returns The fully initialized `InternalFormState<T>`.
   */
  private initializeState(initialValues?: Partial<T>): InternalFormState<T> {
    const values = { ...(initialValues || {}) } as T;
    const validity: ValidityState = {};
    const visibility: VisibilityState = {};
    const view: ViewState = {};
    const vitality: VitalityState = {};

    Object.values(this.definition.fields).forEach((field) => {
      // ── Skip repeater template fields ─────────────────────────────────
      // Template fields are detected via the `isTemplate` flag injected once
      // during normalization by FieldRegistry (O(1) — no ancestor walk needed).
      if (field.isTemplate) return;

      // ── Initialize State Slices based on Capabilities ──────────────────
      const caps = field.capabilities || {
        hasValue: true,
        hasValidity: true,
        hasVisibility: true,
        hasView: true,
        hasVitality: true,
        derivesValidityFromChildren: false,
      };

      // Values
      if (caps.hasValue) {
        if (values[field.name as keyof T] === undefined) {
          const defaultValue = field.type === "repeater" ? [] : null;
          values[field.name as keyof T] =
            field.initialValue !== undefined
              ? field.initialValue
              : (field as any).defaultValue !== undefined
              ? (field as any).defaultValue
              : defaultValue;
        }
      }

      // Validity
      if (caps.hasValidity) {
        validity[field.id] = { valid: true, errors: [] };
      }

      // Vitality
      if (caps.hasVitality) {
        vitality[field.id] = {
          touched: false,
          dirty: false,
          focused: false,
          version: 0,
          initialValue: values[field.name as keyof T],
        };
      }

      // Visibility
      if (caps.hasVisibility) {
        visibility[field.id] = field.visible !== false;
      }

      // View
      if (caps.hasView) {
        view[field.id] = {
          label: field.label as string,
          description: field.description as string,
          placeholder:
            field.placeholder ||
            field.properties?.placeholder ||
            (field.layout as any)?.placeholder,
          componentProps: field.properties || {},
        };
      }
    });

    const debug: any = { isEnabled: false, logs: [], renderCount: 0 };
    const performance = {
      lastSubmissionDurationMs: 0,
      lastValidationDurationMs: 0,
      averageLatencyMs: 0,
    };

    return { values, validity, visibility, view, vitality, debug, performance };
  }

  /**
   * Resets the entire form state to its initial configuration.
   *
   * @param initialValues - Optional new set of initial values to use after reset.
   *   If omitted, uses the values provided during construction.
   * @param options - Preservation options:
   *   - `keepTouched` (boolean | string[]): preserves touched state for all or specific fields.
   *   - `keepDirty` (boolean | string[]): preserves dirty state.
   *   - `keepValues` (string[]): preserves specific field values.
   */
  public reset(
    initialValues?: Partial<T>,
    options: {
      keepTouched?: boolean | string[];
      keepDirty?: boolean | string[];
      keepValues?: string[];
    } = {}
  ) {
    const prevState = this.state;
    const newState = this.initializeState(initialValues || prevState.values);

    // Apply preservation logic
    if (options.keepTouched) {
      Object.keys(prevState.vitality).forEach((id) => {
        if (
          options.keepTouched === true ||
          (Array.isArray(options.keepTouched) &&
            options.keepTouched.includes(id))
        ) {
          newState.vitality[id].touched = prevState.vitality[id].touched;
        }
      });
    }

    if (options.keepDirty) {
      Object.keys(prevState.vitality).forEach((id) => {
        if (
          options.keepDirty === true ||
          (Array.isArray(options.keepDirty) && options.keepDirty.includes(id))
        ) {
          newState.vitality[id].dirty = prevState.vitality[id].dirty;
        }
      });
    }

    if (options.keepValues) {
      options.keepValues.forEach((fieldName) => {
        const val = prevState.values[fieldName as keyof T];
        if (val !== undefined) {
          newState.values[fieldName as keyof T] = val;
        }
      });
    }

    this.state = newState;
    this.notify();
    this.fieldSubscribers.forEach((listeners) => {
      listeners.forEach((fn) => fn(this.state));
    });
  }

  // ── State Accessors ────────────────────────────────────────────────────────

  /**
   * Returns the current form values.
   *
   * **In development**: returns a deep `Proxy` that fires a `console.warn` if
   * you try to mutate values directly (e.g., `form.values.name = "John"`).
   * Direct mutation bypasses validation, visibility evaluation, and vitality tracking.
   * Always use `form.setValue(fieldName, value)` instead.
   *
   * **In production**: returns the raw `state.values` object for maximum performance.
   * (Mutations still won't trigger re-renders, but no warning is shown in prod.)
   */
  get values(): T {
    if (process.env.NODE_ENV === "development") {
      return this.createDeepProxy(this.state.values, (path, val) => {
        console.warn(
          "[StateManager] Direct mutation via form.values is deprecated and will NOT work in production.",
          "\nPlease use form.setValue() for mutations.",
          { path: path.join("."), value: val }
        );
      });
    }
    return this.state.values;
  }

  /** Read-only access to the validity slice. Write via {@link ErrorManager}. */
  get validity(): Readonly<ValidityState> {
    return this.state.validity;
  }
  /** Read-only access to the visibility slice. Written by {@link FormVisibility}. */
  get visibility(): Readonly<VisibilityState> {
    return this.state.visibility;
  }
  /** Read-only access to the view slice. View is mutated by runtime view-update logic. */
  get view(): Readonly<ViewState> {
    return this.state.view;
  }
  /** Read-only access to the vitality slice. Written by {@link FormExecution} and `setTouched`. */
  get vitality(): Readonly<VitalityState> {
    return this.state.vitality;
  }

  // ── State Mutators ─────────────────────────────────────────────────────────

  /**
   * Directly sets a value in the state tree by path and notifies subscribers.
   *
   * **Low-level API** — does NOT trigger validation, visibility evaluation,
   * or vitality updates. Used internally by {@link FormExecution.setValue} which
   * handles those side effects after calling this method.
   *
   * @param path  - Dot-notation path (e.g., `"address.city"` or `"users[0].name"`).
   * @param value - The new value to write.
   */
  public setRawValue(path: string | string[], value: any) {
    set(this.state.values, path, value); // Mutate in-place (lodash set)
    this.notify();
  }

  /**
   * Updates one or more vitality properties for a field and notifies subscribers.
   * Lazy-initializes the vitality entry if it doesn't exist.
   *
   * @param fieldId - The field to update.
   * @param updates - Partial update object (e.g., `{ touched: true }` or `{ dirty: true, version: 1 }`).
   *
   * @example
   * stateManager.setVitality("name_id", { touched: true });
   * stateManager.setVitality("name_id", { dirty: true, version: 2 });
   */
  public setVitality(fieldId: string, updates: Partial<VitalityState[string]>) {
    if (!this.state.vitality[fieldId]) {
      // ── ARCHITECTURAL CONTRACT: Category Immutability ─────────────────
      // If we hit this lazy-init, we check if the field *should* have been pruned.
      // Virtual fields (repeater rows) are not in the registry but are valid inputs.
      const field = this.resolver?.resolveField(fieldId);
      const caps = (field as any)?.capabilities;

      if (process.env.NODE_ENV !== "production" && caps && !caps.hasVitality) {
        console.warn(
          `[StateManager] ⚠️ Field "${fieldId}" (${field?.type}) is attempting to update vitality but was pruned during initialization.`,
          "Pruned fields (missing hasVitality capability) do not support vitality state to optimize memory."
        );
      }
      // Lazy-init with safe defaults
      this.state.vitality[fieldId] = {
        touched: false,
        dirty: false,
        focused: false,
        version: 0,
        initialValue: undefined,
      };
    }
    Object.assign(this.state.vitality[fieldId], updates);
    this.notify();
  }

  /**
   * Updates performance metrics and notifies subscribers.
   */
  public setPerformance(updates: Partial<InternalFormState<T>["performance"]>) {
    Object.assign(this.state.performance, updates);
    this.notify();
  }

  /**
   * Applies a functional update against the current state tree and notifies subscribers.
   *
   * Used for arbitrary whole-state merges (e.g., `uiState`, `businessState` slices)
   * where a dedicated setter does not exist. The updater receives the current state
   * and must return the next state object.
   *
   * @param updater - `(prev) => next` state producer. Returning `prev` unchanged is a no-op.
   *
   * @example
   * stateManager.update((prev) => ({
   *   ...prev,
   *   uiState: { ...prev.uiState, theme: "dark" },
   * }));
   */
  public update(
    updater: (prev: InternalFormState<T>) => InternalFormState<T>
  ): void {
    const next = updater(this.state);
    if (next !== this.state) {
      this.state = next;
      this.notify();
    }
  }

  // ── Reactivity ─────────────────────────────────────────────────────────────

  /**
   * Registers a listener that is called whenever state changes.
   *
   * The listener receives the full `InternalFormState` reference.
   * Returns an unsubscribe function — call it in `useEffect` cleanup.
   *
   * @param listener - Callback invoked after every state mutation.
   * @returns Unsubscribe function.
   *
   * @example
   * const unsubscribe = form.subscribe((state) => {
   *   setFormState({ ...state }); // React re-render
   * });
   * useEffect(() => unsubscribe, []); // Cleanup on unmount
   */
  subscribe(listener: (state: InternalFormState<T>) => void) {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  /**
   * Registers a listener for a specific field's state changes.
   * Key to the "Fast" O(1) re-render architecture.
   */
  subscribeToField(
    fieldId: string,
    listener: (state: InternalFormState<T>) => void
  ) {
    if (!this.fieldSubscribers.has(fieldId)) {
      this.fieldSubscribers.set(fieldId, new Set());
    }
    this.fieldSubscribers.get(fieldId)!.add(listener);
    return () => {
      const listeners = this.fieldSubscribers.get(fieldId);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) this.fieldSubscribers.delete(fieldId);
      }
    };
  }

  // ── Repeater Row Management ────────────────────────────────────────────────

  /**
   * Explicitly allocates state slices for a dynamic repeater field instance.
   * Called by the Render Engine when a new row is materialized.
   */
  public registerRowState(fieldId: string, initialValue?: any) {
    const field = this.resolver?.resolveField(fieldId);
    if (!field) return;

    const caps = (field as any).capabilities || {
      hasValue: true,
      hasValidity: true,
      hasVisibility: true,
      hasView: true,
      hasVitality: true,
      derivesValidityFromChildren: false,
    };

    // Allocate Validity if required
    if (caps.hasValidity && !this.state.validity[fieldId]) {
      this.state.validity[fieldId] = { valid: true, errors: [] };
    }

    // Allocate Vitality if required
    if (caps.hasVitality && !this.state.vitality[fieldId]) {
      this.state.vitality[fieldId] = {
        touched: false,
        dirty: false,
        focused: false,
        version: 0,
        initialValue: initialValue ?? null,
      };
    }

    // Visibility and View are typically lazy-initialized in the resolution pipeline
    // but can be explicitly seeded here if needed.
    if (caps.hasVisibility && this.state.visibility[fieldId] === undefined) {
      this.state.visibility[fieldId] = true;
    }
  }

  /**
   * Pins or unpins a field's state slices in the 5V matrix.
   * Pinned fields survive unmounting in virtualized repeaters, tabs, and multi-step wizards.
   */
  public pinField(fieldId: string, pinned: boolean = true) {
    this.setVitality(fieldId, { pinned });
  }

  /**
   * Returns whether a field is currently pinned in the state matrix.
   */
  public isFieldPinned(fieldId: string): boolean {
    return !!this.state.vitality[fieldId]?.pinned;
  }

  /**
   * Tears down state slices for a dynamic field.
   * Prevents memory leaks by cleaning up the state matrix when a repeater row is removed.
   */
  public deregisterRowState(fieldId: string) {
    // Level 3 Handlers: If a field is pinned (e.g., virtualized out but still active),
    // we keep its state slices alive in the matrix.
    if (this.isFieldPinned(fieldId)) return;

    delete this.state.validity[fieldId];
    delete this.state.vitality[fieldId];
    delete this.state.visibility[fieldId];
    delete this.state.view[fieldId];
  }

  /**
   * Appends a new row to an array/repeater field.
   * Auto-assigns an immutable _rowId and returns it.
   */
  public appendRow(
    repeaterPath: string,
    initialRowData: Record<string, any> = {}
  ): string {
    const currentArray = this.getRawValue(repeaterPath) || [];
    const newArray = Array.isArray(currentArray) ? [...currentArray] : [];

    const rowId = `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const rowWithId = { ...initialRowData };
    try {
      Object.defineProperty(rowWithId, "_rowId", {
        value: rowId,
        writable: true,
        enumerable: false, // Excluded from JSON serialization
        configurable: true,
      });
    } catch {
      (rowWithId as any)._rowId = rowId;
    }
    newArray.push(rowWithId);

    this.setRawValue(repeaterPath, newArray);
    this.notifyField(repeaterPath);
    return rowId;
  }

  /**
   * Removes a row by index or stable _rowId.
   * Cleans up state slices for that row only, preserving all other rows' states.
   */
  public removeRow(repeaterPath: string, indexOrRowId: number | string): void {
    const currentArray = this.getRawValue(repeaterPath);
    if (!Array.isArray(currentArray)) return;

    let targetIndex = -1;
    let targetRowId = "";

    if (typeof indexOrRowId === "number") {
      targetIndex = indexOrRowId;
      targetRowId =
        currentArray[targetIndex]?._rowId || currentArray[targetIndex]?.id;
    } else {
      targetIndex = currentArray.findIndex(
        (row) =>
          String(row?._rowId) === indexOrRowId ||
          String(row?.id) === indexOrRowId
      );
      targetRowId = indexOrRowId;
    }

    if (targetIndex >= 0 && targetIndex < currentArray.length) {
      if (targetRowId) {
        const prefix = `${repeaterPath}__${targetRowId}__`;
        Object.keys(this.state.validity).forEach((key) => {
          if (key.startsWith(prefix)) this.deregisterRowState(key);
        });
      }

      const nextArray = [...currentArray];
      nextArray.splice(targetIndex, 1);
      this.setRawValue(repeaterPath, nextArray);
      this.notifyField(repeaterPath);
    }
  }

  /**
   * Moves a row from fromIndex to toIndex.
   * Reorders array elements without altering internal state slices of any row.
   */
  public moveRow(
    repeaterPath: string,
    fromIndex: number,
    toIndex: number
  ): void {
    const currentArray = this.getRawValue(repeaterPath);
    if (!Array.isArray(currentArray)) return;
    if (
      fromIndex < 0 ||
      fromIndex >= currentArray.length ||
      toIndex < 0 ||
      toIndex >= currentArray.length
    ) {
      return;
    }

    const nextArray = [...currentArray];
    const [movedItem] = nextArray.splice(fromIndex, 1);
    nextArray.splice(toIndex, 0, movedItem);

    this.setRawValue(repeaterPath, nextArray);
    this.notifyField(repeaterPath);
  }

  /**
   * Safely reads a nested property path from form values.
   */
  public getRawValue(path: string): any {
    return path.split(".").reduce((acc, part) => {
      if (acc === null || acc === undefined) return undefined;
      const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const arr = acc[arrayMatch[1]];
        return Array.isArray(arr) ? arr[Number(arrayMatch[2])] : undefined;
      }
      return acc[part];
    }, this.state.values as any);
  }

  /**
   * Initializes optimistic locking for the form.
   * Required for 10.0 ERP high-integrity data flows.
   */
  public initConcurrency(baseVersion: number, etag?: string) {
    this.state.concurrency = {
      version: 0,
      baseVersion,
      etag,
      conflicts: {},
    };
  }

  /**
   * Reports a server-side conflict discovered during submission or background sync.
   */
  public reportConflict(fieldId: string, serverValue: any, clientValue: any) {
    if (!this.state.concurrency) return;
    this.state.concurrency.conflicts = {
      ...this.state.concurrency.conflicts,
      [fieldId]: { serverValue, clientValue, fieldId },
    };
    this.notify();
  }

  /**
   * Creates a recursive development-mode `Proxy` that warns on direct mutation.
   *
   * **Performance note**: This creates new Proxy objects on every property access
   * (`get` trap recurses). It is intentionally gated behind `NODE_ENV === 'development'`
   * and should NEVER run in production.
   *
   * Handles array mutation methods (`push`, `pop`, `splice`, etc.) specially:
   * they are wrapped to fire an `onChange` notification after the array method runs.
   *
   * @param target   - The object to proxy (typically `state.values`).
   * @param onChange - Callback invoked when a set/mutation is detected.
   * @param path     - Accumulated property path for human-readable warning messages.
   * @returns A deep `Proxy<O>` that mirrors `target` but intercepts mutations.
   */
  private createDeepProxy<O extends object>(
    target: O,
    onChange: (path: string[], value: any) => void,
    path: string[] = []
  ): O {
    return new Proxy(target, {
      get: (obj, prop) => {
        const val = obj[prop as keyof O];

        // Intercept array mutation methods — they bypass the `set` trap
        if (
          Array.isArray(obj) &&
          [
            "push",
            "pop",
            "shift",
            "unshift",
            "splice",
            "sort",
            "reverse",
          ].includes(prop as string)
        ) {
          return function (this: any, ...args: any[]) {
            const result = (val as any).apply(this, args); // Run the original method
            onChange([...path], obj); // Notify of array mutation
            return result;
          };
        }

        // Recursively proxy nested objects for deep mutation detection
        if (typeof val === "object" && val !== null) {
          return this.createDeepProxy(val as object, onChange, [
            ...path,
            prop as string,
          ]);
        }
        return val;
      },
      set: (obj, prop, value) => {
        obj[prop as keyof O] = value; // Allow the set (so code doesn't break in dev)
        onChange([...path, prop as string], value); // Warn about the mutation
        return true;
      },
    });
  }
}
