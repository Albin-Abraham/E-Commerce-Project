/**
 * @file persistence-manager.ts
 * @description Pluggable storage port and draft persistence engine.
 *
 * ## Responsibility
 * Manages the temporal durability of form state:
 * - Serializes and debounces draft auto-saving to local/session/memory or custom storage.
 * - Rehydrates form state on page load or reload with schema version validation.
 * - Wipes stored drafts on successful submission.
 * - Filters sensitive fields (e.g., passwords or payment details) via include/exclude lists.
 *
 * ## Architecture (Ports & Adapters)
 * `StorageAdapter` is the SPI (port) allowing storage to be hosted in:
 * - `sessionStorage` (default for privacy and session lifecycle)
 * - `localStorage` (for persistent multi-day drafts)
 * - `MemoryStorageAdapter` (for test/SSR/Node environments)
 * - Custom backend draft APIs via custom `StorageAdapter` implementations.
 */

import debounce from "lodash-es/debounce";
import { cloneDeep } from "lodash-es";
import type { InternalFormState } from "../int-types";
import type { StateManager } from "./state-manager";

/**
 * Storage Port for draft persistence.
 */
export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

/**
 * In-memory storage adapter, ideal for testing, SSR, or Node runtimes.
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * SessionStorage adapter, isolating drafts to the active browser tab session.
 */
export class SessionStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    if (typeof window === "undefined" || !window.sessionStorage) return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn("[SessionStorageAdapter] Failed to persist draft:", e);
    }
  }

  removeItem(key: string): void {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Ignored
    }
  }
}

/**
 * LocalStorage adapter, persisting drafts across browser restarts.
 */
export class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    if (typeof window === "undefined" || !window.localStorage) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn("[LocalStorageAdapter] Failed to persist draft:", e);
    }
  }

  removeItem(key: string): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignored
    }
  }
}

/**
 * Serialized draft envelope stored in the storage backend.
 */
export interface PersistedDraftData {
  /** Schema or form definition version for compatibility screening. */
  version?: string;
  /** Unix timestamp in milliseconds when the draft was saved. */
  timestamp: number;
  /** Serialized form values (V1). */
  values: Record<string, any>;
  /** Optional serialized UI state (active tab, active section). */
  uiState?: Record<string, any>;
}

/**
 * Configuration options for the form persistence manager.
 */
export interface PersistenceConfig {
  /** Unique storage key for this form's draft. */
  key: string;
  /**
   * Storage backend strategy:
   * - "session": uses browser sessionStorage (default)
   * - "local": uses browser localStorage
   * - "memory": uses in-memory Map
   * - StorageAdapter: custom storage implementation
   */
  storage?: "session" | "local" | "memory" | StorageAdapter;
  /**
   * Milliseconds of inactivity before autosaving.
   * @default 500
   */
  debounceMs?: number;
  /** Explicit whitelist of field paths to persist. If omitted, all fields are saved. */
  includeFields?: string[];
  /** Blacklist of field paths to omit (e.g. passwords, SSNs). */
  excludeFields?: string[];
  /** Expected schema version. Stale drafts with mismatched versions will be ignored. */
  version?: string;
  /** Whether to automatically rehydrate the draft on construction. @default true */
  autoRestore?: boolean;
  /** Whether to clear the saved draft upon successful form submission. @default true */
  clearOnSubmit?: boolean;
  /** Hook called after a draft is successfully written to storage. */
  onSave?: (data: PersistedDraftData) => void;
  /** Hook called after a draft is successfully restored into form state. */
  onRestore?: (data: PersistedDraftData) => void;
  /** Hook called if an error occurs during persistence operations. */
  onError?: (error: unknown) => void;
}

/**
 * FormPersistenceManager
 * Coordinates autosave debouncing, draft filtering, serialization, and rehydration.
 */
export class FormPersistenceManager<
  T extends Record<string, any> = Record<string, any>,
> {
  private adapter: StorageAdapter;
  private unsubscribe?: () => void;
  private debouncedSave: ReturnType<typeof debounce>;
  private isSaving = false;

  constructor(
    public readonly config: PersistenceConfig,
    private stateManager: StateManager<T>
  ) {
    this.adapter = this.resolveAdapter(config.storage);

    const debounceMs = config.debounceMs ?? 500;
    this.debouncedSave = debounce(() => {
      this.save();
    }, debounceMs);

    // Subscribe to state manager changes for autosave
    this.unsubscribe = this.stateManager.subscribe(() => {
      this.debouncedSave();
    });
  }

  /**
   * Resolves the concrete storage adapter from the configuration.
   */
  private resolveAdapter(
    storage?: "session" | "local" | "memory" | StorageAdapter
  ): StorageAdapter {
    if (typeof storage === "object" && storage !== null) {
      return storage;
    }

    if (storage === "local") {
      if (typeof window !== "undefined" && window.localStorage) {
        return new LocalStorageAdapter();
      }
      return new MemoryStorageAdapter();
    }

    if (storage === "memory") {
      return new MemoryStorageAdapter();
    }

    // Default to session storage
    if (typeof window !== "undefined" && window.sessionStorage) {
      return new SessionStorageAdapter();
    }
    return new MemoryStorageAdapter();
  }

  /**
   * Filters form values based on includeFields and excludeFields rules.
   */
  private filterValues(rawValues: T): Record<string, any> {
    const values = cloneDeep(rawValues);
    const result: Record<string, any> = {};

    const keys = Object.keys(values);
    for (const key of keys) {
      // 1. If includeFields is defined, key must be in the whitelist
      if (
        this.config.includeFields &&
        !this.config.includeFields.includes(key)
      ) {
        continue;
      }

      // 2. If excludeFields is defined, key must not be in the blacklist
      if (
        this.config.excludeFields &&
        this.config.excludeFields.includes(key)
      ) {
        continue;
      }

      result[key] = values[key];
    }

    return result;
  }

  /**
   * Immediately saves the current form state to the storage adapter.
   */
  public async save(): Promise<void> {
    if (this.isSaving) return;
    this.isSaving = true;

    try {
      const filteredValues = this.filterValues(this.stateManager.state.values);

      const draft: PersistedDraftData = {
        version: this.config.version,
        timestamp: Date.now(),
        values: filteredValues,
        uiState: this.stateManager.state.uiState
          ? {
              activeSectionId: this.stateManager.state.uiState.activeSectionId,
              activeTabId: this.stateManager.state.uiState.activeTabId,
            }
          : undefined,
      };

      const serialized = JSON.stringify(draft);
      await this.adapter.setItem(this.config.key, serialized);
      this.config.onSave?.(draft);
    } catch (err) {
      this.config.onError?.(err);
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Restores a saved draft into the form state.
   *
   * @returns `true` if a valid draft was found and applied, `false` otherwise.
   */
  public async restore(): Promise<boolean> {
    try {
      const raw = await this.adapter.getItem(this.config.key);
      if (!raw) return false;

      const draft = JSON.parse(raw) as PersistedDraftData;
      if (!draft || typeof draft !== "object" || !draft.values) {
        return false;
      }

      // Schema version check: reject stale drafts
      if (this.config.version && draft.version !== this.config.version) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[FormPersistenceManager] Stale draft detected for "${this.config.key}". Expected version "${this.config.version}", got "${draft.version}". Draft ignored.`
          );
        }
        return false;
      }

      // Apply values into form state
      for (const [key, value] of Object.entries(draft.values)) {
        this.stateManager.setRawValue(key, value);
      }

      // Apply UI state if present
      if (draft.uiState) {
        this.stateManager.update((prev) => ({
          ...prev,
          uiState: {
            ...prev.uiState,
            ...draft.uiState,
          },
        }));
      }

      this.config.onRestore?.(draft);
      return true;
    } catch (err) {
      this.config.onError?.(err);
      return false;
    }
  }

  /**
   * Clears the persisted draft from storage.
   */
  public async clear(): Promise<void> {
    this.debouncedSave.cancel();
    try {
      await this.adapter.removeItem(this.config.key);
    } catch (err) {
      this.config.onError?.(err);
    }
  }

  /**
   * Disables autosave and cleans up listeners.
   */
  public destroy(): void {
    this.debouncedSave.cancel();
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }
}
