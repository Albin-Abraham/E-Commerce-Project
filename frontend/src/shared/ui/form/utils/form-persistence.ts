/**
 * @file form-persistence.ts
 * @description Automatic form state persistence to localStorage with draft recovery.
 *
 * ## Usage
 * ```tsx
 * import { createPersistenceMiddleware } from "@ui/form/utils/form-persistence";
 *
 * // Attach to any Form:
 * <Form
 *   definition={myFormDef}
 *   middleware={[createPersistenceMiddleware("checkout-form")]}
 * />
 * ```
 *
 * ## Storage format
 * | Key                          | Value                                      |
 * |------------------------------|--------------------------------------------|
 * | `form_draft:{formId}`        | JSON `{ values, timestamp, definitionId }` |
 * | `form_draft_meta:{formId}`   | JSON `{ savedAt, fieldCount }`             |
 *
 * ## Recovery
 * Call `recoverDraft(formId)` to retrieve saved values before initializing the form.
 */

const STORAGE_PREFIX = "form_draft";
const META_SUFFIX = "_meta";

/** A saved form draft. */
export interface FormDraft<T = Record<string, any>> {
  values: T;
  timestamp: number;
  definitionId: string;
}

/** Persistence configuration. */
export interface PersistenceConfig {
  /** Storage backend (defaults to localStorage). */
  storage?: Storage;
  /** Debounce interval in ms between saves (default: 500). */
  debounceMs?: number;
  /** Max draft age in ms before it is considered stale (default: 24h). */
  maxAgeMs?: number;
  /** Field names to exclude from persistence (e.g., passwords). */
  excludeFields?: string[];
}

const DEFAULT_CONFIG: Required<PersistenceConfig> = {
  storage: typeof localStorage !== "undefined" ? localStorage : (null as any),
  debounceMs: 500,
  maxAgeMs: 24 * 60 * 60 * 1000,
  excludeFields: ["password", "confirmPassword", "currentPassword"],
};

function isStorageAvailable(storage: Storage): boolean {
  try {
    const key = "__form_persistence_test__";
    storage.setItem(key, "1");
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recovers a saved form draft from storage.
 * Returns `null` if no draft exists or it has expired.
 */
export function recoverDraft<T = Record<string, any>>(
  formId: string,
  config?: PersistenceConfig
): FormDraft<T> | null {
  const storage = config?.storage ?? DEFAULT_CONFIG.storage;
  const maxAge = config?.maxAgeMs ?? DEFAULT_CONFIG.maxAgeMs;

  if (!storage || !isStorageAvailable(storage)) return null;

  try {
    const raw = storage.getItem(`${STORAGE_PREFIX}:${formId}`);
    if (!raw) return null;

    const draft: FormDraft<T> = JSON.parse(raw);

    // Expiry check
    if (Date.now() - draft.timestamp > maxAge) {
      clearDraft(formId, config);
      return null;
    }

    return draft;
  } catch {
    return null;
  }
}

/**
 * Creates a middleware function that auto-saves form state to storage.
 * Attach via the `middleware` prop on `<Form>`.
 */
export function createPersistenceMiddleware(
  formId: string,
  config?: PersistenceConfig
) {
  const storage = config?.storage ?? DEFAULT_CONFIG.storage;
  const debounceMs = config?.debounceMs ?? DEFAULT_CONFIG.debounceMs;
  const exclude = config?.excludeFields ?? DEFAULT_CONFIG.excludeFields;

  if (!storage || !isStorageAvailable(storage)) {
    console.warn(
      "[FormPersistence] Storage unavailable — persistence disabled"
    );
    return () => {};
  }

  let timer: ReturnType<typeof setTimeout> | null = null;

  return ({ form }: { form: any }) => {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      const values = { ...form.values };

      // Strip excluded fields
      for (const field of exclude) {
        if (field in values) {
          delete values[field];
        }
      }

      const draft: FormDraft = {
        values,
        timestamp: Date.now(),
        definitionId: form.definition?.id || formId,
      };

      try {
        storage.setItem(`${STORAGE_PREFIX}:${formId}`, JSON.stringify(draft));
        storage.setItem(
          `${STORAGE_PREFIX}${META_SUFFIX}:${formId}`,
          JSON.stringify({
            savedAt: Date.now(),
            fieldCount: Object.keys(values).length,
          })
        );
      } catch (err) {
        console.warn("[FormPersistence] Failed to save draft:", err);
      }
    }, debounceMs);
  };
}

/**
 * Clears a saved form draft from storage.
 */
export function clearDraft(formId: string, config?: PersistenceConfig) {
  const storage = config?.storage ?? DEFAULT_CONFIG.storage;
  if (!storage) return;

  try {
    storage.removeItem(`${STORAGE_PREFIX}:${formId}`);
    storage.removeItem(`${STORAGE_PREFIX}${META_SUFFIX}:${formId}`);
  } catch {
    // Silently fail
  }
}

/**
 * Returns metadata about a saved draft (without the full values).
 */
export function getDraftMeta(
  formId: string,
  config?: PersistenceConfig
): { savedAt: number; fieldCount: number } | null {
  const storage = config?.storage ?? DEFAULT_CONFIG.storage;
  if (!storage) return null;

  try {
    const raw = storage.getItem(`${STORAGE_PREFIX}${META_SUFFIX}:${formId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
