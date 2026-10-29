/**
 * @file runtime.ts
 * @description Groups the three "proxy" utilities into a single Runtime container.
 *
 * ## Why a Runtime wrapper?
 * `ValueProxy`, `ConditionProxy`, and `FlowProxy` are all stateless/near-stateless
 * utilities that multiple modules need to share. Rather than each module individually
 * constructing or importing them, `FormRuntime` creates them once and provides a
 * single shared reference — avoiding duplicate instances and ensuring all modules
 * use the same `ConditionProxy` snapshot (updated via `updateValues`).
 *
 * ## Exposes
 * - `valueProxy`    — Read/write form values by dot-notation path.
 * - `conditionProxy` — Evaluate field visibility conditions against current values.
 * - `flowProxy`     — Compute next/last step for wizard navigation.
 *
 * ## Used By
 * - {@link FormCore} — exposes all three proxies as `form.valueProxy`, `form.conditionProxy`, `form.flow`.
 * - {@link FormValidator} — uses `valueProxy` to read field values before validation.
 * - {@link FormVisibility} — uses `conditionProxy` + `valueProxy` for evaluation and side effects.
 * - {@link FormExecution} — uses `valueProxy` to write values during the update pipeline.
 * - {@link ReactFormAdapter} — uses `valueProxy` to bind values to component props.
 */
import { ConditionProxy } from "../condition-proxy";
import { FlowProxy } from "../flow-proxy";
import { ValueProxy } from "../value-proxy";
import { FieldRegistry } from "./field-registry";
import { ReactiveEngine } from "./reactive-engine";
import { StateManager } from "./state-manager";

export class FormRuntime<T extends Record<string, any>> {
  /** Shared value accessor (get/set by path). Stateless — safe to share. */
  public valueProxy: ValueProxy;
  /**
   * Shared condition evaluator. Holds an internal snapshot of the current
   * values — must be updated via `conditionProxy.updateValues(values)` before
   * each evaluation pass (done by {@link FormVisibility.evaluateVisibility}).
   */
  public conditionProxy: ConditionProxy;
  /**
   * Evaluates string-based ReactiveValue and ComputedField expressions.
   */
  public reactiveEngine: ReactiveEngine;
  /**
   * Shared wizard navigation helper. Reads values lazily via a callback
   * to always have the latest snapshot without stale closures.
   */
  public flowProxy: FlowProxy;

  /**
   * @param registry      - The normalized form definition. Passed to `FlowProxy`
   *   for section metadata (nextStep, rootSections).
   * @param stateManager  - Provides the initial values for `ConditionProxy` at
   *   construction, and a lazy getter (`() => state.values`) for `FlowProxy`.
   */
  constructor(
    private registry: FieldRegistry,
    private stateManager: StateManager<T>
  ) {
    // ValueProxy is fully stateless — constructed once and shared
    this.valueProxy = new ValueProxy();

    // ConditionProxy initialized with current values snapshot.
    // Updated on every evaluation pass via updateValues().
    this.conditionProxy = new ConditionProxy(this.stateManager.state.values);

    // ReactiveEngine for formula evaluation
    this.reactiveEngine = new ReactiveEngine(this.stateManager.state.values);

    // FlowProxy uses a lazy callback so it always reads the latest values
    // without capturing a stale snapshot at construction time.
    this.flowProxy = new FlowProxy(
      this.registry.definition,
      () => this.stateManager.state.values, // Lazy: reads fresh values at call time
      () => this.stateManager.state.visibility // Lazy: reads fresh visibility at call time
    );
  }

  /**
   * Returns the current form values.
   *
   * Delegates to `stateManager.state.values` — the raw (non-proxied) values.
   * This is used internally by modules that need clean read access without the
   * dev-mode mutation proxy overhead.
   *
   * @returns The current `ValuesState<T>` object.
   */
  public getValues(): T {
    return this.stateManager.state.values;
  }
}
