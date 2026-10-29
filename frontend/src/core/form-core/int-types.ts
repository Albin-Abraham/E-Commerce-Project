import type {
  FormDefinition,
  FormField,
  FormSection,
  RepeaterConfig,
  FieldCapabilities,
  FieldDependencyGraph,
} from "./domain";

// ============================================================================
//  NORMALIZATION ENTITIES
//  These are the "denormalized" versions of FormSection and FormField.
//  The FieldRegistry flattens the nested definition tree into flat maps
//  (Record<id, entity>) so every lookup is O(1) instead of O(n).
// ============================================================================

/**
 * A flattened representation of a {@link FormSection}.
 * Instead of holding nested `fields[]` and `sections[]`, we store IDs only.
 * This allows O(1) section lookup and avoids deep-tree traversal at runtime.
 *
 * @example
 * // Raw FormSection:
 * { id: "address", fields: [{ id: "city", ... }], subSections: [{ id: "billing", ... }] }
 *
 * // Normalized SectionEntity  :
 * { id: "address", fieldIds: ["city"], subSectionIds: ["billing"], parentId: undefined }
 */
export interface SectionEntity extends Omit<
  FormSection,
  "sections" | "fields"
> {
  /** IDs of all direct fields belonging to this section. */
  fieldIds: string[];
  /** IDs of all direct sub-sections belonging to this section. */
  subSectionIds: string[];
  /** ID of the parent section, or undefined if this is a root section. */
  parentId?: string;
}

/**
 * A flattened representation of a {@link FormField}.
 * Augmented with parent/section context injected during normalization,
 * enabling cascading visibility checks without re-traversing the tree.
 *
 * @example
 * // Raw FormField (inside a section):
 * { id: "city", name: "city", type: "text", label: "City" }
 *
 * // Normalized FieldEntity:
 * { id: "city", name: "city", type: "text", label: "City", sectionId: "address", parentId: undefined }
 */
export interface FieldEntity extends FormField {
  /** ID of the section this field belongs to. Injected by {@link FieldRegistry}. */
  sectionId: string;
  /**
   * ID of the parent field (used for nested/group fields and repeater children).
   * Undefined for top-level fields. Injected by {@link FieldRegistry}.
   */
  parentId?: string;
  /**
   * `true` if this field is a **repeater template child** — i.e., it lives inside
   * a repeater's `fields[]` definition and should NOT receive its own state entry.
   *
   * Set to `true` during normalization by {@link FieldRegistry} for any field whose
   * direct or transitive ancestor field has `type === 'repeater'`.
   *
   * Allows `StateManager.initializeState` to skip template fields in O(1)
   * instead of re-walking the ancestor chain on every field.
   */
  isTemplate?: boolean;
  repeaterConfig?: RepeaterConfig;
  /** Technical capabilities resolved from the registry. */
  capabilities: FieldCapabilities;
}

/**
 * The fully normalized (flat) representation of a {@link FormDefinition}.
 * This is the internal runtime format used by all core modules.
 * Created once by {@link normalizeFormDefinition} and never mutated after construction.
 *
 * @example
 * const norm: NormalizedForm = {
 *   metadata: { id: "my-form", name: "My Form" },
 *   sections: { "personal": { fieldIds: ["name", "dob"], ... } },
 *   fields:   { "name": { type: "text", sectionId: "personal", ... } },
 *   rootSections: ["personal", "address"]
 * }
 */
export interface NormalizedForm {
  /** Form-level metadata (id, name, events, etc.) — everything except `sections`. */
  metadata: Omit<FormDefinition, "sections">;
  /** Flat map of all sections, indexed by section ID. O(1) lookup. */
  sections: Record<string, SectionEntity>;
  /** Flat map of all fields (including nested), indexed by field ID. O(1) lookup. */
  fields: Record<string, FieldEntity>;
  /** Ordered array of root-level section IDs. Used for wizard/stepper navigation. */
  rootSections: string[];
  /**
   * Maps a field name (from the raw form values tree) to an array of field IDs
   * that depend on it for visibility, enabled state, or setValue effects.
   *
   * Populated by {@link normalizeFormDefinition} during initialization.
   * Enables the visibility engine to perform targeted re-evaluation instead of
   * full O(N) passes on every change.
   */
  dependencyGraph: Record<string, string[]>;
  /**
   * Categorized reactive dependency graph for O(D) targeted cascading.
   * Tracks visibility, computed, validation, and remoteOptions relationships.
   */
  fieldDependencyGraph: FieldDependencyGraph;
  /**
   * Static intermediate representation for the render engine.
   * Computed once during normalization.
   */
  renderTree: RenderNode[];
  /**
   * Flat map of all render nodes, indexed by stateKey. O(1) lookup.
   */
  renderNodes: Record<string, RenderNode>;
}

/** Intermediate representation for rendering a field */
export interface RenderNode {
  /** The internal engine key for V2-V5 state slices. Stable and deterministic. */
  stateKey: string;
  /** The external data path for V1 (Value) access and serialization. e.g. "users[0].email" */
  dataPath: string;
  /** @deprecated Use stateKey or dataPath. Provided for legacy component compatibility. */
  id: string;
  fieldType: string;
  category: string;
  capabilities: FieldCapabilities;
  depth: number;
  parentId: string | null;
  children: RenderNode[];
  /** Assigned by FormMetricsAnalyzer for layout grouping */
  rowGroup: number | null;
  /** The state key used for V3 (Visibility) subscriptions */
  visibilityKey: string;
}

/** The final resolved prop set passed to the React UI component */
export interface ResolvedFieldProps<TValue = unknown> {
  /** The external data path for serialization. e.g. "users[0].email" */
  dataPath: string;
  /** The internal engine key for state slices. e.g. "users__0__email" */
  stateKey: string;
  /** @deprecated Use dataPath or stateKey. */
  id: string;
  label?: string;
  description?: string;
  placeholder?: string;
  rowGroup: number | null;
  density: "compact" | "comfortable" | "spacious";
  /** Whether the field is currently disabled (view-slice driven) */
  disabled?: boolean;
  /** Capability-gated input props (value, onChange, error) */
  inputProps?: {
    value: TValue;
    valid: boolean;
    errors: DetailedError[];
    touched: boolean;
    dirty: boolean;
    focused: boolean;
    version: number;
    conflict?: { serverValue: TValue; clientValue: TValue; fieldId: string } | null;
    onChange?: (value: TValue) => void;
    onBlur?: () => void;
    onFocus?: () => void;
  };
  /** Forwarded static componentProps from schema */
  componentProps: Record<string, unknown>;
  /** Dynamic options for select/radio/autocomplete, populated via RemoteOptionsManager */
  options?: ReadonlyArray<{ label: string; value: unknown }>;
  /** Whether the field is currently loading (e.g., fetching remote options) */
  isLoading?: boolean;
}

// ============================================================================
//  5V STATE PATTERN (CANONICAL CONTRACT RE-EXPORTS)
//  Re-exported from @form-core/domain/state
// ============================================================================

export type {
  ValuesState,
  DetailedError,
  ValidityState,
  VisibilityState,
  ViewState,
  VitalityState,
  FormState,
  ValidationResult,
  SubmissionPayload,
  FormEvent,
  FormEventType,
} from "./domain";


// ──────────────────────────────────────────────────────────────────────────────
//  PERFORMANCE STATE
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Runtime performance metrics.
 * Collected during form interaction to monitor engine efficiency and user experience.
 */
export interface PerformanceState {
  /** Time taken for the last submission (ms). */
  lastSubmissionDurationMs?: number;
  /** Time taken for the last full validation pass (ms). */
  lastValidationDurationMs?: number;
  /** Average latency for individual field updates (ms). */
  averageLatencyMs?: number;
  /** Time taken for the last remote options fetch (ms). */
  lastOptionsFetchDurationMs?: number;
}

/**
 * Internal debug/diagnostics state. Managed by {@link DebugManager}.
 * Only meaningful in development — the `isEnabled` flag gates all logging.
 */
export interface DebugState {
  /** Whether debug logging is active. */
  isEnabled: boolean;
  /** Ordered log entries with timestamps. */
  logs: { timestamp: number; message: string; data?: unknown }[];
  /** How many times the state has been published to subscribers. */
  renderCount: number;
  /** Label of the most recent action that mutated state. */
  lastAction?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
//  CONSOLIDATED STATE
// ──────────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────────
//  UI & BUSINESS STATE (METASCHEMA SEPARATION)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * **UI STATE**
 * UX and interactive state completely separated from submitted business data.
 */
export interface UIState {
  activeSectionId?: string;
  activeTabId?: string;
  focusedFieldId?: string;
  expandedPanels?: Record<string, boolean>;
  modalOpen?: boolean;
  isSubmitting?: boolean;
  isLoading?: boolean;
  customUI?: Record<string, unknown>;
}

/**
 * **BUSINESS STATE**
 * Entity lifecycle stage and workflow status (Draft, Submitted, Approved, etc.).
 */
export interface BusinessState {
  lifecycleStage:
    | "Draft"
    | "Submitted"
    | "Reviewed"
    | "Approved"
    | "Completed"
    | "Archived"
    | (string & {});
  previousStage?: string;
  allowedTransitions?: string[];
  ownerId?: string;
  assigneeId?: string;
  approvals?: Array<{ role: string; approvedBy: string; approvedAt: string }>;
  metadata?: Record<string, unknown>;
}

/**
 * The complete internal state of a {@link FormCore} instance.
 * All five V-slices plus UI state, business state, and debug are held here.
 *
 * Managed by {@link StateManager} and published to subscribers on every mutation.
 * Consumers (React hooks, adapters) subscribe to this and re-render on change.
 *
 * @template T - The form's data model type.
 *
 * @example
 * form.subscribe((state: InternalFormState<MyForm>) => {
 *   console.log(state.values.email);        // V1
 *   console.log(state.validity.email_id);   // V2
 *   console.log(state.visibility.email_id); // V3
 *   console.log(state.view.email_id);       // V4
 *   console.log(state.vitality.email_id);   // V5
 *   console.log(state.uiState);             // UI State
 *   console.log(state.businessState);       // Business State
 * });
 */
export interface InternalFormState<T> {
  /** V1 — Raw form data. */
  values: ValuesState<T>;
  /** V2 — Per-field validation status and errors. */
  validity: ValidityState;
  /** V3 — Per-field computed visibility. */
  visibility: VisibilityState;
  /** V4 — Per-field dynamic display properties. */
  view: ViewState;
  /** V5 — Per-field interaction lifecycle flags. */
  vitality: VitalityState;
  /** Interactive UI state (active tab, focused field, modal state). */
  uiState?: UIState;
  /** Entity lifecycle business state (Draft, Submitted, Approved). */
  businessState?: BusinessState;
  /** Dev-mode diagnostics. */
  debug: DebugState;
  /** Performance metrics. */
  performance: PerformanceState;
  /** Form-level contextual metadata used by functional predicates and rules. */
  metadata?: Record<string, unknown>;
  /** Optimistic locking and concurrency metadata. Required for 10.0 ERP stability. */
  concurrency?: {
    version: number; // Local mutation counter
    baseVersion?: number; // Backend version when loaded
    etag?: string;
    conflicts?: Record<
      string,
      { serverValue: unknown; clientValue: unknown; fieldId: string }
    >;
  };
}
