/**
 * @file circuit-breaker.ts
 * @description Engine-level fault tolerance — catches and isolates failures
 * so a single broken field or middleware does not take down the entire form.
 *
 * ## States
 * - **CLOSED** — normal operation; all calls pass through.
 * - **OPEN** — failures detected; calls are degraded (return fallback values).
 * - **HALF_OPEN** — probe period; one call is allowed through to test recovery.
 *
 * ## Per-field granularity
 * Each field has its own breaker state so a misbehaving custom field component
 * does not degrade the entire form — only that specific field falls back.
 */

export type BreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface BreakerEntry {
  state: BreakerState;
  failureCount: number;
  lastFailureTime: number;
}

export interface CircuitBreakerOptions {
  /** Max consecutive failures before opening the circuit (default: 3) */
  threshold?: number;
  /** Milliseconds to wait before attempting recovery (default: 30000) */
  resetTimeoutMs?: number;
  /** Max half-open probes before giving up (default: 2) */
  maxHalfOpenProbes?: number;
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  threshold: 3,
  resetTimeoutMs: 30000,
  maxHalfOpenProbes: 2,
};

export class CircuitBreaker {
  private fields: Map<string, BreakerEntry> = new Map();
  private globalEntry: BreakerEntry = {
    state: "CLOSED",
    failureCount: 0,
    lastFailureTime: 0,
  };
  private halfOpenProbes = 0;
  private options: Required<CircuitBreakerOptions>;

  constructor(options?: CircuitBreakerOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /** Get the breaker state for a specific field (or global default). */
  getState(fieldId?: string): BreakerState {
    if (fieldId && this.fields.has(fieldId)) {
      const entry = this.fields.get(fieldId)!;
      if (entry.state === "OPEN" && this.shouldAttemptReset(entry)) {
        return "HALF_OPEN";
      }
      return entry.state;
    }
    if (
      this.globalEntry.state === "OPEN" &&
      this.shouldAttemptReset(this.globalEntry)
    ) {
      return "HALF_OPEN";
    }
    return this.globalEntry.state;
  }

  /** Returns true if the call should be allowed through (or probed). */
  isOpen(fieldId?: string): boolean {
    const state = this.getState(fieldId);
    if (state === "HALF_OPEN") {
      return !this.probeAllowed(fieldId);
    }
    return state === "OPEN";
  }

  /** Records a success — resets the breaker for the given field (or global if unspecified). */
  recordSuccess(fieldId?: string) {
    if (fieldId) {
      this.fields.delete(fieldId);
      // Field-level success: only reset global if it was also in a failed state
      // for the same field. Otherwise, leave global alone to avoid falsely
      // resetting the global circuit on unrelated field recoveries.
      return;
    }
    this.globalEntry = { state: "CLOSED", failureCount: 0, lastFailureTime: 0 };
    this.halfOpenProbes = 0;
  }

  /** Records a failure — may open the circuit. */
  recordFailure(fieldId?: string) {
    const entry = fieldId
      ? this.getOrCreateFieldEntry(fieldId)
      : this.globalEntry;

    entry.failureCount++;
    entry.lastFailureTime = Date.now();

    if (entry.failureCount >= this.options.threshold) {
      entry.state = "OPEN";
    }
  }

  /** Wrap an async operation with automatic circuit breaker protection. */
  async guard<T>(
    fn: () => Promise<T>,
    fallback: T,
    fieldId?: string
  ): Promise<T> {
    if (this.isOpen(fieldId)) {
      return fallback;
    }

    try {
      const result = await fn();
      this.recordSuccess(fieldId);
      return result;
    } catch (err) {
      this.recordFailure(fieldId);
      if (fieldId) {
        console.warn(
          `[CircuitBreaker] Field "${fieldId}" failed (${this.getOrCreateFieldEntry(fieldId).failureCount}/${this.options.threshold}):`,
          err
        );
      }
      return fallback;
    }
  }

  /** Resets all breakers to CLOSED. */
  reset() {
    this.fields.clear();
    this.globalEntry = { state: "CLOSED", failureCount: 0, lastFailureTime: 0 };
    this.halfOpenProbes = 0;
  }

  private getOrCreateFieldEntry(fieldId: string): BreakerEntry {
    if (!this.fields.has(fieldId)) {
      this.fields.set(fieldId, {
        state: "CLOSED",
        failureCount: 0,
        lastFailureTime: 0,
      });
    }
    return this.fields.get(fieldId)!;
  }

  private shouldAttemptReset(entry: BreakerEntry): boolean {
    return Date.now() - entry.lastFailureTime >= this.options.resetTimeoutMs;
  }

  private probeAllowed(_fieldId?: string): boolean {
    if (this.halfOpenProbes >= this.options.maxHalfOpenProbes) return false;
    this.halfOpenProbes++;
    return true;
  }
}

/** Singleton global circuit breaker for the form system. */
export const formCircuitBreaker = new CircuitBreaker();
