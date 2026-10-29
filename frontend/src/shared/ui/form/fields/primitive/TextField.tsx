import React from "react";

import { tokens } from "@shared/theme";
import { useFieldCompositionContext } from "@ui/form/context/FieldCompositionContext";
import { useFormOrchestrator } from "@ui/form/context/FormOrchestratorContext";
import { useFieldShellContext } from "@ui/form/structure/FieldShell";
import { getI18nString } from "@ui/form/utils/field-utils";
import { cn } from "@ui/form/utils/form-styles";

import type { AtomicFieldProps } from "./types";

/**
 * TextField Component (HeroUI Atomic Adapter)
 *
 * Responsibility: Generic text-based input (text, number, email, password, etc.).
 * Implements the **Slot-Based Style Architecture** as an **Atomic Adapter**.
 */
export const TextField = React.forwardRef<
  HTMLInputElement,
  AtomicFieldProps<string | number> &
    React.InputHTMLAttributes<HTMLInputElement> & {
      isLoading?: boolean;
      labelPlacement?: string;
      dataPath?: string;
      stateKey?: string;
      rowGroup?: string;
      inputProps?: any;
      touched?: boolean;
      dirty?: boolean;
      focused?: boolean;
      onSearch?: (val?: string) => void;
      onClear?: () => void;
      onDebouncedSearch?: (val?: string) => void;
      debounceMs?: number;
      searchOnType?: boolean;
    }
>(function TextFieldInternal(
  {
    name,
    type,
    component,
    id,
    label: _label,
    placeholder,
    disabled,
    readOnly,
    required,
    field,
    value,
    defaultValue,
    onChange,
    layout,
    error,
    styles,
    componentProps: _componentProps,
    showPassword,
    isLoading: _isLoading,
    labelPlacement: _labelPlacement,
    tabIndex,
    dataPath: _dataPath,
    stateKey: _stateKey,
    rowGroup: _rowGroup,
    inputProps: _inputProps,
    touched: _touched,
    dirty: _dirty,
    focused: _focused,
    onSearch: _onSearch,
    onClear: _onClear,
    onDebouncedSearch: _onDebouncedSearch,
    debounceMs: _debounceMs,
    searchOnType: _searchOnType,
    version: _version,
    conflict: _conflict,
    isInvalid: _isInvalid,
    isEmpty: _isEmpty,
    errorMessage: _errorMessage,
    errors: _errors,
    className,
    ...rest
  },
  ref
) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const orchestrator = useFormOrchestrator();
  const mode = orchestrator?.mode || "edit";

  const safeValue = value ?? "";

  React.useImperativeHandle(ref, () => inputRef.current!);

  const resolvedName = name ?? field?.name;
  const resolvedType = type ?? field?.type ?? "text";
  const resolvedId = id ?? field?.id ?? resolvedName;
  const resolvedComponent =
    typeof component === "string"
      ? component
      : typeof field?.component === "string"
        ? field.component
        : "text";

  const isReadOnly = Boolean(readOnly ?? layout?.readOnly ?? (rest as any).readOnly);
  const isDisabled = Boolean(disabled ?? layout?.disabled ?? field?.disabled);
  const isRequired = Boolean(required ?? field?.required);
  const isNumber = resolvedType === "number";
  const isPassword = resolvedType === "password";
  const placeholderText =
    placeholder !== undefined
      ? getI18nString(placeholder as any)
      : getI18nString(layout?.placeholder ?? field?.properties?.placeholder ?? (field as any)?.placeholder);

  const isUncontrolled = (field?.syncMode as string) === "blur";

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUncontrolled || !onChange) return;
    const val = e.target.value;
    const finalVal = isNumber ? (val === "" ? undefined : Number(val)) : val;
    onChange(finalVal as string | number | undefined);
  };

  const handleBlur = (e: React.FocusEvent<Element>) => {
    if (isUncontrolled && onChange) {
      const targetVal = (e.target as HTMLInputElement).value;
      const finalVal = isNumber
        ? targetVal === ""
          ? undefined
          : Number(targetVal)
        : targetVal;
      onChange(finalVal as string | number | undefined);
    }
    if (rest.onBlur) (rest.onBlur as any)(e);
  };

  const shellContext = useFieldShellContext();
  const ariaInvalid = (rest as any)["aria-invalid"];
  const hasError =
    ariaInvalid !== undefined
      ? Boolean(ariaInvalid)
      : (shellContext?.hasError ?? !!error);

  const ariaDescribedBy = (rest as any)["aria-describedby"];
  const describeByIds =
    ariaDescribedBy ||
    shellContext?.describedByIds ||
    [
      layout?.helpText || (rest as any).helperText
        ? `${resolvedId}-help`
        : undefined,
      hasError ? `${resolvedId}-error` : undefined,
    ]
      .filter(Boolean)
      .join(" ");

  const ariaRequired = (rest as any)["aria-required"];
  const isRequiredField =
    ariaRequired !== undefined
      ? Boolean(ariaRequired)
      : (shellContext?.required ?? isRequired);

  const inputType = isPassword
    ? showPassword
      ? "text"
      : "password"
    : (resolvedType || "text");

  if (mode === "view") {
    return (
      <div
        className={cn(
          "w-full text-sm font-medium text-foreground py-2 min-h-[40px] flex items-center",
          !safeValue && "text-muted-foreground italic",
          styles?.input
        )}
      >
        {isPassword ? "••••••••" : safeValue || "—"}
      </div>
    );
  }

  const ariaKeyShortcuts =
    (rest as any)["aria-keyshortcuts"] ||
    shellContext?.ariaKeyShortcuts ||
    (field?.properties as any)?.ariaKeyShortcuts ||
    (layout as any)?.ariaKeyShortcuts;

  const {
    error: _err,
    helperText: _ht,
    reserveErrorSpace: _res,
    showLabel: _sl,
    wrapOuter: _wo,
    labelPlacement: _lp,
    vitality: _vit,
    validation: _val,
    properties: _props,
    meta: _meta,
    componentProps: _cProps,
    description: _desc,
    tooltip: _tt,
    labelAction: _la,
    startContent: _sc,
    endContent: _ec,
    prefix: _pre,
    suffix: _suf,
    ...sanitizedRest
  } = rest as Record<string, unknown>;

  const composition = useFieldCompositionContext();
  const isManaged = Boolean(shellContext) || composition?.mode === "managed";
  const standaloneTokens = tokens.form.controls.standaloneInput;

  return (
    <input
      ref={inputRef}
      id={resolvedId}
      name={resolvedName}
      type={inputType}
      value={isUncontrolled ? undefined : String(safeValue)}
      defaultValue={isUncontrolled ? String(safeValue) : undefined}
      onChange={handleNativeChange}
      onBlur={handleBlur}
      disabled={isDisabled}
      readOnly={isReadOnly}
      placeholder={placeholderText}
      min={layout?.min !== undefined ? String(layout.min) : undefined}
      max={layout?.max !== undefined ? String(layout.max) : undefined}
      step={layout?.step !== undefined ? String(layout.step) : undefined}
      tabIndex={tabIndex}
      autoComplete={field?.autoComplete || (rest as any).autoComplete || "off"}
      aria-invalid={hasError}
      aria-required={isRequiredField}
      aria-errormessage={hasError ? `${resolvedId}-error` : undefined}
      aria-describedby={describeByIds || undefined}
      aria-keyshortcuts={ariaKeyShortcuts || undefined}

      data-field-name={resolvedName}
      data-field-type={resolvedType}
      data-field-component={resolvedComponent}
      className={cn(
        isManaged
          ? "w-full bg-transparent outline-none border-none shadow-none focus:ring-0"
          : cn(
              standaloneTokens.base,
              standaloneTokens.hover,
              standaloneTokens.focus,
              hasError && standaloneTokens.error,
              isDisabled && standaloneTokens.disabled
            ),
        "text-foreground placeholder:text-foreground/40 placeholder:italic",
        "font-medium selection:bg-primary/30",
        "transition-all duration-200",
        "min-h-0 h-full py-0 leading-normal",
        styles?.input,
        className
      )}
      {...(sanitizedRest as any)}
    />
  );
});

TextField.displayName = "TextField";
