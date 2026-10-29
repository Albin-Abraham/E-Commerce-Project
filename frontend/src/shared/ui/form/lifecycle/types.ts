// Lifecycle types for Form fields

/** Persistence strategies for the field lifecycle */
export type PersistenceStrategy = "immediate" | "debounce" | "blur" | "manual";

/** Target storage locations for persisted values */
export type PersistenceTarget = "engine" | "local" | "session" | "memory" | "remote";

/** Stages of the field lifecycle */
export type FieldLifecycleStage =
  | "unmounted"
  | "mounted"
  | "idle"
  | "drafting"
  | "saving"
  | "persisted"
  | "error";

/** Metadata for a field update (draft) */
export interface FieldUpdateMeta<T = any> {
  fieldId: string;
  fieldName: string;
  previousValue: T;
  timestamp: number;
}

/** Metadata for a persistence attempt */
export interface FieldPersistMeta<T = any> {
  fieldId: string;
  fieldName: string;
  previousPersistedValue: T;
  timestamp: number;
  attempts: number;
  target: PersistenceTarget;
}

/** Configuration for update and persistence lifecycle hooks */
export interface FieldLifecycleUpdateConfig<T = any> {
  /** Called immediately on local draft change */
  onUpdate?: (value: T, meta: FieldUpdateMeta<T>) => void;

  /** Interceptor before persisting; can transform or cancel */
  onBeforePersist?: (
    draftValue: T,
    prevValue: T,
    meta: FieldPersistMeta<T>
  ) => boolean | T | Promise<boolean | T>;

  /** Called after successful persistence */
  onPersist?: (value: T, meta: FieldPersistMeta<T>) => void | Promise<void>;

  /** Called on persistence error; provides a rollback function */
  onError?: (
    error: Error,
    draftValue: T,
    rollback: () => void,
    meta: FieldPersistMeta<T>
  ) => void;

  /** Optimistic UI update flag */
  optimistic?: boolean;

  /** Auto‑rollback on error flag */
  rollbackOnError?: boolean;

  /** Synchronous transformation before persistence */
  transform?: (draftValue: T) => T;

  /** Cascading updates to other fields after persistence */
  cascades?: Array<{
    targetField: string;
    derive: (persistedValue: T) => any;
  }>;
}

/** Overall lifecycle configuration for a field */
export interface FieldLifecycleConfig<T = any> {
  /** Persistence strategy */
  strategy?: PersistenceStrategy;

  /** Debounce delay when strategy is "debounce" */
  debounceMs?: number;

  /** Target storage layer */
  target?: PersistenceTarget;

  /** Custom storage key for local / session targets */
  storageKey?: string;

  /** Remote save function for "remote" target */
  onRemoteSave?: (value: T) => Promise<void>;

  /** If true, field is excluded from final submit payload */
  ephemeral?: boolean;

  /** Show Notion‑style status indicator */
  showStatusIndicator?: boolean;

  /** Hook configuration for update & persistence */
  update?: FieldLifecycleUpdateConfig<T>;
}
