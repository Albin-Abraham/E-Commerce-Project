type Handler<T = any> = (data: T) => void;

class EventBus {
  private events: Map<string, Handler[]> = new Map();

  on<T = any>(event: string, handler: Handler<T>) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);

    return () => this.off(event, handler);
  }

  off<T = any>(event: string, handler: Handler<T>) {
    const handlers = this.events.get(event);
    if (handlers) {
      this.events.set(
        event,
        handlers.filter((h) => h !== handler)
      );
    }
  }

  emit<T = any>(event: string, data?: T) {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(
            `[EventBus] Error in handler for event "${event}":`,
            error
          );
        }
      });
    }
  }

  /**
   * Clears all handlers for a specific event or all events if none specified.
   */
  clear(event?: string) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

export const eventBus = new EventBus();
