type CommandHandler = (data?: any) => void;

/**
 * CommandBus
 *
 * High-level event bus for application commands.
 * Decouples keyboard/mouse triggers from UI implementations.
 */
class CommandBus {
  private handlers: Map<string, CommandHandler[]> = new Map();

  /**
   * Subscribe to a command
   */
  on(commandId: string, handler: CommandHandler) {
    if (!this.handlers.has(commandId)) {
      this.handlers.set(commandId, []);
    }
    this.handlers.get(commandId)!.push(handler);
    return () => this.off(commandId, handler);
  }

  /**
   * Unsubscribe from a command
   */
  off(commandId: string, handler: CommandHandler) {
    const handlers = this.handlers.get(commandId);
    if (handlers) {
      this.handlers.set(
        commandId,
        handlers.filter((h) => h !== handler)
      );
    }
  }

  /**
   * Emit a command to all subscribers
   */
  emit(commandId: string, data?: any) {
    const handlers = this.handlers.get(commandId);
    if (handlers) {
      handlers.forEach((h) => h(data));
    }
  }
}

export const commandBus = new CommandBus();
