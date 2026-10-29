/**
 * @file state.ts
 * @description Canonical Form State, Validation Result, Submission, and Event contracts.
 * Part of the Canonical Form Contract API in @form-core/domain.
 */

/**
 * A structured error object for a single validation failure.
 * Machine-readable code, human-readable message, and optional context.
 */
export interface DetailedError {
  /** Machine-readable error code (e.g. "required", "email", "minLength"). */
  code: string;
  /** Human-readable error message shown in the UI. */
  message: string;
  /** The ID of the field this error belongs to. */
  fieldId: string;
  /** Optional extra context (e.g., `{ min: 3 }` for a minLength error). */
  details?: unknown;
}

/**
 * V1 — VALUES STATE
 * Raw data model mapping field names or paths to values.
 */
export type ValuesState<T = Record<string, unknown>> = T;

/**
 * V2 — VALIDITY STATE
 * Tracks validation status for every field, keyed by field ID.
 */
export interface ValidityState {
  [fieldId: string]: {
    /** Whether the field is currently valid. */
    valid: boolean;
    /** List of structured errors. Empty array = no errors. */
    errors?: DetailedError[];
    /** Optional non-blocking warning message (does not fail submission). */
    warning?: string;
    /** True while an async validator is running for this field. */
    pending?: boolean;
  };
}

/**
 * V3 — VISIBILITY STATE
 * Boolean map: true = field is rendered, false = field is hidden.
 */
export interface VisibilityState {
  [fieldId: string]: boolean;
}

/**
 * V4 — VIEW STATE
 * Dynamic display properties for each field.
 */
export interface ViewState {
  [fieldId: string]: {
    /** Dynamic label override. Falls back to the static `field.label` if not set. */
    label?: string;
    /** Dynamic description or hint text shown below the field. */
    description?: string;
    /** Dynamic placeholder text. */
    placeholder?: string;
    /** When true, the field renders as a disabled UI control. */
    disabled?: boolean;
    /** When true, the field renders in read-only mode (displays value, no edit). */
    readOnly?: boolean;
    /** Computed CSS properties merged into the field's style attribute. */
    style?: Record<string, string>;
    /** Computed CSS class string merged into the field's className. */
    className?: string;
    /** Whether the field is currently performing an async operation (e.g., fetching options). */
    isLoading?: boolean;
    /** Dynamic options for select/radio fields, populated via remoteOptions. */
    options?: ReadonlyArray<{ label: string; value: unknown }>;
    /** Arbitrary dynamic props forwarded to the underlying UI component. */
    componentProps?: Record<string, unknown>;
  };
}

/**
 * V5 — VITALITY STATE
 * Interaction lifecycle state for each field.
 */
export interface VitalityState {
  [fieldId: string]: {
    /** True after the field has been blurred at least once. */
    touched: boolean;
    /** True when the current value differs from the field's initialValue. */
    dirty: boolean;
    /** True while the field currently has browser focus. */
    focused: boolean;
    /** Monotonically increasing mutation counter incremented on every setValue call. */
    version: number;
    /** The value the field was initialized with. */
    initialValue?: unknown;
    /** If true, this field's state slice will not be purged even if the component unmounts. */
    pinned?: boolean;
  };
}

/**
 * Unified 5V Form State Contract.
 */
export interface FormState<T = Record<string, unknown>> {
  values: ValuesState<T>;
  validity: ValidityState;
  visibility: VisibilityState;
  view: ViewState;
  vitality: VitalityState;
  isSubmitting?: boolean;
  isValid?: boolean;
  isDirty?: boolean;
  activeStep?: string;
}

/**
 * Structured validation result returned by validation operations.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, DetailedError[]>;
  flatErrors: DetailedError[];
}

/**
 * Canonical submission payload emitted on valid form submission.
 */
export interface SubmissionPayload<T = Record<string, any>> {
  values: T;
  definitionId: string;
  timestamp: number;
}

/**
 * Canonical form lifecycle and state event types.
 */
export type FormEventType =
  | "value:change"
  | "vitality:change"
  | "visibility:change"
  | "validation:start"
  | "validation:complete"
  | "step:change"
  | "form:submit"
  | "form:reset";

/**
 * Standardized event envelope for form state transitions.
 */
export interface FormEvent<T = any> {
  type: FormEventType;
  fieldId?: string;
  payload?: T;
  timestamp: number;
}
