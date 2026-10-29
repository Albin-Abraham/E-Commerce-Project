/**
 * @file value-proxy.ts
 * @description Thin wrapper around lodash `get`/`set` for consistent, path-based
 * value read/write access throughout the engine.
 *
 * **Why a class instead of bare lodash calls?**
 * - Provides a single, mockable seam for testing (replace with a spy in unit tests).
 * - Allows future instrumentation (logging, telemetry) without touching all call sites.
 * - Makes the intent explicit: "this is a deliberate value access" vs. ad-hoc object indexing.
 *
 * Used by:
 * - {@link FormRuntime} — exposes `valueProxy` to all modules.
 * - {@link FormExecution} — calls `setValue` during field update pipeline.
 * - {@link FormValidator} — calls `getValue` to read the value before validating.
 * - {@link ReactFormAdapter} — calls `getValue` to bind the value to the UI prop.
 * - {@link FormVisibility} — calls `setValue` to null-out hidden field values.
 */
import { get, set } from "lodash-es";

export class ValueProxy {
  /**
   * Reads a value from a (potentially deeply nested) object using a dot-notation path.
   *
   * Delegates to lodash `get`, which handles:
   * - Nested objects: `"address.city"` → `obj.address.city`
   * - Array indices: `"items[0].name"` → `obj.items[0].name`
   * - Missing paths: returns `undefined` (never throws)
   *
   * @param target - The source object to read from (typically `InternalFormState.values`).
   * @param path   - Dot-notation string path or array of keys.
   *                 Examples: `"city"`, `"address.city"`, `"users[0].name"`
   * @returns The value at the given path, or `undefined` if the path doesn't exist.
   *
   * @example
   * const proxy = new ValueProxy();
   * proxy.getValue({ address: { city: "London" } }, "address.city"); // "London"
   * proxy.getValue({ items: ["a", "b"] }, "items[1]");               // "b"
   * proxy.getValue({}, "missing.path");                               // undefined
   */
  public getValue(target: any, path: string | string[]): any {
    if (!target) return undefined;
    return get(target, path);
  }

  /**
   * Writes a value into a (potentially deeply nested) object using a dot-notation path.
   *
   * Delegates to lodash `set`, which:
   * - Creates intermediate objects/arrays if they don't exist.
   * - Mutates `target` in-place (intentional — the engine manages immutability at the
   *   `StateManager` level via notifications, not via structural copying).
   *
   * @param target - The target object to mutate (typically `InternalFormState.values`).
   * @param path   - Dot-notation string path or array of keys.
   *                 Examples: `"city"`, `"address.city"`, `"users[0].name"`
   * @param value  - The value to write.
   *
   * @example
   * const proxy = new ValueProxy();
   * const data = {};
   * proxy.setValue(data, "address.city", "London");
   * // data => { address: { city: "London" } }
   *
   * proxy.setValue(data, "users[0].name", "Alice");
   * // data => { address: { city: "London" }, users: [{ name: "Alice" }] }
   */
  public setValue(target: any, path: string | string[], value: any): void {
    if (!target) return;
    set(target, path, value);
  }
}

// NOTE: This is a stateless utility class — it holds no data of its own.
// Instantiate once per FormRuntime and share it across all modules.
// If you need per-call instrumentation in the future, this is the right place to add it.
