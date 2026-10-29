import { useImperativeHandle, useMemo, useState } from "react";

import type { IFormCore } from "@form-core/form-interface";
import type { FormProps } from "@ui/form/FormProps";
import { useFormOrchestrator } from "@ui/form/context/FormOrchestratorContext";
import { defaultRegistry } from "@ui/form/fields/lazy-registry-builder";
import { useForm } from "@ui/form/hooks/useForm";
import { useFormEventDelegation } from "@ui/form/hooks/useFormEventDelegation";
import { useFormI18n } from "@ui/form/hooks/useFormI18n";
import { useFormMiddleware } from "@ui/form/hooks/useFormMiddleware";
import { useFormTheme } from "@ui/form/hooks/useFormTheme";
import type { RegistryStore } from "@ui/form/registry";
import type { NavigationGuardConfig } from "@ui/form/types";
import type { FormDefinition } from "@ui/form/types";
import { SchemaNormalizer } from "@ui/form/utils/SchemaNormalizer";

/**
 * @file useFormCore.ts
 *
 * Shared runtime wiring for the form components (``Form`, `FormFlow`).
 * Everything <Form> used to do inline — form engine, theme, i18n, middleware,
 * event delegation, imperative handle, provider values — lives here so the two
 * render paths (simple vs. flow) share exactly one plumbing implementation.
 */

export type FormMode = "simple" | "wizard";

/** Everything `FormProps` accepts, plus the mode selector for the runtime. */
export interface UseFormCoreOptions<
  T extends Record<string, any> = Record<string, any>,
> extends FormProps<T> {
  /** Which render path this runtime powers: `simple` (Form) or `wizard` (FormFlow). */
  runtimeMode: FormMode;
  /** Step change callback forwarded to `FormFlowShell` (wizard mode only). */
  onStepChange?: (stepId: string, stepIndex: number) => void;
}

export interface FormRuntime<
  T extends Record<string, any> = Record<string, any>,
> {
  definition: FormDefinition<T>;
  /** Raw engine instance (drives intent/flow APIs). */
  form: any;
  isSubmitting: boolean;
  visibility: Record<string, boolean>;
  isDirty: boolean;
  /** Normalized render nodes (sections → steps in wizard mode). */
  nodes: any[];
  layoutMode: any;
  initialStepId: string;
  /** Values ready for `<FormShellProvider {...shellContext}>`. */
  shellContext: Record<string, any>;
  orchestratorValue: any;
  permissions: Record<string, "edit" | "view" | "hidden"> | undefined;
  actions: Record<string, (payload?: any) => Promise<any>> | undefined;
  guardConfig: boolean | NavigationGuardConfig;
  formTitle: any;
  i18nNamespace?: string;
  /**
   * Legacy `onSubmit` prop. Consumed by `executeSubmit`, and also merged into the
   * `ActionProvider` actions as a `submit` fallback (kept for behavior parity).
   */
  onSubmit?: (data: T) => Promise<Record<string, string> | void> | void;
  /** Effective active theme (used by NavigationGuard consumers). */
  theme: any;
  styleAdapter: any;
  registry: RegistryStore;
  mode: "edit" | "view";
  /** Which render path this runtime powers. */
  runtimeMode: FormMode;
  /** Step change callback forwarded to `FormFlowShell`. */
  onStepChange?: (stepId: string, stepIndex: number) => void;
}

export function useFormCore<
  T extends Record<string, any> = Record<string, any>,
>({
  ref,
  definition,
  initialData,
  validationSchema,
  onSubmit,
  className = "",
  debug = false,
  theme,
  adapter,
  onChange,
  onSelectChange,
  registry = defaultRegistry,
  locale,
  validationMode,
  i18nNamespace,
  middleware,
  motionConfig,
  mode,
  permissions,
  actions,
  shell,
  secondaryActions,
  navigationGuard,
  onStepChange,
  runtimeMode,
}: UseFormCoreOptions<T>): FormRuntime<T> {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const effectiveGuardConfig =
    navigationGuard ?? definition.settings?.navigationGuard ?? false;

  const {
    form,
    getComponentProps,
    setServerErrors,
    setLocale,
    visibility,
    isDirty,
    submit,
    setValue,
    setTouched,
    getPayload,
  } = useForm(definition as any, initialData, {
    validationSchema,
    validationMode:
      validationMode ??
      (definition.settings?.showValidationOnTouch ? "onBlur" : undefined),
    i18nNamespace: i18nNamespace || "features/forms",
    onChange: onChange as any,
    onSelectChange: onSelectChange as any,
  });

  useFormMiddleware(form as any, middleware);

  const {
    activeTheme,
    slots,
    actionClasses,
    submitBtnClass,
    cancelButtonClass,
  } = useFormTheme(definition, theme, adapter);

  useFormI18n(definition, setLocale, locale, i18nNamespace);

  const executeSubmit = async () => {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    try {
      const isValid = await submit();
      if (isValid) {
        const submitAction = actions?.submit;
        const serverErrors = submitAction
          ? await submitAction(getPayload() as any)
          : await onSubmit?.(getPayload() as any);
        if (serverErrors && typeof serverErrors === "object") {
          setServerErrors(serverErrors);
          return false;
        }
      }
      return isValid;
    } catch (err) {
      console.error("Form submission error:", err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      submit: () => executeSubmit(),
      reset: (data, opts) => form.reset(data, opts),
      setValue: (fieldId, value) => setValue(fieldId as string, value),
      getValue: (fieldId) => form.values[fieldId as string],
      setTouched: (fieldId) => setTouched(fieldId),
      setErrors: (errors) => setServerErrors(errors),
      validate: (fieldIds) =>
        fieldIds
          ? form.validateFields(fieldIds)
          : form.validateFields(Object.keys(form.vitality)),
      getValues: () => form.values,
      getPayload: () => getPayload(),
      get isValid() {
        return form.isValid;
      },
      get isDirty() {
        return form.isDirty;
      },
      get isDegraded() {
        return form.isDegraded;
      },
      get canUndo() {
        return form.canUndo;
      },
      get canRedo() {
        return form.canRedo;
      },
      undo: () => form.undo(),
      redo: () => form.redo(),
      engine: form as unknown as IFormCore<T>,
    }),
    [form, submit, setValue, setTouched, setServerErrors, executeSubmit]
  );

  const safeGetComponentProps = useMemo(
    () =>
      getComponentProps ||
      (() => ({ onChange: () => {}, onBlur: () => {}, onFocus: () => {} })),
    [getComponentProps]
  );

  const { handleDelegatedChange, handleDelegatedBlur } = useFormEventDelegation(
    form as any
  );

  const nodes = useMemo(
    () => SchemaNormalizer.normalize(definition as any),
    [definition]
  );

  const shellContext = useMemo(
    () => ({
      definition,
      form,
      slots,
      className,
      debug,
      isSubmitting,
      visibility,
      getComponentProps: safeGetComponentProps,
      actionClasses: actionClasses as any,
      submitBtnClass,
      cancelButtonClass,
      onExecuteSubmit: executeSubmit,
      handleDelegatedChange: handleDelegatedChange as any,
      handleDelegatedBlur: handleDelegatedBlur as any,
      shell,
      secondaryActions,
    }),
    [
      definition,
      form,
      slots,
      className,
      debug,
      isSubmitting,
      visibility,
      safeGetComponentProps,
      actionClasses,
      submitBtnClass,
      cancelButtonClass,
      executeSubmit,
      handleDelegatedChange,
      handleDelegatedBlur,
      shell,
      secondaryActions,
    ]
  );

  const registryContextValue = useMemo(
    () => ({
      registry,
      debug,
      form: form as any,
      i18nNamespace: i18nNamespace || "features/forms",
      motionConfig,
    }),
    [registry, debug, form, i18nNamespace, motionConfig]
  );

  const parentOrchestrator = useFormOrchestrator();

  const orchestratorValue = useMemo(
    () => ({
      ...parentOrchestrator,
      theme: activeTheme,
      styleAdapter: adapter || parentOrchestrator.styleAdapter,
      registry: registryContextValue,
      mode: mode || definition.settings?.mode || "edit",
      getComponentProps: safeGetComponentProps,
      visibility,
    }),
    [
      parentOrchestrator,
      activeTheme,
      adapter,
      registryContextValue,
      mode,
      definition.settings?.mode,
      safeGetComponentProps,
      visibility,
    ]
  );

  return {
    definition,
    form,
    isSubmitting,
    visibility,
    isDirty,
    nodes,
    layoutMode: definition.settings?.layoutMode,
    initialStepId: nodes[0]?.id || "",
    shellContext,
    orchestratorValue,
    permissions,
    actions,
    guardConfig: effectiveGuardConfig,
    formTitle:
      definition.title || (definition as any).content?.title || definition.id,
    i18nNamespace,
    onSubmit,
    theme: activeTheme,
    styleAdapter: adapter,
    registry,
    mode: (mode ?? "edit") as "edit" | "view",
    runtimeMode,
    onStepChange,
  };
}


