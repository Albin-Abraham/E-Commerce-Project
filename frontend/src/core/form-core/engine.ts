/**
 * @file engine.ts
 * @description The headless Form Engine — composition root for all form modules.
 *
 * ## Architecture Overview
 * `FormCore` is the **composition root** of the form engine. It wires together
 * 9 focused single-responsibility modules and exposes a clean public API.
 * It has no React dependency — it can be used in any JavaScript environment.
 *
 * ```
 * FormCore<T>
 *  ├── FieldRegistry      — normalizes the definition tree → O(1) field lookups
 *  ├── FieldResolver      — resolves fields by ID, name, or repeater path
 *  ├── StateManager       — holds the 5V state, pub/sub reactivity
 *  ├── ErrorManager       — single write path for validity/errors
 *  ├── DebugManager       — opt-in diagnostics logging
 *  ├── FormRuntime        — groups ValueProxy, ConditionProxy, FlowProxy
 *  ├── FormValidator      — orchestrates validation against a pluggable adapter
 *  ├── FormVisibility     — cascading show/hide evaluation with side effects
 *  └── FormExecution      — setValue pipeline, middleware chain, blur handling
 * ```
 *
 * ## Validation Modes
 * | Mode       | When validation fires                                   |
 * |------------|---------------------------------------------------------|
 * | `onChange` | Immediately on every value change                       |
 * | `onBlur`   | When a field loses focus (recommended default)          |
 * | `onSubmit` | Only on explicit `form.submit()` call                   |
 * | `manual`   | Only via explicit `form.validateFields([...])` calls    |
 * | `lazy`     | `onBlur` until first submit, then `onChange` thereafter |
 *
 * ## 5V State Accessors
 * ```
 * form.values      // V1: ValuesState<T>     — current data
 * form.validity    // V2: ValidityState      — errors per field
 * form.visibility  // V3: VisibilityState    — visible fields
 * form.view        // V4: ViewState          — dynamic display props
 * form.vitality    // V5: VitalityState      — touched/dirty/focused
 * ```
 *
 * ## Usage Example
 * ```typescript
 * const form = new FormCore(definition, { name: "Alice" });
 *
 * // Subscribe to state changes (for custom React hook)
 * const unsub = form.subscribe(state => setFormState({ ...state }));
 *
 * // Get merged component props
 * const props = form.getComponentProps("name_field_id"); // via Form / ReactFormAdapter
 *
 * // Submit
 * const isValid = await form.submit();
 * if (isValid) await api.save(form.values);
 *
 * // Cleanup
 * unsub();
 * ```
 */
import type { FormField, FormDefinition } from "./domain";
import { toCanonicalMetadataEvents } from "./utils/schema-compat";
import { cloneDeep, unset } from "lodash-es";

import type { IFormCore } from "./form-interface";
// ── Internal Type Re-exports ───────────────────────────────────────────────────

import type {
  DetailedError,
  FieldEntity,
  InternalFormState,
  NormalizedForm,
  RenderNode,
  ResolvedFieldProps,
  SectionEntity,
  ValidityState,
  ValuesState,
  ViewState,
  VisibilityState,
  VitalityState,
} from "./int-types";
// ── Module Imports ─────────────────────────────────────────────────────────────

import {
  DebugManager,
  ErrorManager,
  FieldRegistry,
  FieldResolver,
  FormExecution,
  FormRuntime,
  FormValidator,
  FormVisibility,
  RemoteOptionsManager,
  RepeaterRowFactory,
  ResolutionPipeline,
  StateManager,
  denormalizeForm,
  normalizeFormDefinition,
  FormPersistenceManager,
} from "./modules";
import type { PersistenceConfig } from "./modules";
import { CircuitBreaker } from "./modules/circuit-breaker";
import { FormHistory } from "./modules/history";
import { ZodValidationAdapter } from "./adapters/zod-adapter";
import type { AutocompletePath, FieldPath, PathValue } from "./domain/paths";
import type { ValidationAdapter } from "./validation-adapter";
import { ValidationProxy } from "./validation-proxy";
import type { ValidationMessageConfig } from "./validation-proxy";

// ── Validation Mode ────────────────────────────────────────────────────────────

/**
 * Controls when validation is triggered during user interaction.
 *
 * - `'onChange'` — Validate on every keystroke/change (aggressive, noisy UX).
 * - `'onBlur'`   — Validate only when a field loses focus (recommended).
 * - `'onSubmit'` — Validate only on form submission (least intrusive).
 * - `'manual'`   — Validate only via explicit `form.validateFields()` calls.
 * - `'lazy'`     — `onBlur` until the user's first submit attempt, then `onChange`.
 *   This progressively tightens feedback without front-loading errors.
 */
export type ValidationMode =
  | "onChange"
  | "onBlur"
  | "onSubmit"
  | "manual"
  | "lazy";

/**
 * Configuration options for the form engine.
 */
export interface FormCoreOptions<
  T extends Record<string, any> = Record<string, any>,
> {
  /**
   * Controls when validation fires during user interaction.
   * @default 'onBlur'
   */
  validationMode?: ValidationMode;
  /**
   * If `true`, validates all fields immediately after the engine is constructed.
   * Useful for forms pre-populated with server data where you want immediate error state.
   * @default false
   */
  validateOnMount?: boolean;
  /**
   * Delay in milliseconds before triggering onChange validation.
   * Prevents excessive validation calls during rapid typing.
   * @default 300
   */
  validationDebounceMs?: number;
  /**
   * Screen and validate every value *before* it is written to form state.
   *
   * When `true`, `setValue` runs two gates that **reject** rather than rewrite or
   * throw: the field's character-class rules detect forbidden characters (via
   * each strategy's `sanitize()`), then the candidate is validated immediately,
   * bypassing `validationMode` and `validationDebounceMs`. Either gate failing
   * keeps the previous value, records the error on the field, and stores nothing.
   *
   * Use this to keep illegal input (special characters, malformed values) out of
   * `form.values` and therefore out of `getPayload()`, rather than storing it and
   * flagging the field afterwards.
   *
   * @default false
   * @see {@link ValidationSettings.disableDeferredValidation} for the schema-level equivalent.
   */
  disableDeferredValidation?: boolean;
  /**
   * Optional custom ValidationAdapter (e.g., Yup, Zod).
   * If provided, replaces the built-in ValidationProxy.
   */
  validatorAdapter?: ValidationAdapter<T>;
  /**
   * Optional Zod schema for first-class schema validation.
   * When provided, automatically instantiates a ZodValidationAdapter.
   */
  schema?: import("zod").ZodType<T>;
  /**
   * Alias for `schema`.
   */
  zodSchema?: import("zod").ZodType<T>;
  /**
   * Per-field, per-rule error message overrides for the internal ValidationProxy.
   */
  messageConfig?: ValidationMessageConfig;
  /**
   * Optional i18n namespace for translating field labels and validation messages.
   * Defaults to 'features:forms'.
   */
  i18nNamespace?: string;
  /**
   * Optional outer facade interface (e.g. Form) to be passed as the 'form' parameter
   * in middleware callbacks instead of the raw FormCore engine.
   */
  facade?: IFormCore<any>;
  /**
   * Visual density for field layout: 'compact' | 'comfortable' | 'spacious'.
   * @default 'comfortable'
   */
  density?: "compact" | "comfortable" | "spacious";
  /**
   * Max consecutive failures before opening the circuit (default: 3).
   */
  circuitBreakerThreshold?: number;
  /**
   * Milliseconds to wait before attempting recovery (default: 30000).
   */
  circuitBreakerResetTimeoutMs?: number;
  /**
   * Max half-open probes before giving up (default: 2).
   */
  circuitBreakerMaxHalfOpenProbes?: number;
  /**
   * Form draft persistence configuration.
   * Enables autosaving and rehydration via sessionStorage, localStorage, or custom StorageAdapter.
   */
  persistence?: PersistenceConfig;
}

// ── Public Type Re-exports ─────────────────────────────────────────────────────

export type {
  InternalFormState,
  NormalizedForm,
  ValuesState,
  ValidityState,
  VisibilityState,
  ViewState,
  VitalityState,
  DetailedError,
  SectionEntity,
  FieldEntity,
  PersistenceConfig,
};

export { normalizeFormDefinition, denormalizeForm };

// ============================================================================
//  FORM ENGINE CORE (HEADLESS)
// ============================================================================

/**
 * The headless form engine. Framework-agnostic and fully testable without React.
 *
 * Composes 9 single-responsibility modules behind a unified API.
 * It has zero React dependency — it can run in Node.js, tests, or any UI framework.
 *
 * Prefer {@link Form} for React applications — it extends this class and adds
 * `getComponentProps()` via a bundled {@link ReactFormAdapter}.
 *
 * ---
 *
 * ### Quick-start
 * ```typescript
 * const form = new FormCore<{ name: string; role: string }>(definition, {
 *   name: "Alice",
 * });
 *
 * // Read state at any time
 * form.values;     // { name: "Alice", role: null }
 * form.validity;   // { name_id: { valid: true, errors: [] }, ... }
 *
 * // Mutate
 * await form.setValue("name", "Bob");          // full pipeline: validate + visibility
 * form.setTouched("name_id");                  // mark for error display
 * form.setError("name_id", { ... });           // apply server errors
 *
 * // Validate & submit
 * const ok = await form.submit();              // marks all touched, validates all
 * if (ok) await api.save(form.values);
 *
 * // React to changes
 * const unsub = form.subscribe(s => setUiState(s));
 * return () => unsub();                        // cleanup
 * ```
 *
 * ---
 *
 * ### Validation modes
 * | Mode       | When validation fires                                   |
 * |------------|---------------------------------------------------------|
 * | `onChange` | After every value change                                |
 * | `onBlur`   | When a field loses focus (recommended default)          |
 * | `onSubmit` | Only on `form.submit()`                                 |
 * | `manual`   | Only via `form.validateFields([...])`                   |
 * | `lazy`     | `onBlur` until first submit, then `onChange` thereafter |
 *
 * @template T - The typed form data shape.
 *   Specify for autocomplete on `form.values` and `form.setValue(name, value)`.
 *   Leave as default (`Record<string, any>`) for untyped use.
 *
 * @see {@link Form} — React-ready wrapper (adds `getComponentProps`)
 * @see {@link ValidationAdapter} — plug in Yup/Zod/custom validation
 */
export class FormCore<T extends Record<string, any> = Record<string, any>> {
  // ── Composition Modules ────────────────────────────────────────────────────
  // Public so advanced consumers and unit tests can reach individual modules
  // without going through the public API surface.

  /** Circuit breaker for fault isolation. @see {@link CircuitBreaker} */
  public circuitBreaker!: CircuitBreaker;
  /** Undo/redo history stack. @see {@link FormHistory} */
  public history!: FormHistory<T>;

  /** Normalizes the raw `FormDefinition` tree into flat O(1) maps. @see {@link FieldRegistry} */
  public registry!: FieldRegistry;
  /** Resolves field definitions by ID, name, or repeater path. @see {@link FieldResolver} */
  public resolver!: FieldResolver;
  /** Owns the 5V state tree and drives pub/sub reactivity. @see {@link StateManager} */
  public stateManager!: StateManager<T>;
  /** Single write gateway for all field error mutations. @see {@link ErrorManager} */
  public errorManager!: ErrorManager<T>;
  /** Development-mode structured logging (opt-in). @see {@link DebugManager} */
  public debugManager!: DebugManager<T>;
  /** Groups `ValueProxy`, `ConditionProxy`, and `FlowProxy`. @see {@link FormRuntime} */
  public runtime!: FormRuntime<T>;
  /** Coordinates per-field and whole-form validation. @see {@link FormValidator} */
  public validator!: FormValidator<T>;
  /** Computes cascading field visibility with side effects on hide. @see {@link FormVisibility} */
  public visibilityEngine!: FormVisibility<T>;
  /** Orchestrates the `setValue` pipeline and middleware chain. @see {@link FormExecution} */
  public execution!: FormExecution<T>;
  /** Manages async fetching of field options via the remoteOptions schema property. @see {@link RemoteOptionsManager} */
  public remoteOptions!: RemoteOptionsManager<T>;
  /** Handles materialization of dynamic repeater rows. */
  public repeaterFactory!: RepeaterRowFactory<T>;
  /** Draft persistence manager. @see {@link FormPersistenceManager} */
  public persistence?: FormPersistenceManager<T>;
  /** DOM element references registered via `register()`. */
  private elementRefs = new Map<string, any>();
  /** Field ids currently hidden by the runtime layer (e.g., permission `"hidden"`). */
  private hiddenFields = new Set<string>();

  /** Resolved engine options. Private — read via {@link getValidationMode}. */
  public options: FormCoreOptions<T>;

  // ── Shorthand Accessors ────────────────────────────────────────────────────

  /**
   * The flat normalized form definition.
   * Shorthand for `registry.definition`.
   *
   * @returns {@link NormalizedForm} — flat maps of `fields` and `sections`.
   */
  get definition() {
    return this.registry.definition;
  }

  /**
   * The live `InternalFormState` object containing all five V-slices.
   * Shorthand for `stateManager.state`.
   *
   * Prefer the typed getters (`form.values`, `form.validity`, etc.) for
   * reading individual slices — this is mainly useful for advanced serialization.
   *
   * @returns {@link InternalFormState}`<T>` — `{ values, validity, visibility, view, vitality, debug }`.
   */
  get state() {
    return this.stateManager.state;
  }

  /**
   * Pre-built map from field `name` → field `id` for all input fields.
   * Shorthand for `resolver.nameToIdMap`.
   *
   * @returns `Record<string, string>` — `{ [fieldName]: fieldId }`.
   *
   * @example
   * form.nameToIdMap["email"];  // → "email_field_abc123"
   */
  get nameToIdMap() {
    return this.resolver.nameToIdMap;
  }

  /**
   * Read/write field values by dot-notation path.
   * Shorthand for `runtime.valueProxy`.
   *
   * Prefer `form.setValue()` for mutations — this proxy bypasses the
   * full update pipeline (validation, visibility, middleware).
   *
   * @returns {@link ValueProxy} instance.
   *
   * @example
   * form.valueProxy.getValue(form.values, "address.city"); // → "London"
   */
  get valueProxy() {
    return this.runtime.valueProxy;
  }

  /**
   * Evaluates field visibility conditions against current values.
   * Shorthand for `runtime.conditionProxy`.
   *
   * @returns {@link ConditionProxy} instance.
   *
   * @example
   * form.conditionProxy.isVisible(field); // → true | false
   */
  get conditionProxy() {
    return this.runtime.conditionProxy;
  }

  /**
   * Wizard / multi-step navigation helper.
   * Shorthand for `runtime.flowProxy`.
   *
   * @returns {@link FlowProxy} instance.
   *
   * @example
   * const nextSection = form.flow.getNextStep(currentSectionId);
   * const isLast      = form.flow.isLastStep(currentSectionId);
   */
  get flow() {
    return this.runtime.flowProxy;
  }

  /**
   * Unified reactive transaction coordinator (10/10 Enterprise Requirement).
   * Manages multi-tier dependency propagation in deterministic topological order.
   */
  get coordinator() {
    return this.execution.coordinator;
  }

  // ── Constructor ────────────────────────────────────────────────────────────

  /**
   * Constructs the form engine and wires all 9 internal modules together.
   *
   * After the constructor returns, the engine is fully initialized:
   * - All fields are registered and their initial state is set.
   * - The initial visibility pass has run (fields with failing conditions are hidden).
   * - If `options.validateOnMount` is `true`, all fields have been validated.
   *
   * @param definition
   *   The raw hierarchical `FormDefinition` schema.
   *   Normalized internally into flat maps during construction — the raw object
   *   is not mutated.
   *
   * @param initialValues
   *   Optional partial data to pre-populate the form.
   *   Fields present here take precedence over `field.initialValue` in the schema.
   *   Fields absent from this object fall back to `field.initialValue` or `null`.
   *
   * @param validatorAdapter
   *   Optional custom {@link ValidationAdapter} (e.g., a Yup or Zod adapter).
   *   When provided, it **replaces** the built-in `ValidationProxy` entirely.
   *   When `undefined`, the internal registry-based `ValidationProxy` is used.
   *
   * @param messageConfig
   *   Per-field, per-rule error message overrides — only used with the built-in
   *   `ValidationProxy`. Shape: `{ [fieldId]: { [ruleCode]: "custom message" } }`.
   *   Has no effect when a custom `validatorAdapter` is provided.
   *
   * @param options
   *   Engine-level configuration:
   *   - `validationMode` — when validation fires (default: `'onBlur'`).
   *   - `validateOnMount` — run all field validations immediately (default: `false`).
   *
   * @example
   * // Typed, with custom validation mode:
   * const form = new FormCore<{ email: string; age: number }>(
   *   definition,
   *   { email: "alice@example.com" },
   *   undefined,        // use internal ValidationProxy
   *   undefined,        // no message overrides
   *   { validationMode: "onChange", validateOnMount: false }
   * );
   *
   * @example
   * // With a custom Yup adapter:
   * const form = new FormCore(definition, {}, new YupAdapter(mySchema));
   *
   * @see {@link ValidationProxy} — the built-in default adapter
   * @see {@link ValidationAdapter} — interface for custom adapters
   * @see {@link FormCoreOptions} — full options reference
   */
  constructor(
    definition: FormDefinition,
    initialValues?: Partial<T>,
    options?: FormCoreOptions<T>
  ) {
    this.options = {
      ...options,
      validationMode: options?.validationMode || "onBlur",
      validateOnMount: options?.validateOnMount ?? false,
    };

    const initError = this.initialize(definition, initialValues);
    if (initError) {
      console.error("[FormCore] Initialization failed:", initError);
    }
  }

  /**
   * Static factory that returns `null` on failure instead of throwing.
   * Use when you cannot tolerate a crash during construction.
   */
  static tryCreate<T extends Record<string, any>>(
    definition: FormDefinition,
    initialValues?: Partial<T>,
    options?: FormCoreOptions<T>
  ): FormCore<T> | null {
    try {
      return new FormCore<T>(definition, initialValues, options);
    } catch (err) {
      console.error("[FormCore] Failed to create FormCore instance:", err);
      return null;
    }
  }

  private initialize(
    definition: FormDefinition,
    initialValues?: Partial<T>
  ): Error | null {
    try {
      const canonicalDefinition = toCanonicalMetadataEvents(definition);

      // ─ 1-3: Core structure modules ─
      this.registry = new FieldRegistry(canonicalDefinition);
      this.resolver = new FieldResolver(this.registry, () => this.state);
      this.stateManager = new StateManager(
        this.registry.definition,
        initialValues,
        this.resolver
      );

      // ─ 4-6: Helper modules ─
      this.errorManager = new ErrorManager(this.stateManager, this.resolver);
      this.repeaterFactory = new RepeaterRowFactory(this.stateManager);
      this.debugManager = new DebugManager(this.stateManager);
      this.runtime = new FormRuntime(this.registry, this.stateManager);

      // ─ 7: Validator ─
      let effectiveValidator: ValidationAdapter<T>;
      const candidateSchema = this.options.schema || this.options.zodSchema;
      if (this.options.validatorAdapter) {
        effectiveValidator = this.options.validatorAdapter;
      } else if (
        candidateSchema &&
        typeof (candidateSchema as any).safeParse === "function"
      ) {
        effectiveValidator = new ZodValidationAdapter<T>(candidateSchema as any);
      } else {
        effectiveValidator = new ValidationProxy(
          this.options.messageConfig,
          this.runtime.reactiveEngine,
          this.options.i18nNamespace
        ) as unknown as ValidationAdapter<T>;
      }

      this.validator = new FormValidator(
        effectiveValidator,
        this.resolver,
        this.stateManager,
        this.errorManager,
        this.runtime,
        this.debugManager,
        (fieldId) => this.hiddenFields.has(fieldId)
      );

      // ─ 8: Visibility engine ─
      this.visibilityEngine = new FormVisibility(
        this.registry,
        this.resolver,
        this.stateManager,
        this.errorManager,
        this.runtime
      );

      // ─ 9: Execution orchestrator ─
      this.execution = new FormExecution(
        this.resolver,
        this.stateManager,
        this.runtime,
        this.validator,
        this.visibilityEngine,
        this.debugManager,
        () => this, // Always return FormCore instance, not facade
        this.options.validationDebounceMs
      );

      // ─ 9.5: Circuit breaker ─
      this.circuitBreaker = new CircuitBreaker({
        threshold: this.options.circuitBreakerThreshold,
        resetTimeoutMs: this.options.circuitBreakerResetTimeoutMs,
        maxHalfOpenProbes: this.options.circuitBreakerMaxHalfOpenProbes,
      });

      // ─ 9.6: History stack ─
      this.history = new FormHistory<T>(this.stateManager.state.values);

      // ─ 10: Remote options manager ─
      this.remoteOptions = new RemoteOptionsManager(
        this.stateManager,
        this.resolver,
        this.runtime,
        this.debugManager
      );

      // ─ 11: Persistence manager ─
      if (this.options.persistence) {
        this.persistence = new FormPersistenceManager(
          this.options.persistence,
          this.stateManager
        );
        if (this.options.persistence.autoRestore !== false) {
          this.persistence.restore();
        }
      }

      // ─ Post-init: computed fields, visibility, remote options, mount validation ─
      const allFields = this.registry.getAllFields();
      for (const f of allFields) {
        if (f.computed) {
          this.execution.coordinator.recomputeSingleComputedField(f.id);
        }
      }
      this.visibilityEngine.evaluateVisibility(this.stateManager.state.values);
      this.remoteOptions.initialize();

      if (this.options.validateOnMount) {
        const allFieldIds = Object.keys(this.registry.definition.fields);
        this.validator.validateFields(allFieldIds);
      }

      return null; // success
    } catch (err) {
      return err instanceof Error ? err : new Error(String(err));
    }
  }

  // ── Field Resolution ───────────────────────────────────────────────────────

  /**
   * Resolves a field definition from a field ID, field name, or a dynamic repeater path.
   *
   * Tries three lookup strategies in order (fastest first):
   * 1. **Direct ID lookup** (`O(1)`) — checks the normalized `fields` map directly.
   * 2. **Name-to-ID map lookup** (`O(1)`) — resolves a field's `name` to its `id`.
   * 3. **Dynamic path parsing** — e.g., `"users[0].email"` constructs a virtual
   *    `FormField` instance combining the repeater template with the row index.
   *
   * @param identifier
   *   - A field **ID** (e.g., `"email_field_abc123"`) — fastest.
   *   - A field **name** (e.g., `"email"`) — common string case.
   *   - A repeater **path** (e.g., `"users[0].email"`, `"items[2].address.city"`).
   *
   * @returns
   *   The `FormField` definition. For repeater paths, returns a **virtual field**:
   *   a cloned template with its `id` and `name` set to the full path string
   *   so that `ValueProxy` can use it directly for `get`/`set` operations.
   *   Returns `undefined` if no field matches any strategy.
   *
   * @example
   * form.resolveField("email");               // By name → { id: "email_id", ... }
   * form.resolveField("email_id");            // By ID   → same field
   * form.resolveField("users[0].email");      // Virtual → { id: "users[0].email", ... }
   * form.resolveField("unknown");             // → undefined
   *
   * @see {@link FieldResolver} — full resolver implementation
   */
  public resolveField(identifier: string): FormField | undefined {
    return this.resolver.resolveField(identifier);
  }

  // ── 5V State Accessors ─────────────────────────────────────────────────────
  // Read-only snapshots of the five orthogonal state slices.
  // All five are updated automatically by the engine — never mutate them directly.

  /**
   * **V1 — VALUES** — The current form data keyed by field `name`.
   *
   * In **development** (`NODE_ENV !== 'production'`), returns a deep `Proxy` that
   * fires `console.warn` if you try direct assignment like `form.values.name = "x"`.
   * Direct mutations bypass validation, visibility re-evaluation, and vitality tracking.
   * Always use {@link setValue} instead.
   *
   * In **production**, returns the raw object for zero overhead.
   *
   * @returns `T` — object keyed by field `name` (e.g. `{ email: "alice@...", age: 30 }`).
   *
   * @example
   * const { email, age } = form.values;
   * // or
   * console.log(form.values.email);
   */
  get values(): T {
    return this.runtime.getValues();
  }

  /**
   * **PAYLOAD** — Returns the current values with ephemeral and permission-hidden fields stripped out.
   *
   * Use this when constructing the final payload to submit to your server, ensuring
   * that UI-only state variables (like tabs, wizard steps, or mode toggles) do not
   * leak into the API request.
   *
   * @returns `Partial<T>` — The stripped payload.
   */
  getPayload(): Partial<T> {
    const payload = cloneDeep(this.values);

    // Find all ephemeral/hidden fields and remove them from the payload
    Object.values(this.registry.definition.fields).forEach((field: any) => {
      if (field.ephemeral || this.hiddenFields.has(field.id)) {
        const path = field.name || field.id;
        if (path) {
          unset(payload, path);
        }
      }
    });

    return payload;
  }

  /**
   * Replaces the set of field ids treated as hidden by the runtime layer
   * (e.g., permission `"hidden"`). Hidden fields are excluded from
   * {@link getPayload} and skipped during validation, like invisible fields.
   *
   * Pass an empty array to restore normal behavior for all fields.
   *
   * @param ids - Field ids to hide. The set fully replaces any previous one.
   */
  setHiddenFields(ids: string[]): void {
    this.hiddenFields = new Set(ids);
  }

  /**
   * **V2 — VALIDITY** — Per-field validation results.
   *
   * @returns `Readonly<ValidityState>` — map of `fieldId` → `{ valid: boolean, errors: DetailedError[] }`.
   *
   * @example
   * const { valid, errors } = form.validity["email_id"];
   * if (!valid) console.log(errors[0].message); // "Email is required"
   *
   * @see {@link ErrorManager} — the module that writes to this slice
   * @see {@link setError}, {@link setErrors} — programmatic error injection
   */
  get validity(): Readonly<ValidityState> {
    return this.stateManager.validity;
  }

  /**
   * **V3 — VISIBILITY** — Per-field boolean visibility flag.
   *
   * Automatically updated after every {@link setValue} call.
   * Hidden fields (`visibility[fieldId] === false`) have their errors cleared
   * and values set to `null` — they won't appear in the submit payload.
   *
   * @returns `Readonly<VisibilityState>` — map of `fieldId` → `boolean`.
   *
   * @example
   * if (!form.visibility["conditional_field_id"]) return null; // don't render
   *
   * @see {@link FormVisibility} — the module that drives this slice
   */
  get visibility(): Readonly<VisibilityState> {
    return this.stateManager.visibility;
  }

  /**
   * **RENDER TREE** — Static intermediate representation of the form structure.
   *
   * Computed once during normalization. Used by the Render Engine to drive
   * the UI layout without re-walking the hierarchical schema on every render.
   *
   * @returns `RenderNode[]` — the static structural tree.
   */
  get renderTree(): import("./int-types").RenderNode[] {
    return this.registry.definition.renderTree;
  }

  /**
   * **V4 — VIEW** — Per-field dynamic display properties.
   *
   * Populated from `field.label`, `field.properties`, and any runtime overrides
   * applied by middleware (e.g., dynamically disabling a field).
   *
   * @returns `Readonly<ViewState>` — map of `fieldId` → `{ label, componentProps, style, ... }`.
   *
   * @example
   * const { label, componentProps } = form.view["role_id"];
   */
  get view(): Readonly<ViewState> {
    return this.stateManager.view;
  }

  /**
   * **V5 — VITALITY** — Per-field user-interaction bookkeeping.
   *
   * - `touched` — user has blurred or submitted this field at least once.
   *   Most UIs use this to gate error display: errors only shown when `touched === true`.
   * - `dirty` — value has changed from its initialized value.
   * - `focused` — field currently has focus (reserved; not yet written by the engine).
   * - `version` — monotonically increasing counter, incremented on every `setValue`.
   *
   * @returns `Readonly<VitalityState>` — map of `fieldId` → `{ touched, dirty, focused, version }`.
   *
   * @example
   * // Show error only if the user has interacted with the field:
   * const { touched } = form.vitality["email_id"];
   * const { valid, errors } = form.validity["email_id"];
   * if (touched && !valid) showError(errors[0].message);
   *
   * @see {@link setTouched} — programmatically mark a field as touched
   */
  get vitality(): Readonly<VitalityState> {
    return this.stateManager.vitality;
  }

  get uiState(): Readonly<import("./int-types").UIState> | undefined {
    return this.stateManager.state.uiState;
  }

  get businessState():
    | Readonly<import("./int-types").BusinessState>
    | undefined {
    return this.stateManager.state.businessState;
  }

  public setUIState(uiState: Partial<import("./int-types").UIState>): void {
    this.stateManager.update((prev) => ({
      ...prev,
      uiState: { ...prev.uiState, ...uiState },
    }));
  }

  public setBusinessStage(stage: string): void {
    this.stateManager.update((prev) => ({
      ...prev,
      businessState: {
        lifecycleStage: stage,
        previousStage: prev.businessState?.lifecycleStage,
        ...prev.businessState,
      },
    }));
  }

  get isDirty(): boolean {
    const visibleIds = Object.keys(this.visibility).filter(
      (id) => this.visibility[id]
    );
    return visibleIds.some((id) => this.vitality[id]?.dirty);
  }

  /**
   * Resets the entire form state to its initial configuration.
   *
   * @param initialValues - Optional new set of data to populate the form with.
   * @param options - Preservation options for touched/dirty states and specific values.
   */
  public reset(
    initialValues?: Partial<T>,
    options?: {
      keepTouched?: boolean | string[];
      keepDirty?: boolean | string[];
      keepValues?: string[];
    }
  ) {
    this.stateManager.reset(initialValues, options);
    // After state reset, we MUST re-evaluate visibility as values have changed
    this.visibilityEngine.evaluateVisibility(this.stateManager.state.values);
    // Clear history on reset
    this.history.clear();
  }

  /**
   * **V2 — VALIDITY — GLOBAL CHECK**
   * Returns true if all currently visible fields are valid.
   * Leverages the granular `validity` state for O(1) evaluation per field.
   */
  get isValid(): boolean {
    const visibleIds = Object.keys(this.visibility).filter(
      (id) => this.visibility[id]
    );
    return visibleIds.every((id) => this.errorManager.isValid(id));
  }

  /**
   * Updates the form's locale at runtime.
   *
   * This method:
   * 1. Bumps the state version to invalidate UI caches.
   * 2. Re-triggers validation for all fields to refresh error messages in the new language.
   * 3. Re-evaluates visibility in case conditions depend on localized data (rare but possible).
   *
   * @param locale - The new locale code (e.g., 'en', 'es').
   */
  public async setLocale(_locale: string) {
    // 1. Notify that the state has changed (bumps version)
    // This invalidates ReactFormAdapter caches so labels/placeholders are re-resolved
    this.stateManager.notify();

    // 2. Re-validate all fields to translate existing error messages
    const allFieldIds = Object.keys(this.registry.definition.fields);
    const activeFieldIds = allFieldIds.filter(
      (id) => this.stateManager.state.vitality[id]
    );

    // We only re-validate fields that already have errors or have been touched
    // to avoid flashing "required" errors on pristine forms just by switching language.
    const fieldsToRevalidate = activeFieldIds.filter((id) => {
      const isInvalid = !this.stateManager.state.validity[id]?.valid;
      const isTouched = this.stateManager.state.vitality[id]?.touched;
      return isInvalid || isTouched;
    });

    if (fieldsToRevalidate.length > 0) {
      await this.validator.validateFields(fieldsToRevalidate);
    }
  }

  /**
   * Returns true if the engine is operating in degraded mode
   * (circuit breaker is open for critical operations).
   */
  get isDegraded(): boolean {
    return this.circuitBreaker.isOpen();
  }

  /**
   * Returns the current state version.
   * Monotonically increasing counter incremented on every state mutation.
   */
  get version(): number {
    return this.stateManager.version;
  }

  /**
   * Returns the current structural state version.
   * Incremented only on global (structural) state notifications — NOT on per-field
   * atomic updates. Provides an O(1) comparison key for useSyncExternalStore snapshots.
   */
  get structuralVersion(): number {
    return this.stateManager.structuralVersion;
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Sets a field's value and executes the full update pipeline.
   *
   * **Pipeline (in order):**
   * 1. Writes `value` into `form.values[field.name]` via `ValueProxy`.
   * 2. Marks the field `dirty: true` and increments its `version`.
   * 3. Runs validation — **only if** `validationMode === 'onChange'`.
   * 4. Runs all registered {@link use} middleware functions (in order, awaited).
   * 5. Re-evaluates visibility for all fields; clears errors/values on newly hidden fields.
   * 6. Notifies all {@link subscribe} listeners.
   *
   * @param fieldIdentifier
   *   The field's `name` (e.g., `"email"`) or `id` (e.g., `"email_field_abc123"`).
   *   For repeater rows, a full path (e.g., `"users[0].email"`) is also accepted.
   *
   * @param value
   *   The new value to assign. Must be compatible with the field's type.
   *   Pass `null` to explicitly clear a field.
   *
   * @returns `Promise<void>` — resolves after validation and all middleware settle.
   *
   * @example
   * await form.setValue("email", "alice@example.com");
   * await form.setValue("age", 30);
   * await form.setValue("users[0].name", "Alice"); // repeater row
   * await form.setValue("country", null);          // clear a field
   *
   * @see {@link values} — read the current value after the update
   * @see {@link use} — register middleware that runs after each setValue
   */
  getValue<P extends FieldPath<T>>(path: P): PathValue<T, P>;
  getValue(path: string): unknown;
  getValue(path: string): unknown {
    return this.runtime.valueProxy.getValue(this.stateManager.state.values, path);
  }

  setValue<P extends FieldPath<T>>(fieldIdentifier: P, value: PathValue<T, P>): Promise<void>;
  setValue(fieldIdentifier: string, value: unknown): Promise<void>;
  async setValue(fieldIdentifier: string | keyof T, value: any): Promise<void> {
    return this.circuitBreaker.guard(
      async () => {
        await this.execution.setValue(fieldIdentifier, value);
        this.history.push(this.stateManager.state.values);
      },
      undefined,
      fieldIdentifier as string
    );
  }

  /**
   * Sets the `touched` flag for a field in the {@link vitality} state slice.
   *
   * Most UI components gate error display behind `touched === true` — this is how
   * you prevent errors from flashing before the user has interacted with a field.
   *
   * The engine calls `setTouched(fieldId, true)` automatically:
   * - In {@link ReactFormAdapter} on every field `onBlur` event.
   * - In {@link submit} — all active fields are marked touched before validation.
   *
   * @param fieldId
   *   The **field ID** (not name) to update.
   *   Use {@link nameToIdMap} if you only have the field's name.
   *
   * @param touched
   *   `true` to mark the field as touched (default).
   *   `false` to unmark it — useful when resetting a form.
   *
   * @returns `void`
   *
   * @example
   * form.setTouched("email_id");         // mark touched
   * form.setTouched("email_id", false);  // unmark (reset)
   * form.setTouched(form.nameToIdMap["email"]); // from name
   *
   * @see {@link vitality} — read the current touched state
   * @see {@link submit} — marks all fields touched before full validation
   */
  setTouched(fieldId: string, touched = true): void {
    this.stateManager.setVitality(fieldId, { touched });
  }

  /**
   * Sets specific vitality state for a field (focused, dirty, etc).
   */
  setVitality(fieldId: string, vitality: Partial<VitalityState[string]>): void {
    this.stateManager.setVitality(fieldId, vitality);
  }

  /**
   * Pins a field's state slice to prevent it from being purged when the component unmounts.
   * Essential for virtualized lists (Level 3 Handlers) and background background tasks.
   */
  public pinField(fieldId: string, pinned: boolean = true) {
    this.stateManager.setVitality(fieldId, { pinned });
  }

  /**
   * Batches multiple form operations into a single notification pass.
   */
  public async batch(fn: () => void | Promise<void>): Promise<void> {
    await this.stateManager.batch(fn);
  }

  /**
   * Appends a new row to an array/repeater field.
   * Auto-assigns an immutable `_rowId` and returns it.
   */
  public appendRow(
    repeaterPath: string,
    initialRowData: Record<string, any> = {}
  ): string {
    const rowId = this.stateManager.appendRow(repeaterPath, initialRowData);
    this.history.push(this.stateManager.state.values);
    this.visibilityEngine.evaluateVisibility(this.stateManager.state.values);
    return rowId;
  }

  /**
   * Removes a row by index or stable `_rowId`.
   * Cleans up 5V state slices for that row only, preserving all other rows' states.
   */
  public removeRow(repeaterPath: string, indexOrRowId: number | string): void {
    this.stateManager.removeRow(repeaterPath, indexOrRowId);
    this.history.push(this.stateManager.state.values);
    this.visibilityEngine.evaluateVisibility(this.stateManager.state.values);
  }

  /**
   * Moves a row from `fromIndex` to `toIndex`.
   * Reorders array elements without altering internal state slices of any row.
   */
  public moveRow(
    repeaterPath: string,
    fromIndex: number,
    toIndex: number
  ): void {
    this.stateManager.moveRow(repeaterPath, fromIndex, toIndex);
    this.history.push(this.stateManager.state.values);
  }

  /**
   * Registers a raw HTML input element (RHF-compatible ergonomics).
   * Returns props spreadable onto native JSX `<input>`, `<select>`, `<textarea>`.
   *
   * @param name - The field name or dot-notation path.
   * @param options - Value coercion options (valueAsNumber, valueAsDate).
   *
   * @example
   * <input {...form.register("email")} />
   * <input type="number" {...form.register("age", { valueAsNumber: true })} />
   */
  public register(
    name: string,
    options?: import("./form-interface").RegisterOptions
  ): import("./form-interface").RegisterReturn {
    const field = this.resolver.resolveField(name);
    const fieldId = field?.id || this.resolver.nameToIdMap[name] || name;
    const dataPath = field?.name || name;

    return {
      name: dataPath,
      defaultValue: this.runtime.valueProxy.getValue(
        this.stateManager.state.values,
        dataPath
      ),
      onChange: (event: any) => {
        let val = event;
        if (event && event.target !== undefined) {
          const target = event.target;
          val = target.type === "checkbox" ? target.checked : target.value;
        }

        if (options?.valueAsNumber) {
          val =
            val === "" || val === null || val === undefined ? null : Number(val);
        } else if (options?.valueAsDate) {
          val =
            val === "" || val === null || val === undefined
              ? null
              : new Date(val);
        }

        return this.setValue(dataPath as any, val);
      },
      onBlur: () => {
        this.setTouched(fieldId, true);
        this.execution.handleFieldBlur(fieldId);
      },
      ref: (el: any) => {
        if (el && typeof el.focus === "function") {
          this.elementRefs.set(fieldId, el);
          this.elementRefs.set(dataPath, el);
        } else {
          this.elementRefs.delete(fieldId);
          this.elementRefs.delete(dataPath);
        }
      },
    };
  }

  /**
   * Programmatically focuses the DOM element for a field if registered via `register()`.
   */
  public focusField(fieldIdentifier: string): boolean {
    const el = this.elementRefs.get(fieldIdentifier);
    if (el && typeof el.focus === "function") {
      el.focus();
      return true;
    }
    return false;
  }

  /**
   * Initializes optimistic locking for the form engine.
   */
  public initConcurrency(baseVersion: number, etag?: string) {
    this.stateManager.initConcurrency(baseVersion, etag);
  }

  /**
   * Records a server-side conflict for a specific field.
   */
  public reportConflict(fieldId: string, serverValue: any, clientValue: any) {
    this.stateManager.reportConflict(fieldId, serverValue, clientValue);
  }

  /**
   * Clears any saved draft from storage.
   */
  public async clearDraft(): Promise<void> {
    await this.persistence?.clear();
  }

  /**
   * Restores draft values and UI state from storage.
   */
  public async restoreDraft(): Promise<boolean> {
    return (await this.persistence?.restore()) ?? false;
  }

  /**
   * Immediately persists current form state to storage without waiting for debounce.
   */
  public async saveDraft(): Promise<void> {
    await this.persistence?.save();
  }

  /**
   * Destroys engine subscriptions and timers (e.g., persistence autosave).
   */
  public destroy() {
    this.persistence?.destroy();
  }

  /**
   * Resolves the full set of props for a component via the Resolution Pipeline.
   */
  public getComponentProps(
    fieldId: string
  ): import("./int-types").ResolvedFieldProps {
    const context: import("./modules/resolution-pipeline").ResolutionContext = {
      cache: new Map(),
      form: this,
    };

    const node = this.registry.definition.renderNodes[fieldId];
    if (!node) {
      // For repeater rows, we may need to resolve a virtual field first
      const field = this.resolver.resolveField(fieldId);
      if (field) {
        const fieldEntity = field as FieldEntity;
        // Build a synthetic node for the repeater row field
        const syntheticNode: RenderNode = {
          stateKey: fieldId,
          dataPath: fieldEntity.name || fieldId,
          id: fieldId,
          fieldType: field.type,
          category: "input",
          capabilities: fieldEntity.capabilities || { hasValue: true },
          depth: 0,
          parentId: fieldEntity.parentId || null,
          children: [],
          rowGroup: null,
          visibilityKey: fieldId,
        };
        return (
          ResolutionPipeline.resolve(
            syntheticNode,
            this.state,
            this.options.density || "comfortable",
            undefined,
            context
          ) ?? ({} as ResolvedFieldProps)
        );
      }
      return {} as ResolvedFieldProps;
    }

    return (
      ResolutionPipeline.resolve(
        node,
        this.stateManager.state,
        this.options.density || "comfortable",
        undefined,
        context
      ) ?? ({} as ResolvedFieldProps)
    );
  }

  /**
   * Injects a single programmatic error into a field's {@link validity} state.
   *
   * **Primary use-case**: applying server-side validation errors after an API call
   * so they appear in the UI alongside client-side errors.
   *
   * The error **replaces** any existing errors on the field — it does not append.
   * For multiple errors on one field, use `setErrors` targeting the same `fieldId`.
   *
   * @param fieldId
   *   The **field ID** to attach the error to.
   *   Use `form.nameToIdMap["fieldName"]` to convert a name to ID.
   *
   * @param error
   *   A {@link DetailedError} object: `{ code, message, fieldId }`.
   *   - `code`    — machine-readable error key (e.g., `"taken"`, `"server_error"`).
   *   - `message` — human-readable text displayed in the UI.
   *   - `fieldId` — must match the `fieldId` parameter (the engine reads it from the object).
   *
   * @returns `void`
   *
   * @example
   * // After a failed API submission:
   * form.setError("email_id", {
   *   code: "taken",
   *   message: "This email is already registered",
   *   fieldId: "email_id",
   * });
   *
   * @see {@link setErrors} — apply multiple field errors at once
   * @see {@link validity} — read the resulting error state
   * @see {@link ErrorManager.setError} — underlying implementation
   */
  setError(fieldId: string, error: DetailedError): void {
    this.errorManager.setError(fieldId, error);
  }

  /**
   * Injects programmatic errors across multiple fields simultaneously.
   *
   * Each entry in the `errors` array is routed to its field via `error.fieldId`.
   * Designed for mapping a batch of server validation errors onto the form after
   * a failed API submission.
   *
   * @param errors
   *   Array of {@link DetailedError} objects.
   *   Each entry **must** include a `fieldId` property that matches an existing field.
   *   Entries for unknown `fieldId`s are still written but will have no visible effect.
   *
   * @returns `void`
   *
   * @example
   * // Apply a server error response to the form:
   * form.setErrors([
   *   { code: "taken",   message: "Email already in use",    fieldId: "email_id"  },
   *   { code: "invalid", message: "Phone number is invalid", fieldId: "phone_id"  },
   * ]);
   *
   * @see {@link setError} — apply a single error
   * @see {@link validity} — read the resulting error state
   */
  setErrors(errors: DetailedError[]): void {
    errors.forEach((error) => {
      this.errorManager.setError(error.fieldId, error);
    });
  }

  /**
   * Swaps the active validation adapter at runtime.
   *
   * Useful for scenarios where the validation strategy needs to change dynamically:
   * - Switching from client-side to server-side validation after login.
   * - Applying a stricter schema after a wizard step completes.
   * - Hot-swapping adapters in tests.
   *
   * The swap takes effect on the **next** `setValue` / `submit` call —
   * existing errors in the validity state are not automatically cleared.
   *
   * @param validator
   *   Any object implementing the {@link ValidationAdapter} interface.
   *   Examples: `new ValidationProxy()`, `new YupAdapter(schema)`, `new ZodAdapter(schema)`.
   *
   * @returns `void`
   *
   * @example
   * // Start with internal validation, then switch to a Yup schema after step 1:
   * form.setValidator(new YupAdapter(strictSchema));
   *
   * @see {@link ValidationAdapter} — the interface to implement
   * @see {@link ValidationProxy} — the built-in default adapter
   */
  setValidator(validator: ValidationAdapter): void {
    this.validator.setValidator(validator);
  }

  /**
   * Runs full-form validation and returns whether the form is safe to submit.
   *
   * **What this does (in order):**
   * 1. Marks **all active fields** as `touched: true` — ensures errors display even
   *    for fields the user hasn't interacted with.
   * 2. Validates every active field in parallel via the current {@link ValidationAdapter}.
   *    Hidden fields (`visibility[id] === false`) are automatically skipped.
   * 3. Returns `true` only if every validity entry has `valid: true`.
   *
   * @returns `Promise<boolean>`
   *   - `true`  — all active fields passed validation; safe to call your submit API.
   *   - `false` — one or more fields failed; `form.validity` contains the errors.
   *
   * @example
   * const handleSubmit = async () => {
   *   const isValid = await form.submit();
   *   if (!isValid) return;                   // UI will now show errors
   *   await api.createEmployee(form.values);  // safe to persist
   * };
   *
   * @example
   * // Apply server errors after a 422 response:
   * const isValid = await form.submit();
   * if (!isValid) return;
   * const { error } = await api.save(form.values).catch(e => e);
   * if (error?.fieldErrors) form.setErrors(error.fieldErrors);
   *
   * @see {@link validateFields} — validate a specific subset (e.g., one wizard step)
   * @see {@link setErrors} — inject server-side errors after submission
   * @see {@link validity} — inspect per-field errors after the call
   */
  async submit(): Promise<boolean> {
    return this.circuitBreaker.guard(async () => {
      // Determine active fields (excludes repeater templates and fields that
      // belong to review-only submit-landing sections — those are review
      // surfaces the wizard submits from, never completed interactively).
      const definition = this.resolver.registry.definition;
      const reviewOnlySectionIds = new Set(
        Object.values(definition.sections)
          .filter((s) => s.layout?.reviewOnly === true)
          .map((s) => s.id)
      );
      const allFieldIds = Object.keys(definition.fields);
      const activeFieldIds = allFieldIds.filter((id) => {
        if (!this.stateManager.state.vitality[id]) return false;
        const field = definition.fields[id];
        return !(field && reviewOnlySectionIds.has(field.sectionId));
      });

      // Mark all active fields as touched
      activeFieldIds.forEach((id) => {
        this.stateManager.setVitality(id, { touched: true });
      });
      this.stateManager.notify();

      // Use forceful validation to bypass any pending debounces
      const isValid = await this.validateFields(activeFieldIds);

      // Clear draft persistence upon successful submit
      if (
        isValid &&
        this.options.persistence &&
        this.options.persistence.clearOnSubmit !== false
      ) {
        await this.persistence?.clear();
      }

      return isValid;
    }, false);
  }

  /**
   * Validates a specific subset of fields and returns whether all are valid.
   *
   * Runs each field's validation against the current {@link ValidationAdapter} in parallel.
   * Does **not** mark fields as `touched` — call {@link setTouched} manually if you need
   * error display to appear after this call.
   *
   * @param fieldIds
   *   Array of **field IDs** (not names) to validate.
   *   Fields that are hidden (`visibility[fieldId] === false`) are validated but
   *   their errors are cleared immediately after — they won't block the return value.
   *
   * @returns `Promise<boolean>`
   *   - `true`  — all specified fields are valid.
   *   - `false` — at least one specified field failed validation.
   *
   * @example
   * // Per-step validation in a wizard:
   * const step1FieldIds = ["name_id", "email_id", "dob_id"];
   * const step1Valid = await form.validateFields(step1FieldIds);
   * if (step1Valid) goToStep(2);
   *
   * @see {@link submit} — validate all fields + mark all touched (for final submit)
   * @see {@link validity} — inspect per-field errors after the call
   */
  async validateFields(fieldIds: string[]): Promise<boolean> {
    const promises = fieldIds.map((id) =>
      this.execution.forceValidateField(id)
    );
    await Promise.all(promises);
    return fieldIds.every((id) => this.errorManager.isValid(id));
  }

  // ── Middleware ──────────────────────────────────────────────────────────────

  /**
   * Registers a middleware function that runs after every {@link setValue} call.
   *
   * Middleware is the **canonical way** to handle cross-field side effects:
   * - Prefilling dependent fields (e.g., set `end_date` when `start_date` changes).
   * - Loading async options (e.g., fetch cities after a country is selected).
   * - Resetting a child field when its parent changes.
   * - Analytics / logging on field changes.
   *
   * Multiple middleware functions can be registered. They run **in registration order**,
   * each fully awaited before the next runs (sequential, not parallel).
   *
   * The middleware runs **between** validation and the final state notification,
   * so listeners see the fully resolved state including middleware side-effects.
   *
   * @param fn
   *   A sync or async function receiving `{ form, fieldId }`:
   *   - `form`    — the live `FormCore<T>` instance; can call `setValue`, read state, etc.
   *   - `fieldId` — the **ID** of the field that just changed.
   *
   * @returns `void` — no unregister mechanism; middleware persists for the form's lifetime.
   *
   * @example
   * // Prefill end_date to 30 days after start_date:
   * form.use(async ({ form, fieldId }) => {
   *   if (fieldId !== form.nameToIdMap["start_date"]) return;
   *   const start = new Date(form.values.start_date);
   *   if (!start) return;
   *   const end = new Date(start);
   *   end.setDate(end.getDate() + 30);
   *   await form.setValue("end_date", end.toISOString().split("T")[0]);
   * });
   *
   * @example
   * // Load city options when country changes:
   * form.use(async ({ form, fieldId }) => {
   *   if (fieldId !== form.nameToIdMap["country"]) return;
   *   const cities = await api.getCities(form.values.country);
   *   form.state.view[form.nameToIdMap["city"]].componentProps.options = cities;
   * });
   *
   * @see {@link FormExecution.use} — underlying implementation
   */
  use(
    fn: (context: {
      form: FormCore<T>;
      fieldId?: string;
    }) => void | Promise<void>
  ): void {
    this.execution.use(fn);
  }

  // ── Options ────────────────────────────────────────────────────────────────

  /**
   * Returns the active {@link ValidationMode} for this form instance.
   *
   * Used internally by {@link FormExecution} and {@link ReactFormAdapter} to decide
   * when to trigger field validation.
   * Exposed publicly so external consumers (e.g., custom adapters) can query mode
   * without reaching into `options` directly.
   *
   * @returns The current `ValidationMode` value (`'onChange'` | `'onBlur'` | `'onSubmit'` | `'manual'` | `'lazy'`).
   *   Always defined — defaults to `'onBlur'` if not specified in options.
   *
   * @example
   * form.getValidationMode(); // → 'onBlur'
   */
  getValidationMode(): ValidationMode {
    return this.options.validationMode!;
  }

  /**
   * Whether incoming values are sanitized and validated before being written.
   *
   * Resolved from the engine option, falling back to the form-level
   * `validation.disableDeferredValidation` schema setting, so a page can opt in
   * from its schema without threading options through every form instance.
   *
   * @returns `true` when `setValue` screens candidates pre-write.
   */
  isDeferredValidationDisabled(): boolean {
    if (this.options.disableDeferredValidation !== undefined) {
      return this.options.disableDeferredValidation;
    }
    // Form-level settings survive normalization on `metadata` (Omit<FormDefinition, "sections">).
    return (
      this.definition.metadata?.validation?.disableDeferredValidation === true
    );
  }

  /**
   * Resets the circuit breaker, allowing degraded forms to recover.
   */
  resetCircuitBreaker() {
    this.circuitBreaker.reset();
  }

  /**
   * Reverts to the previous history snapshot.
   * Returns true if undo was performed, false if no history exists.
   */
  async undo(): Promise<boolean> {
    const snapshot = this.history.undo();
    if (!snapshot) return false;
    return this.restoreSnapshot(snapshot);
  }

  /**
   * Re-applies a previously undone snapshot.
   * Returns true if redo was performed, false if no future exists.
   */
  async redo(): Promise<boolean> {
    const snapshot = this.history.redo();
    if (!snapshot) return false;
    return this.restoreSnapshot(snapshot);
  }

  /** Whether undo is available. */
  get canUndo(): boolean {
    return this.history.canUndo;
  }

  /** Whether redo is available. */
  get canRedo(): boolean {
    return this.history.canRedo;
  }

  /** Restore field values from a history snapshot. */
  private async restoreSnapshot(
    snapshot: Record<string, any>
  ): Promise<boolean> {
    const entries = Object.entries(snapshot);
    if (entries.length === 0) return false;

    await this.stateManager.batch(async () => {
      for (const [name, value] of entries) {
        await this.execution.setValue(name, value);
      }
    });

    return true;
  }

  // ── Reactivity ─────────────────────────────────────────────────────────────

  /**
   * Registers a listener that is called synchronously after every state mutation.
   *
   * Mutations that trigger notification:
   * `setValue`, `setTouched`, `setError`, `setErrors`, `setValidator`, and
   * any internal module that calls `stateManager.notify()` (validation, visibility, etc.).
   *
   * The listener receives the **same** `InternalFormState<T>` object reference each time
   * (mutated in-place). If you store it in React state, shallow-spread it:
   * `setState({ ...state })` to force a re-render.
   *
   * @param listener
   *   Callback invoked on every state change.
   *   Receives `InternalFormState<T>` — the full 5V state plus debug info.
   *
   * @returns
   *   An **unsubscribe function** — call it to remove this listener and prevent
   *   memory leaks. Always call it in cleanup: `useEffect(() => form.subscribe(...), [])` → return it.
   *
   * @example
   * // Minimal custom React hook:
   * function useFormState<T>(form: FormCore<T>) {
   *   const [state, setState] = useState(() => ({ ...form.state }));
   *   useEffect(() => {
   *     return form.subscribe(s => setState({ ...s })); // unsub on unmount
   *   }, [form]);
   *   return state;
   * }
   *
   * @example
   * // Outside React (plain observer):
   * const unsub = form.subscribe(state => console.log("values:", state.values));
   * // Later:
   * unsub(); // stop listening
   *
   * @see {@link InternalFormState} — the shape of the state object passed to the listener
   * @see {@link StateManager.subscribe} — underlying implementation
   */
  subscribe(listener: (state: InternalFormState<T>) => void): () => void {
    return this.stateManager.subscribe(listener);
  }

  /**
   * Registers a listener for a specific field's state changes.
   * This is the bridge for atomic re-renders in the view layer.
   */
  subscribeToField(
    fieldId: string,
    listener: (state: InternalFormState<T>) => void
  ): () => void {
    return this.stateManager.subscribeToField(fieldId, listener);
  }

  // ── External Store Bridge ──────────────────────────────────────────────────

  /**
   * Returns the exact `{ subscribe, getSnapshot, getServerSnapshot }` tuple
   * that `useSyncExternalStore` expects, for subscribing to global form state.
   *
   * Use this to integrate FormCore with any external state system (Zustand,
   * Redux, Jotai, or plain `useSyncExternalStore`).
   *
   * @example
   * // In a React component outside the form tree:
   * import { useSyncExternalStore } from "react";
   *
   * function FormStatus({ form }) {
   *   const { subscribe, getSnapshot } = form.toSyncExternalStore();
   *   const version = useSyncExternalStore(subscribe, getSnapshot);
   *   return <span>Form v{version}</span>;
   * }
   *
   * @example
   * // Zustand integration:
   * const store = create((set) => ({
   *   formVersion: 0,
   *   syncWithForm: (form) => {
   *     const { subscribe, getSnapshot } = form.toSyncExternalStore();
   *     subscribe(() => set({ formVersion: getSnapshot() }));
   *   },
   * }));
   */
  toSyncExternalStore(): {
    subscribe: (callback: () => void) => () => void;
    getSnapshot: () => number;
    getServerSnapshot: () => number;
  } {
    return {
      subscribe: (callback) => this.stateManager.subscribe(callback),
      getSnapshot: () => this.stateManager.structuralVersion,
      getServerSnapshot: () => this.stateManager.structuralVersion,
    };
  }

  /**
   * Returns a `useSyncExternalStore`-compatible tuple for a single field's props.
   *
   * The `getSnapshot` returns the cached `FieldComponentProps` from the React
   * adapter — referentially stable between renders unless the field's state changed.
   *
   * @param fieldId - The field's internal state key (e.g., `"email_field_id"`).
   *
   * @example
   * function ExternalFieldDisplay({ form, fieldId }) {
   *   const { subscribe, getSnapshot } = form.toFieldSyncExternalStore(fieldId);
   *   const props = useSyncExternalStore(subscribe, getSnapshot);
   *   return <div>{props.label}: {props.value}</div>;
   * }
   */
  toFieldSyncExternalStore(fieldId: string): {
    subscribe: (callback: () => void) => () => void;
    getSnapshot: () => ResolvedFieldProps;
    getServerSnapshot: () => ResolvedFieldProps;
  } {
    const fallback: ResolvedFieldProps = {
      dataPath: fieldId,
      stateKey: fieldId,
      id: fieldId,
      rowGroup: null,
      density: "comfortable",
      componentProps: {},
    };
    return {
      subscribe: (callback) =>
        this.stateManager.subscribeToField(fieldId, callback),
      getSnapshot: () => this.getComponentProps(fieldId),
      getServerSnapshot: () => fallback,
    };
  }

  /**
   * Returns a `useSyncExternalStore`-compatible tuple for a derived slice of form state.
   *
   * Only triggers re-renders when the selected slice actually changes (identity check).
   *
   * @param selector - Pure function that extracts a slice from `InternalFormState`.
   * @returns `{ subscribe, getSnapshot }` for `useSyncExternalStore`.
   *
   * @example
   * // Subscribe to only the validity slice:
   * const { subscribe, getSnapshot } = form.toSliceSyncExternalStore(
   *   (state) => state.validity
   * );
   * const validity = useSyncExternalStore(subscribe, getSnapshot);
   *
   * @example
   * // Subscribe to a computed value:
   * const { subscribe, getSnapshot } = form.toSliceSyncExternalStore(
   *   (state) => Object.keys(state.visibility).filter(k => state.visibility[k])
   * );
   * const visibleFields = useSyncExternalStore(subscribe, getSnapshot);
   */
  toSliceSyncExternalStore<TSlice>(
    selector: (state: InternalFormState<T>) => TSlice
  ): {
    subscribe: (callback: () => void) => () => void;
    getSnapshot: () => TSlice;
    getServerSnapshot: () => TSlice;
  } {
    let currentValue = selector(this.stateManager.state);
    return {
      subscribe: (callback) =>
        this.stateManager.subscribe(() => {
          const next = selector(this.stateManager.state);
          if (next !== currentValue) {
            currentValue = next;
            callback();
          }
        }),
      getSnapshot: () => currentValue,
      getServerSnapshot: () => currentValue,
    };
  }
}
