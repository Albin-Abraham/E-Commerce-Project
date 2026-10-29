/**
 * IEventStrategy Interface (GoF Strategy Pattern)
 * Defines a contract for specific event handling logic (Keyboard, Mouse, etc.)
 */
export interface IEventStrategy {
  readonly type: string;
  readonly throttleMs?: number;
  handle(event: Event): void;
}
