/**
 * Central Zustand Store Registry
 *
 * Provides lifecycle management, global resets for GrayBox/Vitest tests,
 * and state snapshot introspection for DevTools.
 */

type ResetFn = () => void;
type StoreGetter = () => Record<string, any>;

interface RegisteredStore {
  name: string;
  getState: StoreGetter;
  reset: ResetFn;
}

class StoreRegistry {
  private stores = new Map<string, RegisteredStore>();

  /**
   * Register a Zustand store for lifecycle and test management.
   */
  public register(name: string, getState: StoreGetter, reset: ResetFn): void {
    this.stores.set(name, { name, getState, reset });
  }

  /**
   * Unregister a store.
   */
  public unregister(name: string): void {
    this.stores.delete(name);
  }

  /**
   * Reset all registered stores to their initial state.
   * Useful in beforeEach/afterEach hooks and upon user logout.
   */
  public resetAll(): void {
    this.stores.forEach((store) => {
      try {
        store.reset();
      } catch (err) {
        console.warn(`[StoreRegistry] Failed to reset store "${store.name}":`, err);
      }
    });
  }

  /**
   * Capture a snapshot of all registered stores.
   */
  public getSnapshot(): Record<string, any> {
    const snapshot: Record<string, any> = {};
    this.stores.forEach((store, name) => {
      try {
        snapshot[name] = store.getState();
      } catch {
        snapshot[name] = null;
      }
    });
    return snapshot;
  }

  /**
   * List all registered store names.
   */
  public getRegisteredStoreNames(): string[] {
    return Array.from(this.stores.keys());
  }
}

export const storeRegistry = new StoreRegistry();
