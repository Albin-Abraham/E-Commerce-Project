import { cleanup } from "@testing-library/react";
import { vi } from "vitest";
import type { TestContext } from "./lifecycle";
import { runCleanupFns } from "./lifecycle";

export interface StateSnapshot {
  timestamp: number;
  data: Record<string, any>;
}

export interface StateManager {
  createFreshState: () => Promise<Record<string, any>>;
  snapshotState: () => StateSnapshot;
  restoreState: (snapshot: StateSnapshot) => void;
  resetState: () => void;
  getState: () => Record<string, any>;
  setState: (key: string, value: any) => void;
  deleteState: (key: string) => void;
}

const globalState = new Map<string, any>();
const stateSnapshots: StateSnapshot[] = [];
let initialState: Record<string, any> = {};

export function initializeStateManager(initial?: Record<string, any>): StateManager {
  initialState = initial || {};
  globalState.clear();
  stateSnapshots.length = 0;
  
  for (const [key, value] of Object.entries(initialState)) {
    globalState.set(key, value);
  }
  
  return {
    createFreshState: async () => {
      globalState.clear();
      for (const [key, value] of Object.entries(initialState)) {
        globalState.set(key, typeof value === "function" ? value() : value);
      }
      return getState();
    },
    snapshotState: () => {
      const snapshot: StateSnapshot = {
        timestamp: Date.now(),
        data: { ...Object.fromEntries(globalState) },
      };
      stateSnapshots.push(snapshot);
      return snapshot;
    },
    restoreState: (snapshot: StateSnapshot) => {
      globalState.clear();
      for (const [key, value] of Object.entries(snapshot.data)) {
        globalState.set(key, value);
      }
    },
    resetState: () => {
      globalState.clear();
      for (const [key, value] of Object.entries(initialState)) {
        globalState.set(key, typeof value === "function" ? value() : value);
      }
    },
    getState: () => Object.fromEntries(globalState),
    setState: (key: string, value: any) => globalState.set(key, value),
    deleteState: (key: string) => globalState.delete(key),
  };
}

export function getGlobalStateManager(): StateManager {
  return {
    createFreshState: async () => {
      globalState.clear();
      for (const [key, value] of Object.entries(initialState)) {
        globalState.set(key, typeof value === "function" ? value() : value);
      }
      return getState();
    },
    snapshotState: () => {
      const snapshot: StateSnapshot = {
        timestamp: Date.now(),
        data: { ...Object.fromEntries(globalState) },
      };
      stateSnapshots.push(snapshot);
      return snapshot;
    },
    restoreState: (snapshot: StateSnapshot) => {
      globalState.clear();
      for (const [key, value] of Object.entries(snapshot.data)) {
        globalState.set(key, value);
      }
    },
    resetState: () => {
      globalState.clear();
      for (const [key, value] of Object.entries(initialState)) {
        globalState.set(key, typeof value === "function" ? value() : value);
      }
    },
    getState: () => Object.fromEntries(globalState),
    setState: (key: string, value: any) => globalState.set(key, value),
    deleteState: (key: string) => globalState.delete(key),
  };
}

export function createTestStateManager(context: TestContext): StateManager {
  const testState = new Map<string, any>();
  const testSnapshots: StateSnapshot[] = [];
  
  return {
    createFreshState: async () => {
      testState.clear();
      return getState();
    },
    snapshotState: () => {
      const snapshot: StateSnapshot = {
        timestamp: Date.now(),
        data: { ...Object.fromEntries(testState) },
      };
      testSnapshots.push(snapshot);
      return snapshot;
    },
    restoreState: (snapshot: StateSnapshot) => {
      testState.clear();
      for (const [key, value] of Object.entries(snapshot.data)) {
        testState.set(key, value);
      }
    },
    resetState: () => {
      testState.clear();
    },
    getState: () => Object.fromEntries(testState),
    setState: (key: string, value: any) => testState.set(key, value),
    deleteState: (key: string) => testState.delete(key),
  };
}

export function getState(): Record<string, any> {
  return Object.fromEntries(globalState);
}

export function setState(key: string, value: any): void {
  globalState.set(key, value);
}

export function deleteState(key: string): void {
  globalState.delete(key);
}

export function clearAllState(): void {
  globalState.clear();
  stateSnapshots.length = 0;
}

export async function setupTestIsolation(context: TestContext): Promise<void> {
  cleanup();
  vi.restoreAllMocks();
  
  if (typeof window !== "undefined") {
    localStorage.clear();
    sessionStorage.clear();
  }
  
  if (typeof document !== "undefined") {
    const scripts = document.querySelectorAll("script[data-test-script]");
    scripts.forEach(s => s.remove());
  }
}

export async function teardownTestIsolation(context: TestContext): Promise<void> {
  cleanup();
  vi.restoreAllMocks();
  try {
    vi.useFakeTimers();
    vi.useRealTimers();
  } catch {}
  
  if (context.isolationLevel === "full") {
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
  }
  
  await runCleanupFns(context);
}

export function createIsolatedStore<T>(initialValue: T): {
  get: () => T;
  set: (value: T) => void;
  reset: () => void;
  subscribe: (listener: (value: T) => void) => () => void;
} {
  let value = initialValue;
  const listeners = new Set<(value: T) => void>();
  
  return {
    get: () => value,
    set: (newValue: T) => {
      value = newValue;
      listeners.forEach(l => l(value));
    },
    reset: () => {
      value = initialValue;
      listeners.forEach(l => l(value));
    },
    subscribe: (listener: (value: T) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}