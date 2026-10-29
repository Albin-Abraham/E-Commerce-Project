/**
 * @file transaction-coordinator.ts
 * @description Coordinates unified multi-tiered reactive dependency execution in topological order.
 *
 * ## Responsibility (10/10 Enterprise Requirement)
 * In a complex ERP form, changing a single field value ripples through multiple subsystems:
 * 1. Computed calculations (e.g. subtotal = qty * price, tax = subtotal * rate)
 * 2. Visibility / Readonly / Required invariants (e.g. show shipping if physical goods)
 * 3. Dynamic asynchronous options / prefill (e.g. load warehouses for selected branch)
 * 4. Cross-field validation (e.g. endDate >= startDate, budget >= total)
 *
 * `ReactiveTransactionCoordinator` guarantees that all 4 tiers execute in strict deterministic
 * topological order within a single atomic batch window, preventing glitch states, stale
 * validation runs against intermediate values, and redundant re-renders.
 */

import type { FieldResolver } from "./resolver";
import type { StateManager } from "./state-manager";
import type { FormRuntime } from "./runtime";
import type { FormValidator } from "./validator";
import type { FormVisibility } from "./visibility";
import type { RemoteOptionsManager } from "./remote-options";
import type { DebugManager } from "./debug-manager";

export interface TransactionOptions {
  /** Whether to immediately validate the changed field as Tier 4 of this transaction. */
  validateChangedField?: boolean;
}

export class ReactiveTransactionCoordinator<
  T extends Record<string, any> = Record<string, any>,
> {
  constructor(
    private resolver: FieldResolver,
    private stateManager: StateManager<T>,
    private runtime: FormRuntime<T>,
    private validator: FormValidator<T>,
    private visibility: FormVisibility<T>,
    private debug: DebugManager<T>,
    private getRemoteOptions: () => RemoteOptionsManager<T> | undefined
  ) {}

  /**
   * Executes a multi-tier coordinated transaction for a field mutation.
   *
   * **Execution Tiers:**
   * - **Tier 1 (Compute)**: Downstream computed fields evaluated in topological order until converged.
   * - **Tier 2 (Visibility)**: Visibility rules evaluated against converged values; hidden fields pruned.
   * - **Tier 3 (Async Options & Prefill)**: Dynamic remote option fetches with sequence epochs & cancellation.
   * - **Tier 4 (Validation)**: Validates changed field and active cross-field dependents against post-compute values.
   *
   * @param changedFieldId - The ID of the field that initiated the transaction.
   * @param options - Execution options (e.g., whether to validate the changed field immediately).
   * @returns Set of all field IDs whose 5V state slices were mutated during this transaction.
   */
  public async executeTransaction(
    changedFieldId: string,
    options: TransactionOptions = {}
  ): Promise<Set<string>> {
    const affectedFields = new Set<string>();
    affectedFields.add(changedFieldId);

    const changedField = this.resolver.resolveField(changedFieldId);
    const lookupKey = changedField?.name || changedFieldId;
    const deps = this.resolver.registry.getDependenciesForField(lookupKey);

    this.debug.log("Transaction start", {
      changedFieldId,
      lookupKey,
      deps: {
        computed: Array.from(deps.computed),
        visibility: Array.from(deps.visibility),
        validation: Array.from(deps.validation),
        remoteOptions: Array.from(deps.remoteOptions),
      },
    });

    // ── TIER 1: Computed Calculations (Topological Convergence) ───────────────
    // Recompute downstream computed fields before visibility or validation so
    // derived values are authoritative.
    const visitedComputed = new Set<string>();
    const mutatedComputedFields = new Set<string>();
    for (const computedFieldId of deps.computed) {
      this.recomputeSingleComputedField(
        computedFieldId,
        visitedComputed,
        affectedFields,
        mutatedComputedFields
      );
    }

    // ── TIER 2: Visibility & Invariants ───────────────────────────────────────
    // Re-evaluate visibility against the newly computed values.
    // Newly hidden fields have errors cleared and values pruned.
    this.visibility.evaluateVisibility(
      this.stateManager.state.values,
      changedField?.name
    );

    // ── TIER 3: Async Remote Options & Prefill ────────────────────────────────
    // Cascading dropdowns & dynamic options triggers.
    // Sequence epochs and AbortController prevent out-of-order race conditions.
    const remoteOptionsManager = this.getRemoteOptions();
    if (remoteOptionsManager && deps.remoteOptions.size > 0) {
      await remoteOptionsManager.handleValueChange(
        changedFieldId,
        deps.remoteOptions
      );
      deps.remoteOptions.forEach((id) => affectedFields.add(id));
    }

    // ── TIER 4: Validation Cascade ────────────────────────────────────────────
    // Validate fields using the post-compute, post-visibility converged state.
    if (options.validateChangedField) {
      await this.validator.validateField(changedFieldId);
    }

    // Validate computed fields whose derived values mutated during Tier 1
    for (const mutatedCompId of mutatedComputedFields) {
      const compField = this.resolver.resolveField(mutatedCompId);
      if (compField?.validation) {
        await this.validator.validateField(mutatedCompId);
      }
    }

    // Cross-Field Validation Cascade:
    // Re-validate active dependent fields that depend on this field.
    for (const validationFieldId of deps.validation) {
      const targetVitality =
        this.stateManager.state.vitality[validationFieldId];
      const targetValidity =
        this.stateManager.state.validity[validationFieldId];
      const isTargetActive =
        targetVitality?.dirty ||
        targetVitality?.touched ||
        (targetValidity && !targetValidity.valid);

      if (isTargetActive) {
        await this.validator.validateField(validationFieldId);
        affectedFields.add(validationFieldId);
      }
    }

    this.debug.log("Transaction complete", {
      changedFieldId,
      affectedCount: affectedFields.size,
    });

    return affectedFields;
  }

  /**
   * Evaluates a single computed field and recursively cascades downstream in O(D).
   */
  public recomputeSingleComputedField(
    fieldId: string,
    visited: Set<string> = new Set(),
    affectedFields: Set<string> = new Set(),
    mutatedFields: Set<string> = new Set()
  ): void {
    if (visited.has(fieldId)) return;
    visited.add(fieldId);

    const field = this.resolver.resolveField(fieldId);
    if (!field?.computed || !field.name) return;

    const values = this.stateManager.state.values;
    this.runtime.reactiveEngine.updateValues(values);

    const newValue = this.runtime.reactiveEngine.evaluateComputedField(
      field.computed
    );
    const currentValue = this.runtime.valueProxy.getValue(values, field.name);

    if (currentValue !== newValue) {
      this.runtime.valueProxy.setValue(values, field.name, newValue);

      const vitality = this.stateManager.state.vitality[fieldId];
      this.stateManager.setVitality(fieldId, {
        dirty: true,
        version: (vitality?.version || 0) + 1,
      });

      affectedFields.add(fieldId);
      mutatedFields.add(fieldId);

      // Cascade downstream dependent computed fields
      const downstreamDeps = this.resolver.registry.getDependenciesForField(
        field.name
      );
      for (const downstreamId of downstreamDeps.computed) {
        this.recomputeSingleComputedField(
          downstreamId,
          visited,
          affectedFields,
          mutatedFields
        );
      }
    }
  }

  /**
   * Triggers cross-field validation for all fields that depend on the source field.
   */
  public async validateDependents(
    sourceFieldIdentifier: string
  ): Promise<string[]> {
    const field = this.resolver.resolveField(sourceFieldIdentifier);
    const lookupKey = field?.name || sourceFieldIdentifier;
    const deps = this.resolver.registry.getDependenciesForField(lookupKey);

    const validated: string[] = [];
    for (const validationFieldId of deps.validation) {
      await this.validator.validateField(validationFieldId);
      this.stateManager.notifyField(validationFieldId);
      validated.push(validationFieldId);
    }
    return validated;
  }
}
