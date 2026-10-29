/**
 * @file time-travel.ts
 * @description Event-sourced time-travel state manager and telemetry replay module for @form-core.
 * Enables step-by-step undo, redo, snapshot branching, and telemetry history export.
 */

export interface TimeTravelSnapshot<T = Record<string, any>> {
  id: string;
  timestamp: number;
  step: number;
  values: T;
  action?: string;
  errors?: Record<string, string[]>;
}

export interface TimeTravelStoreOptions {
  maxHistory?: number;
  initialAction?: string;
}

export class TimeTravelStore<T extends Record<string, any> = Record<string, any>> {
  private history: TimeTravelSnapshot<T>[] = [];
  private pointer: number = -1;
  private maxHistory: number;
  private listeners: Set<(snapshot: TimeTravelSnapshot<T>) => void> = new Set();

  constructor(initialValues: T = {} as T, options: TimeTravelStoreOptions = {}) {
    this.maxHistory = options.maxHistory ?? 100;
    this.record(initialValues, options.initialAction ?? "INITIALIZE");
  }

  /**
   * Current snapshot index.
   */
  public get currentIndex(): number {
    return this.pointer;
  }

  /**
   * Total number of recorded snapshots.
   */
  public get length(): number {
    return this.history.length;
  }

  /**
   * Whether undo is possible.
   */
  public get canUndo(): boolean {
    return this.pointer > 0;
  }

  /**
   * Whether redo is possible.
   */
  public get canRedo(): boolean {
    return this.pointer < this.history.length - 1;
  }

  /**
   * Get the current snapshot.
   */
  public get currentSnapshot(): TimeTravelSnapshot<T> | undefined {
    return this.history[this.pointer];
  }

  /**
   * Record a new mutation into the time-travel history.
   * If the user previously undid mutations and then records a new mutation,
   * subsequent history is truncated (standard branch behavior).
   */
  public record(
    values: T,
    action: string = "MUTATE",
    errors?: Record<string, string[]>
  ): TimeTravelSnapshot<T> {
    const nextStep = this.pointer + 1;
    const snapshot: TimeTravelSnapshot<T> = {
      id: `snap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      step: nextStep,
      values: JSON.parse(JSON.stringify(values)),
      action,
      errors: errors ? JSON.parse(JSON.stringify(errors)) : undefined,
    };

    // If pointer is not at the tail, truncate future branch
    if (this.pointer < this.history.length - 1) {
      this.history = this.history.slice(0, this.pointer + 1);
    }

    this.history.push(snapshot);

    // Enforce max history bounds
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.pointer = this.history.length - 1;
    this.notify(snapshot);
    return snapshot;
  }

  /**
   * Step backward one mutation.
   */
  public undo(): T | undefined {
    if (!this.canUndo) return undefined;
    this.pointer -= 1;
    const snap = this.history[this.pointer];
    this.notify(snap);
    return JSON.parse(JSON.stringify(snap.values));
  }

  /**
   * Step forward one mutation.
   */
  public redo(): T | undefined {
    if (!this.canRedo) return undefined;
    this.pointer += 1;
    const snap = this.history[this.pointer];
    this.notify(snap);
    return JSON.parse(JSON.stringify(snap.values));
  }

  /**
   * Jump directly to an arbitrary step index.
   */
  public jumpTo(index: number): T | undefined {
    if (index < 0 || index >= this.history.length) return undefined;
    this.pointer = index;
    const snap = this.history[this.pointer];
    this.notify(snap);
    return JSON.parse(JSON.stringify(snap.values));
  }

  /**
   * Subscribe to snapshot transitions (DevTools, UI status, replay listeners).
   */
  public subscribe(listener: (snapshot: TimeTravelSnapshot<T>) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Export complete session history as JSON telemetry.
   */
  public exportHistory(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalSnapshots: this.history.length,
        currentStep: this.pointer,
        history: this.history,
      },
      null,
      2
    );
  }

  /**
   * Clear all history and reset with optional baseline values.
   */
  public reset(baselineValues: T = {} as T): void {
    this.history = [];
    this.pointer = -1;
    this.record(baselineValues, "RESET");
  }

  private notify(snapshot: TimeTravelSnapshot<T>): void {
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

/**
 * Factory helper for ergonomic initialization.
 */
export function createTimeTravelStore<T extends Record<string, any>>(
  initialValues: T = {} as T,
  options?: TimeTravelStoreOptions
): TimeTravelStore<T> {
  return new TimeTravelStore<T>(initialValues, options);
}
