import { useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";

import type { ValidationMode, PersistenceConfig } from "@form-core/engine";
import { Form } from "@form-core/form";
import { SchemaMigrator } from "@ui/form/utils/SchemaMigrator";
import { toCanonicalMetadataEvents } from "@ui/form/utils/schema-compat";
import { buildSchemaStructuralSignature } from "@ui/form/utils/schema-signature";
import { validateYupSchema } from "@ui/form/utils/yup-adapter";
import { validateZodSchema } from "@ui/form/utils/zod-adapter";

import type { FormField } from "../fields";
import type { FormDefinition } from "../types";
import { ErrorParser } from "../utils/ErrorParser";

export type InitialDataSyncMode = "preserve-dirty" | "force-reset" | "ignore";

export interface UseFormOptions<T> {
  /** External validation schema. Pass a Zod schema (preferred) or Yup schema. */
  schema?: any;
  validationSchema?: any;
  validationMode?: ValidationMode;
  validateOnMount?: boolean;
  /**
   * Defines how subsequent changes to `initialData` affect the active form instance.
   * - `"preserve-dirty"` (default): Updates pristine fields with new server data while preserving active user edits on dirty fields.
   * - `"force-reset"`: Resets the entire form with new data, clearing dirty state.
   * - `"ignore"`: Only uses `initialData` on mount; subsequent changes are ignored.
   */
  initialDataSyncMode?: InitialDataSyncMode;
  /**
   * @param values - Current form values after the change.
   * @param field - The field that triggered the change.
   * @returns Optionally return a transformed value to override the engine's update.
   */
  onChange?: (values: T, field?: FormField) => void | any;
  /**
   * @param values - Current form values after the change.
   * @param field - The select/multiselect field that triggered the change.
   * @returns Optionally return a transformed value to override the engine's update.
   */
  onSelectChange?: (values: T, field?: FormField) => void | any;
  i18nNamespace?: string;
  /** Draft persistence configuration. */
  persistence?: PersistenceConfig;
}

/** Shallow equality check to protect against unstable inline object references. */
function isDataShallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => a[k] === b[k]);
}

export function useForm<T extends Record<string, any> = Record<string, any>>(
  definition: FormDefinition,
  initialData?: Partial<T>,
  options?: UseFormOptions<T>
) {
  // Run the migration pipeline to guarantee schema is at the required app version
  // We default to checking against "1.0.0" if no version is provided, but in a real app
  // this targetVersion would come from environment configs or constants.
  const migratedDefinition = useMemo(
    () => SchemaMigrator.migrate(definition, "1.0.0"),
    [definition]
  );

  const schemaSignature = useMemo(
    () => buildSchemaStructuralSignature(migratedDefinition),
    [migratedDefinition]
  );

  const onChangeRef = useRef(options?.onChange);
  const onSelectChangeRef = useRef(options?.onSelectChange);
  const initialDataSnapshotRef = useRef(initialData);

  useLayoutEffect(() => {
    onChangeRef.current = options?.onChange;
    onSelectChangeRef.current = options?.onSelectChange;
  });

  // 1. Instantiate Core Form Engine (v2) with options
  // Recreated ONLY when structural schema signature changes or core options change.
  // Decoupled from object reference instability of `initialData`.
  const form = useMemo(() => {
    const mergedDefinition = toCanonicalMetadataEvents(migratedDefinition, {
      onChange: (values, field) =>
        onChangeRef.current?.(values as T, field),
      onSelectChange: (values, field) =>
        onSelectChangeRef.current?.(values as T, field),
    });

    initialDataSnapshotRef.current = initialData;

    const activeSchema = options?.schema || options?.validationSchema;

    return new Form<T>(mergedDefinition, initialData, {
      validationMode: options?.validationMode || "onBlur",
      validateOnMount: options?.validateOnMount ?? false,
      i18nNamespace: options?.i18nNamespace,
      density: (mergedDefinition as any)?.settings?.density,
      schema: activeSchema,
      persistence: options?.persistence,
    });
  }, [
    schemaSignature,
    options?.validateOnMount,
    options?.validationMode,
    options?.i18nNamespace,
    options?.schema,
    options?.validationSchema,
    options?.persistence,
    (definition as any)?.settings?.density,
  ]);

  // Cleanup persistence listeners / timers on unmount
  useEffect(() => {
    return () => {
      form.destroy?.();
    };
  }, [form]);

  // Synchronize subsequent initialData changes without destroying form instance
  useEffect(() => {
    if (isDataShallowEqual(initialDataSnapshotRef.current, initialData)) {
      return;
    }

    initialDataSnapshotRef.current = initialData;

    const syncMode = options?.initialDataSyncMode ?? "preserve-dirty";
    if (syncMode === "ignore" || !initialData) {
      return;
    }

    if (syncMode === "force-reset") {
      form.reset(initialData);
      return;
    }

    // Default "preserve-dirty": keep values and dirty flags for fields modified by user
    const dirtyKeys = new Set<string>();
    Object.keys(form.vitality).forEach((key) => {
      if (form.vitality[key]?.dirty) {
        dirtyKeys.add(key);
        try {
          const fieldDef = form.resolveField(key);
          if (fieldDef?.name) dirtyKeys.add(fieldDef.name);
          if (fieldDef?.id) dirtyKeys.add(fieldDef.id);
        } catch {
          // ignore lookup errors
        }
      }
    });

    form.reset(initialData, {
      keepDirty: true,
      keepTouched: true,
      keepValues: Array.from(dirtyKeys),
    });
  }, [initialData, form, options?.initialDataSyncMode]);

  // 2. Synchronize Structural State (Visibility / Dirty) — Shell Level
  // By snapping only visibility and dirty state, we release the "Parking Brake".
  // The parent shell will NO LONGER re-render on every keystroke, allowing the
  // `useFieldAtom` micro-subscriptions to handle isolated field updates.
  //
  // Uses `form.structuralVersion` (O(1)) instead of `JSON.stringify(visibility)` (O(N))
  // to avoid serializing the full visibility object on every state notification.
  const structuralSnapshot = useSyncExternalStore(
    (callback) => form.subscribe(callback),
    () => form.structuralVersion
  );

  // Derived state clones (Memoized against the structural snapshot for stability)
  const visibility = useMemo(() => form.visibility, [form, structuralSnapshot]);
  const isDirty = useMemo(() => form.isDirty, [form, structuralSnapshot]);
  const isValid = useMemo(() => form.isValid, [form, structuralSnapshot]);

  // Memoize stable actions to prevent unnecessary props changes
  const actions = useMemo(
    () => ({
      setValue: (fieldId: string, val: any) => form.setValue(fieldId, val),
      setTouched: (fieldId: string) => form.setTouched(fieldId),
      submit: async () => {
        const startTime = performance.now();
        const focusFirstError = () => {
          const delay = document.querySelector("[data-overlay-body]")
            ? 300
            : 50;
          setTimeout(() => {
            const root =
              document.querySelector("[data-overlay-body]") || document;
            const invalidField = root.querySelector(
              '[data-error="true"], [aria-invalid="true"]'
            );
            if (invalidField) {
              if (typeof invalidField.scrollIntoView === "function") {
                invalidField.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }
              const input = invalidField.querySelector(
                'input, select, textarea, [tabindex="0"], [role="combobox"]'
              ) as HTMLElement;
              input?.focus({ preventScroll: true });
            }
          }, delay);
        };

        if (options?.validationSchema) {
          const schema = options.validationSchema;
          const isZod = typeof schema?.safeParse === "function";
          const externalErrors = isZod
            ? await validateZodSchema(schema, form.values)
            : await validateYupSchema(schema, form.values);
          if (externalErrors.length > 0) {
            form.setErrors(externalErrors);
            focusFirstError();
            form.stateManager.setPerformance({
              lastSubmissionDurationMs: performance.now() - startTime,
            });
            return false;
          }
        }

        const success = await form.submit();
        if (!success) {
          focusFirstError();
        }

        form.stateManager.setPerformance({
          lastSubmissionDurationMs: performance.now() - startTime,
        });

        return success;
      },
      setServerErrors: (errors: Record<string, any>) => {
        const standardErrors = ErrorParser.parse(
          errors,
          form.resolver.nameToIdMap
        );
        form.setErrors(standardErrors);
      },
      setLocale: (locale: string) => form.setLocale(locale),
      getComponentProps: (fieldId: string) => form.getComponentProps(fieldId),
      getPayload: () => form.getPayload(),
    }),
    [form, options?.validationSchema]
  );

  // 4. Expose Actions & State
  return {
    form,
    // State
    values: form.values,
    validity: form.validity,
    view: form.view,
    vitality: form.vitality,
    visibility,
    isDirty,
    isValid,
    // Actions
    ...actions,
  };
}
