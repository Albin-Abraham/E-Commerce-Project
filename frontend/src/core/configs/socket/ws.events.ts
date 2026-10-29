type WSEventListener = (payload: any) => void;

export class WSEventBus {
  private listeners = new Map<string, Set<WSEventListener>>();

  on(event: string, fn: WSEventListener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
  }

  off(event: string, fn?: WSEventListener) {
    if (!fn) {
      this.listeners.delete(event);
    } else {
      this.listeners.get(event)?.delete(fn);
    }
  }

  emit(event: string, payload: any) {
    this.listeners.get(event)?.forEach((fn) => fn(payload));
  }
}
