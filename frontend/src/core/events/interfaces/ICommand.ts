/**
 * ICommand Interface (GoF Command Pattern)
 * Defines a contract for executable actions.
 */
export interface ICommand<T = void, R = void> {
  execute(context?: T): R;
}
