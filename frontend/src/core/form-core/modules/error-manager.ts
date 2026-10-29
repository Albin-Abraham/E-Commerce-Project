/**
 * @file error-manager.ts
 * @description Centralised write gateway for field validity/error state.
 *
 * ## Responsibility
 * `ErrorManager` is the **single write path** for all error mutations on the
 * form's `ValidityState`. No other module should write directly to
 * `stateManager.state.validity` — all error writes must go through here.
 *
 * This encapsulation allows:
 * - A single place to add cross-cutting logic (e.g., logging, telemetry, error
 *   transformation) without touching every callsite.
 * - Consistent state initialization (lazy-initializes `validity[fieldId]` on first write).
 * - A clean read API (`getErrors`, `isValid`) for colocated read access.
 *
 * ## Consumers
 * - {@link FormValidator} — calls `setErrors()` after running validation rules.
 * - {@link FormVisibility} — calls `clearErrors()` when a field becomes hidden.
 * - {@link FormCore} — exposes `setError()` / `setErrors()` as public API via delegation.
 */
import type { DetailedError } from "@form-core/int-types";

import type { FieldResolver } from "./resolver";
import { StateManager } from "./state-manager";

export class ErrorManager<T extends Record<string, any>> {
  /**
   * @param stateManager - The shared `StateManager`. ErrorManager reads and
   *   mutates `stateManager.state.validity` directly, then calls `notify()`.
   */
  constructor(
    private stateManager: StateManager<T>,
    private resolver?: FieldResolver
  ) {}

  /**
   * Writes a single error to a field, replacing any existing errors.
   *
   * Sets `valid: false` and replaces the errors array with `[error]`.
   * Lazy-initializes the validity entry if it doesn't exist yet.
   * Notifies all subscribers after the update.
   *
   * @param fieldId - The ID of the field to set the error on.
   * @param error   - The structured error to write.
   *
   * @example
   * errorManager.setError("name_id", {
   *   code: "required",
   *   message: "Name is required",
   *   fieldId: "name_id"
   * });
   */
  public setError(fieldId: string, error: DetailedError) {
    // Lazy-init: create the validity entry if it doesn't exist yet
    if (!this.stateManager.state.validity[fieldId]) {
      this.stateManager.state.validity[fieldId] = { valid: true, errors: [] };
    }

    this.stateManager.state.validity[fieldId].valid = false;
    this.stateManager.state.validity[fieldId].errors = [error]; // Replace — not append
    this.stateManager.setVitality(fieldId, { touched: true });
    this.stateManager.notifyField(fieldId);
    this.stateManager.notify();
  }

  /**
   * Writes multiple errors to a field, replacing any existing errors.
   *
   * Sets `valid: true` if `errors` is empty, `false` otherwise.
   * This is the **primary method** used by {@link FormValidator} after running all rules.
   *
   * @param fieldId - The ID of the field to update.
   * @param errors  - The complete list of errors. Pass `[]` to mark the field as valid.
   *
   * @example
   * // Mark field as valid (clear errors):
   * errorManager.setErrors("name_id", []);
   *
   * // Mark field as invalid with two errors:
   * errorManager.setErrors("name_id", [
   *   { code: "required", message: "Name is required", fieldId: "name_id" },
   *   { code: "minLength", message: "Name must be at least 2 chars", fieldId: "name_id" }
   * ]);
   */
  public setErrors(fieldId: string, errors: DetailedError[]) {
    // Lazy-init
    if (!this.stateManager.state.validity[fieldId]) {
      this.stateManager.state.validity[fieldId] = { valid: true, errors: [] };
    }

    this.stateManager.state.validity[fieldId].valid = errors.length === 0;
    this.stateManager.state.validity[fieldId].errors = errors;
    if (errors.length > 0) {
      this.stateManager.setVitality(fieldId, { touched: true });
    }

    // Rollup logic: If this is a child of a structural container (path: parent[0].child or parent__id__child),
    // sync the parent's validity if it derives validity from children.
    const arrayMatch = fieldId.match(/^(.+)\[(\d+)\]\.(.+)$/);
    const identityMatch = fieldId.match(/^(.+)__(.+)__(.+)$/);

    if (arrayMatch || identityMatch) {
      const parentIdOrName = (arrayMatch || identityMatch)![1];
      this.syncParentValidity(parentIdOrName);
    }

    this.stateManager.notifyField(fieldId);
    this.stateManager.notify();
  }

  /**
   * Aggregates the validity of all children into the parent container.
   * A parent is invalid if:
   * 1. It has its own validation errors (e.g., min items in a repeater).
   * 2. Any of its dynamic children (positional or identity-based) have errors.
   */
  private syncParentValidity(parentIdOrName: string) {
    if (!this.resolver) return;
    const parentField = this.resolver.resolveField(parentIdOrName);
    if (!parentField) return;

    const fieldType = this.resolver.getFieldType(parentField.id);
    if (!fieldType?.capabilities?.derivesValidityFromChildren) return;

    const parentId = parentField.id;
    if (!this.stateManager.state.validity[parentId]) {
      this.stateManager.state.validity[parentId] = { valid: true, errors: [] };
    }

    const currentParentErrors =
      this.stateManager.state.validity[parentId].errors;
    const hasOwnErrors = (currentParentErrors?.length || 0) > 0;

    // Check children: scan all validity entries that belong to this parent
    // Matches both positional "parent[0].child" and identity "parent__id__child"
    const hasChildErrors = Object.keys(this.stateManager.state.validity).some(
      (id) => {
        if (id === parentId) return false;
        const isPositional = id.startsWith(`${parentIdOrName}[`);
        const isIdentity = id.startsWith(`${parentIdOrName}__`);
        return (
          (isPositional || isIdentity) &&
          !this.stateManager.state.validity[id].valid
        );
      }
    );

    const isNowValid = !hasOwnErrors && !hasChildErrors;

    if (this.stateManager.state.validity[parentId].valid !== isNowValid) {
      this.stateManager.state.validity[parentId].valid = isNowValid;
      this.stateManager.notifyField(parentId);
    }
  }

  /**
   * Resets a field to a valid state by clearing all of its errors.
   * Syntactic sugar for `setErrors(fieldId, [])`.
   *
   * Called by {@link FormVisibility} when a field transitions from visible → hidden,
   * preventing phantom errors from blocking form submission on hidden fields.
   *
   * @param fieldId - The field ID to clear errors for.
   */
  public clearErrors(fieldId: string) {
    this.setErrors(fieldId, []);
  }

  /**
   * Sets the pending validation status for a field.
   * Consumed by FormValidator for async operations.
   */
  public setPending(fieldId: string, pending: boolean) {
    if (!this.stateManager.state.validity[fieldId]) {
      this.stateManager.state.validity[fieldId] = { valid: true, errors: [] };
    }
    this.stateManager.state.validity[fieldId].pending = pending;
    this.stateManager.notifyField(fieldId);
    this.stateManager.notify();
  }

  /**
   * Returns the current list of errors for a field.
   *
   * @param fieldId - The field ID to look up.
   * @returns Array of {@link DetailedError}s. Returns `[]` if the field has no entry.
   */
  public getErrors(fieldId: string): DetailedError[] {
    return this.stateManager.state.validity[fieldId]?.errors || [];
  }

  /**
   * Checks whether a field is currently valid (has no errors).
   *
   * A field with no validity entry is considered valid by default
   * (e.g., it has never been validated).
   *
   * @param fieldId - The field ID to check.
   * @returns `true` if the field is valid or has never been validated; `false` otherwise.
   */
  public isValid(fieldId: string): boolean {
    // If no validity entry exists, field is implicitly valid (never validated)
    return this.stateManager.state.validity[fieldId]?.valid ?? true;
  }
}
