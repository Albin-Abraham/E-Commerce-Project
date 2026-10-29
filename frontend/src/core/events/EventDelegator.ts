import type { IEventStrategy } from "./interfaces/IEventStrategy";

/**
 * EventDelegator (GoF Mediator / Observer Pattern)
 * Central orchestrator that manages event delegation strategies.
 * Respects Dependency Inversion by accepting an EventTarget.
 */
export class EventDelegator {
  private strategies: Map<string, IEventStrategy> = new Map();
  private isListening: boolean = false;
  private target: EventTarget;

  constructor(target: EventTarget = window) {
    this.target = target;
  }

  /**
   * Registers a handling strategy for a specific event type.
   */
  registerStrategy(strategy: IEventStrategy): this {
    this.strategies.set(strategy.type, strategy);
    return this;
  }

  /**
   * Starts listening for events on the target.
   */
  start(): void {
    if (this.isListening) return;

    this.strategies.forEach((_, type) => {
      this.target.addEventListener(type, this.handleEvent);
    });

    this.isListening = true;
    console.log(
      "[EventDelegator] Started listening for:",
      Array.from(this.strategies.keys())
    );
  }

  /**
   * Stops listening for events.
   */
  stop(): void {
    if (!this.isListening) return;

    this.strategies.forEach((_, type) => {
      this.target.removeEventListener(type, this.handleEvent);
    });

    this.isListening = false;
    console.log("[EventDelegator] Stopped listening.");
  }

  private lastExecutionTimes: Map<string, number> = new Map();
  private activeRafs: Map<string, number> = new Map();

  /**
   * Central event handler that delegates to appropriate strategies.
   * Incorporates rAF and Time-based throttling for high-frequency events.
   */
  private handleEvent = (event: Event): void => {
    const strategy = this.strategies.get(event.type);
    if (!strategy) return;

    if (strategy.throttleMs !== undefined) {
      const now = performance.now();
      const lastExecution = this.lastExecutionTimes.get(event.type) || 0;

      if (now - lastExecution < strategy.throttleMs) {
        return; // Dropped by throttle limit
      }
      this.lastExecutionTimes.set(event.type, now);

      // Align execution with the browser's paint cycle via requestAnimationFrame
      if (!this.activeRafs.has(event.type)) {
        const rafId = requestAnimationFrame(() => {
          strategy.handle(event);
          this.activeRafs.delete(event.type);
        });
        this.activeRafs.set(event.type, rafId);
      }
    } else {
      // Synchronous execution for zero-latency events (clicks, keydown)
      strategy.handle(event);
    }
  };
}
