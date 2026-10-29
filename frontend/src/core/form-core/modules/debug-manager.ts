/**
 * @file debug-manager.ts
 * @description Development-mode diagnostics and logging for the form engine.
 *
 * ## Responsibility
 * `DebugManager` provides a structured, opt-in logging mechanism for tracing
 * form engine activity (value changes, validation calls, middleware execution).
 *
 * Logging is **disabled by default** (`debug.isEnabled = false`).
 * Enable it at runtime via {@link enable} to start capturing logs.
 *
 * ## Design Choices
 * - Logs are stored as entries in `state.debug.logs` — making them inspectable
 *   via React DevTools or a debug panel without needing `console.log` calls scattered
 *   throughout the engine.
 * - `notify()` is deliberately **NOT called** after each `log()` to avoid flooding
 *   subscribers with re-renders on every logged action. If you need a live debug
 *   panel, call `notify()` manually or poll `debug.logs` on a timer.
 *
 * ## Used By
 * - {@link FormExecution.setValue} — logs every field value change.
 * - Any module that receives a `DebugManager` reference can call `log()`.
 * - External consumers can call `form.debugManager.enable()` to activate logging.
 */
import { StateManager } from "./state-manager";

export class DebugManager<T extends Record<string, any>> {
  /**
   * @param stateManager - Used to read `debug.isEnabled` and write to `debug.logs`.
   *   Also calls `notify()` when the enabled flag changes.
   */
  constructor(private stateManager: StateManager<T>) {}

  /**
   * Appends a structured log entry to `state.debug.logs` if logging is enabled.
   *
   * Log entries are stored as `{ timestamp, message, data }` objects.
   * Does nothing if `debug.isEnabled === false` (the default).
   *
   * **Note**: Does NOT call `stateManager.notify()` after logging to prevent
   * a re-render on every logged action. See class-level note above.
   *
   * @param message - Short description of the action (e.g., `"setValue"`, `"validate"`).
   * @param data    - Optional additional context object (e.g., `{ fieldIdentifier, value }`).
   *
   * @example
   * debugManager.log("setValue", { fieldIdentifier: "name", value: "Alice" });
   * // Appended to state.debug.logs:
   * // { timestamp: 1708512000000, message: "setValue", data: { fieldIdentifier: "name", value: "Alice" } }
   */
  public log(message: string, data?: any) {
    // Early exit if debug logging is off — zero overhead in normal operation
    if (!this.stateManager.state.debug?.isEnabled) return;

    this.stateManager.state.debug.logs.push({
      timestamp: Date.now(),
      message,
      data,
    });

    // Intentionally NOT notifying subscribers here.
    // Use enable()/disable() transitions to trigger re-renders, not every log entry.
    // this.stateManager.notify(); // ← uncomment only if you need live log streaming
  }

  /**
   * Enables or disables debug logging.
   *
   * When enabled, all subsequent `log()` calls will append entries to `state.debug.logs`.
   * Fires `stateManager.notify()` so subscribers (debug panels) can react to the
   * enabled/disabled state change.
   *
   * @param enable - `true` to start capturing logs (default); `false` to stop.
   *
   * @example
   * // Enable in development:
   * form.debugManager.enable();
   *
   * // Disable after debugging:
   * form.debugManager.enable(false);
   *
   * // Read captured logs:
   * console.log(form.state.debug.logs);
   */
  public enable(enable = true) {
    if (this.stateManager.state.debug) {
      this.stateManager.state.debug.isEnabled = enable;
      this.stateManager.notify(); // Notify: debug panel can re-render with new enabled state
    }
  }
}
