/**
 * @file react-adapter.ts
 * @description Bridges the headless FormCore engine to React component props.
 *
 * ## Responsibility
 * `ReactFormAdapter` is an **anti-corruption layer** between the pure TypeScript
 * engine (`FormCore`) and React UI components. It translates engine state and events
 * into a React-friendly props object via `getComponentProps()`.
 *
 * This separation means:
 * - `FormCore` never imports React or knows about JSX.
 * - UI components never care about the engine internals.
 * - The adapter is the one place where framework coupling lives.
 *
 * ## Props built by `getComponentProps(fieldId)`
 * | Prop           | Source                                      |
 * |----------------|---------------------------------------------|
 * | `id`, `name`   | Field definition                            |
 * | `label`, etc.  | `state.view[fieldId]` (dynamic view state)  |
 * | `style`        | Merged: computed layout CSS + view.style    |
 * | `...properties`| `field.properties` (static schema props)    |
 * | `options`      | `field.options`                             |
 * | `value`        | `state.values[field.name]` via ValueProxy   |
 * | `error`        | `!validity.valid`                           |
 * | `errorMessage` | `validity.errors[0].message`                |
 * | `errors`       | `validity.errors[]` (full list)             |
 * | `onChange`     | Fires hooks + `core.setValue()`             |
 * | `onBlur`       | Sets touched + triggers blur validation     |
 * | `onFocus`      | Reserved for future hook support            |
 *
 * ## onChange Hook Order
 * ```
 * onChange(val)
 *   │
 *   ├── 1. events.beforeChange(field, oldValues, val) — return false to cancel (receives pre-mutation snapshot)
 *   ├── 2. await core.setValue(field.name, val)       — engine update (async)
 *   ├── 3. events.onChange(field, val, values)         — side effect (post-mutation snapshot ✓)
 *   └── 4. events.afterChange(field, val, values)      — side effect (post-mutation snapshot ✓)
 * ```
 *
 * ✅ **Fix applied**: hooks in steps 3 & 4 now receive the **post-mutation** snapshot.
 * `beforeChange` (step 1) still receives the pre-mutation snapshot so it can inspect the old state.
 */
import type { FormField } from "./domain";
import type { IFormCore } from "./form-interface";
import { enhanceFieldProps } from "./utils/accessibility";
import { resolveEffectiveFieldType } from "./utils/field-layout-utils";

/**
 * Props object produced by `ReactFormAdapter.getComponentProps()`.
 *
 * Known properties are typed explicitly for type-safe consumption
 * by field components and the withAtom HOC.
 */
export interface FieldComponentProps {
  id: string;
  name?: string;
  /**
   * The full field definition from the schema.
   *
   * Always supplied by {@link enhanceFieldProps}; wrapper HOCs such as `withAtom`
   * resolve layout and styles from it.
   */
  field: FormField;
  value: unknown;
  error?: boolean;
  errorMessage?: string;
  errors?: ReadonlyArray<{ code: string; message: string; fieldId: string }>;
  touched?: boolean;
  dirty?: boolean;
  focused?: boolean;
  valid?: boolean;
  version?: number;
  conflict?: boolean;
  onChange?: (value: unknown) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  options?: ReadonlyArray<{ label: string; value: unknown }>;
  isLoading?: boolean;
  /** Resolved layout box for the field, produced by the layout orchestrator. */
  layout?: Record<string, any>;
  /** Pre-resolved style slots keyed by part (base, label, input, …). */
  styles?: Record<string, string | undefined>;
  /** Renders the value masked with a reveal toggle (password fields). */
  showPassword?: boolean;
  tabIndex?: number;
  /** Imperative ref for focus management / imperative control (RHF-style adapters) */
  ref?: ((element: any) => void) | { current: any } | null;
}

export class ReactFormAdapter<
  T extends Record<string, any> = Record<string, any>,
> {
  /**
   * @param core - Any implementation of `IFormCore` (FormCore, Form, or a test double).
   * Depending on the abstraction (IFormCore) rather than the concrete class breaks
   * the inheritance-based recursion and satisfies DIP.
   */
  constructor(public core: IFormCore<T>) {}

  /**
   * Per-field props cache.
   * Key: fieldId — Value: `{ version, props }` snapshot.
   *
   * `version` mirrors `core.version` at the time the props were built.
   * If the current `core.version` equals the cached version, the cached
   * object is returned as-is — React.memo on FieldRenderer will see reference
   * equality and skip the re-render.
   *
   * The cache is invalidated (fresh props built) automatically on any state mutation
   * because `notify()` increments the version counter.
   */
  private propCache = new Map<
    string,
    {
      version: number;
      props: FieldComponentProps;
    }
  >();

  /**
   * Produces a merged props object that can be spread directly onto a UI field component.
   *
   * Performs lazy-initialization fallbacks for `view` and `validity` entries to prevent
   * crashes on dynamic fields (e.g., repeater rows added after mount) that may not
   * have state entries initialized yet.
   *
   * @param fieldId - The ID of the field to build props for.
   * @returns A merged props object for the field's UI component.
   *   Returns an empty object `{}` if the field ID cannot be resolved.
   *
   * @example
   * // In a field renderer component:
   * const props = form.getComponentProps("email_field_id");
   * return <TextInput {...props} />;
   *
   * // Equivalent to:
   * // <TextInput
   * //   id="email_field_id"
   * //   name="email"
   * //   label="Email Address"
   * //   value="alice@example.com"
   * //   error={false}
   * //   errorMessage={undefined}
   * //   onChange={(val) => form.setValue("email", val)}
   * //   onBlur={() => form.setTouched("email_field_id")}
   * // />
   */
  getComponentProps(fieldId: string): FieldComponentProps {
    const currentVersion = this.core.version;
    const cached = this.propCache.get(fieldId);
    if (cached && cached.version === currentVersion) {
      return cached.props;
    }
    const props = this.buildComponentProps(fieldId);
    this.propCache.set(fieldId, { version: currentVersion, props });
    return props;
  }

  /**
   * Internal builder — constructs the full props object for a field.
   */
  private buildComponentProps(fieldId: string): FieldComponentProps {
    const field = this.core.resolveField(fieldId);
    if (!field) return {} as FieldComponentProps; // Unknown field

    // 1. Resolve base props via the IFormCore interface contract.
    // No prototype hack needed — Form no longer overrides getComponentProps;
    // it delegates to this adapter. The interface call routes directly
    // to FormCore's implementation without recursion.
    const baseProps = this.core.getComponentProps(fieldId);

    // If the pipeline returns null the field is hidden — return empty shell,
    // do NOT attach handlers (prevents "locked" behaviour on visible siblings).
    if (!baseProps || !baseProps.stateKey) return {} as FieldComponentProps;

    // Wrap handlers to include adapter logic (transformation pipeline, etc.)
    const wrappedHandlers = baseProps.inputProps
      ? {
          onChange: (val: any) =>
            this.handleValueChangePipeline(field, val, this.core.state.values),
          onBlur: () => {
            this.core.setVitality(baseProps.stateKey, {
              touched: true,
              focused: false,
            });
            const mode = this.core.getValidationMode();
            if (mode === "onBlur" || mode === "lazy") {
              // Route through the mutation interface — no direct module access
              this.core.validateFields([baseProps.stateKey]).catch(() => {});
            }
          },
          onFocus: () => {
            this.core.setVitality(baseProps.stateKey, { focused: true });
          },
        }
      : undefined;

    const inputProps = baseProps.inputProps
      ? {
          ...baseProps.inputProps,
          ...wrappedHandlers,
        }
      : undefined;

    // 2. Enhance with adapter-specific handlers
    const enhancedProps = enhanceFieldProps(
      field,
      {
        ...baseProps,
        field,
        inputProps,
        value: inputProps?.value,
        onChange: inputProps?.onChange,
        onBlur: inputProps?.onBlur,
        onFocus: inputProps?.onFocus,
        error: inputProps ? !inputProps.valid : undefined,
        errorMessage: inputProps?.errors?.[0]?.message,
        errors: inputProps?.errors || [],
        touched: inputProps?.touched,
        dirty: inputProps?.dirty,
        focused: inputProps?.focused,
        version: inputProps?.version,
        conflict: inputProps?.conflict,
      },
      {
        error: inputProps ? !inputProps.valid : undefined,
        errorMessage: inputProps?.errors?.[0]?.message,
      }
    );

    return enhancedProps as FieldComponentProps;
  }

  private async handleValueChangePipeline(
    field: any,
    val: unknown,
    preValues: T
  ) {
    const globalEvents = this.core.definition.metadata?.events;
    let transformedValue = val;

    // ── 1. Pipeline Transformation ──────────────────────────
    const effectiveType = resolveEffectiveFieldType(field);
    if (effectiveType === "select" || effectiveType === "multiselect") {
      if (field.onSelectChange) {
        const result = field.onSelectChange(transformedValue, field, preValues);
        if (result !== undefined) transformedValue = result;
      }
      if (globalEvents?.onSelectChange) {
        const result = globalEvents.onSelectChange(preValues, field);
        if (result !== undefined) transformedValue = result;
      }
    }

    if (field.onChange) {
      const result = field.onChange(transformedValue, field, preValues);
      if (result !== undefined) transformedValue = result;
    }
    const optimisticValues = { ...preValues };
    if (field.name) {
      optimisticValues[field.name as keyof T] = transformedValue as any;
    }

    if (globalEvents?.onChange) {
      const result = globalEvents.onChange(optimisticValues, field);
      if (result !== undefined) {
        if (typeof result === "object" && result !== null) {
          // If it returns a partial values object, extract the current field's value
          // and queue updates for any other modified fields.
          for (const key of Object.keys(result)) {
            if (key === field.name) {
              transformedValue = (result as any)[key];
            } else {
              this.core.setValue(key, (result as any)[key]).catch(() => {});
            }
          }
        } else {
          // Fallback if they just returned a primitive value
          transformedValue = result;
        }
      }
    }

    // ── 2. Engine Update ──────────────────────────────────────────────
    if (field.name) {
      this.core.setValue(field.name, transformedValue).catch(() => {});
    }
  }
}
