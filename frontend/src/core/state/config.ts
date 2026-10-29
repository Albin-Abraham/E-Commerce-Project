/**
 * React State Architecture & Store Configuration
 *
 * Central configuration for Zustand middleware, persistence adapters,
 * and devtools integration across core and feature stores.
 */

export interface StateConfig {
  enableDevtools: boolean;
  enableLogging: boolean;
  persistencePrefix: string;
}

export const defaultStateConfig: StateConfig = {
  enableDevtools: !import.meta.env.PROD,
  enableLogging: !import.meta.env.PROD,
  persistencePrefix: "zenos_state",
};

/**
 * Storage adapter wrapper with error fallback for memory/test environments.
 */
export const createSafeStorage = () => {
  if (typeof window === "undefined" || !window.localStorage) {
    const memoryStore = new Map<string, string>();
    return {
      getItem: (name: string) => memoryStore.get(name) ?? null,
      setItem: (name: string, value: string) => memoryStore.set(name, value),
      removeItem: (name: string) => memoryStore.delete(name),
    };
  }
  return localStorage;
};
