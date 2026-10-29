import type { ICommand } from "./ICommand";

/**
 * LogCommand
 * Simple GoF Command implementation that logs a message to the console.
 */
export class LogCommand implements ICommand<any, void> {
  constructor(private message: string) {}

  execute(context?: any): void {
    console.log(`[LogCommand] ${this.message}`, context);
  }
}
