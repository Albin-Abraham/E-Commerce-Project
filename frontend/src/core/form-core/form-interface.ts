/**
 * @file form-interface.ts
 * @description The stable public contract for the form engine.
 *
 * ## Why this file exists
 * `FormCore` is the implementation. `IFormCore` is the **contract**.
 *
 * Consumers (hooks, adapters, tests) should depend on `IFormCore`, not
 * on the concrete `FormCore` class. This enforces:
 * - **ISP** — consumers only see the methods they need via narrowed sub-interfaces.
 * - **DIP** — modules import the abstraction, not the implementation.
 * - **LSP** — `Form` (the React facade) can now implement `IFormCore` via
 *   delegation without extending `FormCore`, eliminating the inheritance
 *   chain that caused the `getComponentProps` recursion bug.
 *
 * ## Sub-interface design
 * The full `IFormCore` is composed from three focused sub-interfaces:
 * | Interface         | Concern                                          |
 * |-------------------|--------------------------------------------------|
 * | `IFormQuery`      | Read-only state access (values, validity, etc.)  |
 * | `IFormMutation`   | State-changing operations (setValue, reset, etc.)|
 * | `IFormLifecycle`  | Subscriptions, field resolution, diagnostics     |
 */
import type {
  DetailedError,
  InternalFormState,
  NormalizedForm,
  ResolvedFieldProps,
  ValidityState,
  ViewState,
  VisibilityState,
  VitalityState,
} from "@form-core/int-types";
import type { AutocompletePath, FieldPath, FormField, PathValue } from "./domain";

// ── Sub-interface 1: Query (Read) ─────────────────────────────────────────────

/**
 * Read-only access to the form's 5V state matrix.
 * Safe to expose to components that must not mutate form state.
 */
export interface IFormQuery<
  T extends Record<string, any> = Record<string, any>,
> {
  readonly values: T;
  readonly validity: Readonly<ValidityState>;
  readonly visibility: Readonly<VisibilityState>;
  readonly view: Readonly<ViewState>;
  readonly vitality: Readonly<VitalityState>;
  readonly uiState?: Readonly<import("./int-types").UIState>;
  readonly businessState?: Readonly<import("./int-types").BusinessState>;
  readonly isDirty: boolean;
  readonly isValid: boolean;
  readonly version: number;
  readonly state: InternalFormState<T>;
  readonly definition: NormalizedForm;
  getPayload(): Partial<T>;
  getComponentProps(fieldId: AutocompletePath<T>): ResolvedFieldProps;
  resolveField(identifier: AutocompletePath<T>): FormField | undefined;
  getValue<P extends FieldPath<T>>(path: P): PathValue<T, P>;
  getValue(path: string): unknown;
}

// ── Sub-interface 2: Mutation ─────────────────────────────────────────────────

/**
 * State-mutating operations.
 * Only expose to components/hooks that legitimately need to write form state.
 */
export interface RegisterOptions {
  valueAsNumber?: boolean;
  valueAsDate?: boolean;
}

export interface RegisterReturn {
  name: string;
  onChange: (event: any) => Promise<void> | void;
  onBlur: (event: any) => void;
  ref: (el: any) => void;
  defaultValue?: any;
}

export interface IFormMutation<
  T extends Record<string, any> = Record<string, any>,
> {
  setValue<P extends FieldPath<T>>(name: P, value: PathValue<T, P>): Promise<void>;
  setValue(name: string, value: unknown): Promise<void>;
  setTouched(fieldId: AutocompletePath<T>): void;
  setError(fieldId: AutocompletePath<T>, error: DetailedError): void;
  setErrors(errors: DetailedError[]): void;
  setVitality(
    fieldId: AutocompletePath<T>,
    vitality: Partial<InternalFormState<T>["vitality"][string]>
  ): void;
  setUIState(uiState: Partial<import("./int-types").UIState>): void;
  setBusinessStage(stage: string): void;
  reset(
    initialValues?: Partial<T>,
    options?: {
      keepTouched?: boolean | string[];
      keepDirty?: boolean | string[];
      keepValues?: string[];
    }
  ): void;
  submit(): Promise<boolean>;
  validateFields(fieldIds: string[]): Promise<boolean>;
  batch(fn: () => void | Promise<void>): Promise<void>;
  appendRow(
    repeaterPath: AutocompletePath<T> | string,
    initialRowData?: Record<string, any>
  ): string;
  removeRow(
    repeaterPath: AutocompletePath<T> | string,
    indexOrRowId: number | string
  ): void;
  moveRow(
    repeaterPath: AutocompletePath<T> | string,
    fromIndex: number,
    toIndex: number
  ): void;
  register(
    name: AutocompletePath<T> | string,
    options?: RegisterOptions
  ): RegisterReturn;
}

// ── Sub-interface 3: Lifecycle ────────────────────────────────────────────────

/**
 * Subscription and lifecycle management.
 */
export interface IFormLifecycle<
  T extends Record<string, any> = Record<string, any>,
> {
  subscribe(listener: (state: InternalFormState<T>) => void): () => void;
  subscribeToField(fieldId: AutocompletePath<T>, listener: () => void): () => void;
  use(
    fn: (ctx: { form: IFormCore<T>; fieldId?: string }) => void | Promise<void>
  ): void;
  setLocale(locale: string): Promise<void>;
  // ERP extensions
  pinField(fieldId: AutocompletePath<T>, pinned?: boolean): void;
  initConcurrency(baseVersion: number, etag?: string): void;
  reportConflict(fieldId: AutocompletePath<T>, serverValue: unknown, clientValue: unknown): void;
  clearDraft?(): Promise<void>;
  restoreDraft?(): Promise<boolean>;
  saveDraft?(): Promise<void>;
  destroy?(): void;
}

// ── Composed interface ────────────────────────────────────────────────────────

/**
 * Full form engine contract.
 * Composed from the three focused sub-interfaces.
 * FormCore, Form, and any mock/test double must implement this.
 */
export interface IFormCore<T extends Record<string, any> = Record<string, any>>
  extends IFormQuery<T>, IFormMutation<T>, IFormLifecycle<T> {
  /**
   * The validation mode currently active.
   * @see {@link ValidationMode}
   */
  getValidationMode(): string;
  /**
   * Proxied value accessor (for path-based reads used by field hooks).
   */
  readonly valueProxy: {
    getValue<P extends FieldPath<T>>(values: T, path: P): PathValue<T, P>;
    getValue(values: unknown, path: string): unknown;
    setValue(values: unknown, path: string, value: unknown): void;
  };
  /**
   * Whether the form engine is operating in degraded mode
   * due to circuit breaker activation.
   */
  readonly isDegraded: boolean;
  /**
   * Resets the circuit breaker, allowing degraded forms to recover.
   */
  resetCircuitBreaker(): void;
}
