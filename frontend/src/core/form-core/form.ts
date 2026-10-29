/**
 * @file form.ts
 * @description The `Form` facade — the primary entry point for React applications.
 *
 * ## Architecture (Composition over Inheritance)
 *
 * `Form` now uses **composition** — it holds a `FormCore` instance internally
 * and delegates all method calls to it. It does NOT extend `FormCore`.
 *
 * ### Why this matters (LSP fix)
 * Previously `Form extends FormCore` and overrode `getComponentProps()`.
 * The `ReactFormAdapter` held a reference to `this.core` (the `Form` instance),
 * so calling `this.core.getComponentProps()` recursed back into the override —
 * a Liskov Substitution Principle violation that caused a `RangeError`.
 *
 * With composition, `Form` passes the inner `FormCore` directly to the adapter.
 * The adapter calls `FormCore.getComponentProps()` (no override, no recursion),
 * then enriches the result with React handlers.
 *
 * ```
 * Form
 *   ├── engine: FormCore           ← pure headless engine
 *   └── adapter: ReactFormAdapter  ← receives engine (NOT Form)
 *         └── engine.getComponentProps() ← direct, no recursion
 * ```
 *
 * ## When to use `Form` vs `FormCore`
 * | Use Case                                       | Use            |
 * |------------------------------------------------|----------------|
 * | React component-driven forms (standard usage)  | `Form`         |
 * | Headless, framework-agnostic, or testing       | `FormCore`     |
 * | Custom adapter (non-React, Vue, native)        | `FormCore` + custom adapter |
 *
 * ## Usage
 * ```typescript
 * const form = new Form(definition, { email: "alice@example.com" });
 *
 * // Get merged React props for a field component:
 * const props = form.getComponentProps("email_field_id");
 * // → { id, name, label, value, error, onChange, onBlur, ... }
 *
 * // Subscribe to state changes in a React hook:
 * form.subscribe(setState);
 *
 * // Submit and validate:
 * const isValid = await form.submit();
 * ```
 *
 * ## Backward Compatibility
 * The public API surface is identical to the previous `extends FormCore` shape.
 * All consumer code (`form.values`, `form.setValue`, `form.submit`, etc.) works
 * unchanged — the implementation changed, the contract did not.
 */
import type { FormDefinition } from "./domain";
import type { FieldPath, PathValue } from "./domain/paths";

import { FormCore } from "./engine";
import type { FormCoreOptions } from "./engine";
import type { IFormCore } from "./form-interface";
import { ReactFormAdapter } from "./react-adapter";
import type { ValidationMessageConfig } from "./validation-proxy";

export { FormCore, ReactFormAdapter };
export type { IFormCore };
export type {
  InternalFormState,
  ValuesState,
  ValidityState,
  VisibilityState,
  ViewState,
  VitalityState,
  DetailedError,
} from "./engine";

// ============================================================================
//  FORM (FACADE) — Explicit delegation, IFormCore implementation
// ============================================================================

/**
 * The primary entry point for React-driven forms.
 *
 * **Implements `IFormCore<T>`** via explicit delegation to an internal `FormCore` instance.
 * Does NOT extend `FormCore` — composition prevents LSP violations.
 * Does NOT use Proxy — explicit delegation improves debugging and performance.
 *
 * @template T - The typed form data shape. Defaults to `Record<string, any>`.
 */
export class Form<
  T extends Record<string, any> = Record<string, any>,
> implements IFormCore<T> {
  // ── Private implementation ─────────────────────────────────────────────────
  /** The headless engine. Passed directly to the adapter (NOT `this`). */
  public readonly engine: FormCore<T>;
  /** The React bridge. Receives `engine` — no `Form` reference, no recursion. */
  private readonly adapter: ReactFormAdapter<T>;

  constructor(
    definition: FormDefinition,
    initialValues?: Partial<T>,
    options?: FormCoreOptions & { messageConfig?: ValidationMessageConfig }
  ) {
    this.engine = new FormCore<T>(definition, initialValues, options);
    // Pass the engine directly — adapter never calls Form.getComponentProps
    this.adapter = new ReactFormAdapter<T>(this.engine);

    // Set the facade option reference on the engine so callbacks get this Form instance
    this.engine.options.facade = this as unknown as IFormCore<any>;
  }

  // ── IFormQuery delegates ───────────────────────────────────────────────────

  get values(): T {
    return this.engine.values;
  }
  getPayload(): Partial<T> {
    return this.engine.getPayload();
  }
  get validity() {
    return this.engine.validity;
  }
  get visibility() {
    return this.engine.visibility;
  }
  get view() {
    return this.engine.view;
  }
  get vitality() {
    return this.engine.vitality;
  }
  get isDirty(): boolean {
    return this.engine.isDirty;
  }
  get isValid(): boolean {
    return this.engine.isValid;
  }
  get version(): number {
    return this.engine.version;
  }
  get structuralVersion(): number {
    return this.engine.structuralVersion;
  }
  get isDegraded(): boolean {
    return this.engine.isDegraded;
  }
  get canUndo(): boolean {
    return this.engine.canUndo;
  }
  get canRedo(): boolean {
    return this.engine.canRedo;
  }
  get state() {
    return this.engine.state;
  }
  get valueProxy() {
    return this.engine.valueProxy;
  }
  get definition() {
    return this.engine.definition;
  }
  get renderTree() {
    return this.engine.renderTree;
  }
  get flow() {
    return this.engine.flow;
  }

  resolveField(identifier: string) {
    return this.engine.resolveField(identifier);
  }

  getValue<P extends FieldPath<T>>(path: P): PathValue<T, P>;
  getValue(path: string): unknown;
  getValue(path: string): unknown {
    return this.engine.getValue(path);
  }

  /**
   * Returns React-ready merged props for a field, sourced from the adapter's cache.
   * The adapter calls `engine.getComponentProps()` directly — no override recursion.
   */
  getComponentProps(fieldId: string): import("./int-types").ResolvedFieldProps {
    return this.adapter.getComponentProps(fieldId) as unknown as import("./int-types").ResolvedFieldProps;
  }

  // ── IFormMutation delegates ────────────────────────────────────────────────

  setValue<P extends FieldPath<T>>(name: P, value: PathValue<T, P>): Promise<void>;
  setValue(name: string, value: unknown): Promise<void>;
  setValue(name: string, value: unknown): Promise<void> {
    return this.engine.setValue(name, value);
  }
  setTouched(fieldId: string) {
    return this.engine.setTouched(fieldId);
  }
  setError(fieldId: string, error: any) {
    return this.engine.setError(fieldId, error);
  }
  setErrors(errors: any[]) {
    return this.engine.setErrors(errors);
  }
  setVitality(fieldId: string, vitality: any) {
    return this.engine.setVitality(fieldId, vitality);
  }
  setUIState(
    uiState: Partial<import("./int-types").UIState>
  ): void {
    return this.engine.setUIState(uiState);
  }
  setBusinessStage(stage: string): void {
    return this.engine.setBusinessStage(stage);
  }
  reset(initialValues?: Partial<T>, options?: any) {
    return this.engine.reset(initialValues, options);
  }
  submit() {
    return this.engine.submit();
  }
  validateFields(fieldIds: string[]) {
    return this.engine.validateFields(fieldIds);
  }
  setHiddenFields(ids: string[]) {
    return this.engine.setHiddenFields(ids);
  }
  batch(fn: () => void | Promise<void>): Promise<void> {
    return this.engine.batch(fn);
  }
  appendRow(repeaterPath: string, initialRowData?: Record<string, any>): string {
    return this.engine.appendRow(repeaterPath, initialRowData);
  }
  removeRow(repeaterPath: string, indexOrRowId: number | string): void {
    return this.engine.removeRow(repeaterPath, indexOrRowId);
  }
  moveRow(repeaterPath: string, fromIndex: number, toIndex: number): void {
    return this.engine.moveRow(repeaterPath, fromIndex, toIndex);
  }
  register(
    name: string,
    options?: import("./form-interface").RegisterOptions
  ): import("./form-interface").RegisterReturn {
    return this.engine.register(name, options);
  }
  focusField(fieldIdentifier: string): boolean {
    return this.engine.focusField(fieldIdentifier);
  }

  // ── IFormLifecycle delegates ───────────────────────────────────────────────

  subscribe(listener: (state: any) => void) {
    return this.engine.subscribe(listener);
  }
  subscribeToField(fieldId: string, listener: () => void) {
    return this.engine.subscribeToField(fieldId, listener);
  }
  use(
    fn: (ctx: { form: IFormCore<T>; fieldId: string }) => void | Promise<void>
  ) {
    return this.engine.use(fn as any);
  }
  setLocale(locale: string) {
    return this.engine.setLocale(locale);
  }
  pinField(fieldId: string, pinned?: boolean) {
    return this.engine.pinField(fieldId, pinned);
  }
  initConcurrency(baseVersion: number, etag?: string) {
    return this.engine.initConcurrency(baseVersion, etag);
  }
  reportConflict(fieldId: string, serverValue: any, clientValue: any) {
    return this.engine.reportConflict(fieldId, serverValue, clientValue);
  }
  getValidationMode() {
    return this.engine.getValidationMode();
  }
  resetCircuitBreaker() {
    return this.engine.resetCircuitBreaker();
  }
  undo() {
    return this.engine.undo();
  }
  redo() {
    return this.engine.redo();
  }
  get persistence() {
    return this.engine.persistence;
  }
  clearDraft() {
    return this.engine.clearDraft();
  }
  restoreDraft() {
    return this.engine.restoreDraft();
  }
  saveDraft() {
    return this.engine.saveDraft();
  }
  destroy() {
    return this.engine.destroy();
  }

  // ── External Store Bridge ──────────────────────────────────────────────────

  /**
   * Returns `{ subscribe, getSnapshot, getServerSnapshot }` for `useSyncExternalStore`.
   * Subscribes to global form state changes.
   */
  toSyncExternalStore() {
    return this.engine.toSyncExternalStore();
  }

  /**
   * Returns `{ subscribe, getSnapshot }` for a single field's props.
   * Atomic per-field subscription — only re-renders when this field changes.
   */
  toFieldSyncExternalStore(fieldId: string) {
    return this.engine.toFieldSyncExternalStore(fieldId);
  }

  /**
   * Returns `{ subscribe, getSnapshot }` for a derived slice of form state.
   * Only re-renders when the selected slice changes (identity check).
   */
  toSliceSyncExternalStore<TSlice>(selector: (state: any) => TSlice) {
    return this.engine.toSliceSyncExternalStore(selector);
  }

  // ── Advanced module access (preserved for power users / tests) ─────────────
  /** @advanced Direct access to the headless engine. Use for testing or custom adapters. */
  get core(): FormCore<T> {
    return this.engine;
  }
  get resolver() {
    return this.engine.resolver;
  }
  get stateManager() {
    return this.engine.stateManager;
  }
  get validator() {
    return this.engine.validator;
  }
  get execution() {
    return this.engine.execution;
  }
  get repeaterFactory() {
    return this.engine.repeaterFactory;
  }
  get remoteOptions() {
    return this.engine.remoteOptions;
  }
  get visibilityEngine() {
    return this.engine.visibilityEngine;
  }
  get registry() {
    return this.engine.registry;
  }
}