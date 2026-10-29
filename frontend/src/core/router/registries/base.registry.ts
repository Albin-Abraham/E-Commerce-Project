/**
 * BaseRegistry
 *
 * Minimal app-scoped registry primitive. Registries are instantiated per
 * application instance (see createRouterAppInstance) rather than relying on
 * module-level mutable singletons, improving testability and SSR readiness.
 */
export class BaseRegistry<T extends { id: string }> {
  protected items: Map<string, T> = new Map();

  register(item: T): void {
    this.items.set(item.id, item);
  }

  registerAll(items: T[]): void {
    for (const item of items) {
      this.register(item);
    }
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  getAll(): T[] {
    return Array.from(this.items.values());
  }

  has(id: string): boolean {
    return this.items.has(id);
  }

  unregister(id: string): void {
    this.items.delete(id);
  }

  reset(): void {
    this.items.clear();
  }

  get size(): number {
    return this.items.size;
  }
}
