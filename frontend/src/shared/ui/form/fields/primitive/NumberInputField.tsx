import React, { useRef } from "react";

import { tokens } from "@shared/theme";
import { useFieldCompositionContext } from "@ui/form/context/FieldCompositionContext";
import { useFormOrchestrator } from "@ui/form/context/FormOrchestratorContext";
import { useFieldShellContext } from "@ui/form/structure/FieldShell";
import { getI18nString } from "@ui/form/utils/field-utils";
import { cn } from "@ui/form/utils/form-styles";
import { Minus, Plus } from "lucide-react";

import type { AtomicFieldProps } from "./types";

export const NumberInputField = React.forwardRef<
  HTMLInputElement,
  AtomicFieldProps<number> & React.InputHTMLAttributes<HTMLInputElement>
>(function NumberInputFieldInternal(
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
    min,
    max,
    step,
    field,
    value,
    onChange,
    layout,
    error,
    className,
    styles,
    ...rest
  },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const orchestrator = useFormOrchestrator();
  const mode = orchestrator?.mode || "edit";

  React.useImperativeHandle(ref, () => inputRef.current!);

  const resolvedName = name ?? field?.name;
  const resolvedType = type ?? field?.type ?? "number";
  const resolvedId = id ?? field?.id ?? resolvedName;
  const resolvedComponent =
    typeof component === "string"
      ? component
      : typeof field?.component === "string"
        ? field.component
        : "number";

  const isReadOnly = Boolean(
    readOnly ?? layout?.readOnly ?? (rest as any).readOnly
  );
  const isDisabled = Boolean(
    disabled ?? (layout as any)?.disabled ?? field?.disabled ?? false
  );
  const isRequired = Boolean(required ?? field?.required);
  const placeholderText =
    placeholder !== undefined
      ? getI18nString(placeholder as any)
      : getI18nString(
          layout?.placeholder ??
            (field?.properties as any)?.placeholder ??
            (field as any)?.placeholder
        );

  const ariaKeyShortcuts =
    (field?.properties as any)?.ariaKeyShortcuts ||
    (field?.properties as any)?.["aria-keyshortcuts"] ||
    (layout as any)?.ariaKeyShortcuts ||
    (rest as any)["aria-keyshortcuts"];

  const minVal = min ?? layout?.min ?? (field?.properties as any)?.min;
  const maxVal = max ?? layout?.max ?? (field?.properties as any)?.max;
  const stepVal = step ?? layout?.step ?? (field?.properties as any)?.step ?? 1;

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return;
    const val = e.target.value === "" ? undefined : Number(e.target.value);
    onChange(val);
  };

  const handleIncrement = () => {
    if (isDisabled || isReadOnly || !onChange) return;
    const stepNumber = Number(stepVal) || 1;
    const current = typeof value === "number" ? value : 0;
    const next = current + stepNumber;
    if (maxVal !== undefined && next > Number(maxVal)) return;
    onChange(next);
  };

  const handleDecrement = () => {
    if (isDisabled || isReadOnly || !onChange) return;
    const stepNumber = Number(stepVal) || 1;
    const current = typeof value === "number" ? value : 0;
    const next = current - stepNumber;
    if (minVal !== undefined && next < Number(minVal)) return;
    onChange(next);
  };

  const safeValue = value ?? "";

  if (mode === "view") {
    return (
      <div
        className={cn(
          "w-full text-sm font-medium text-foreground py-2",
          !safeValue && "text-muted-foreground italic",
          styles?.input,
          className
        )}
      >
        {safeValue || "—"}
      </div>
    );
  }

  const shellContext = useFieldShellContext();
  const composition = useFieldCompositionContext();
  const isManaged = Boolean(shellContext) || composition?.mode === "managed";
  const standaloneTokens = tokens.form.controls.standaloneInput;

  return (
    <div className="relative flex items-center w-full">
      <input
        ref={inputRef}
        id={resolvedId}
        name={resolvedName}
        type="number"
        value={safeValue}
        onChange={handleValueChange}
        disabled={isDisabled}
        readOnly={isReadOnly}
        required={isRequired}
        aria-required={isRequired}
        placeholder={placeholderText}
        min={minVal}
        max={maxVal}
        step={stepVal}
        aria-invalid={!!error}
        aria-keyshortcuts={ariaKeyShortcuts || undefined}
        data-field-name={resolvedName}
        data-field-type={resolvedType}
        data-field-component={resolvedComponent}
        className={cn(
          isManaged
            ? "w-full bg-transparent border-none outline-none ring-0 appearance-none"
            : cn(
                standaloneTokens.base,
                standaloneTokens.hover,
                standaloneTokens.focus,
                error && standaloneTokens.error,
                isDisabled && standaloneTokens.disabled,
                "appearance-none"
              ),
          "text-foreground placeholder:text-foreground/40 font-medium",
          "pr-16 transition-all duration-200",
          "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          styles?.input,
          className
        )}
        {...rest}
      />

      {!isReadOnly && !isDisabled && (
        <div className={tokens.form.spinners.container}>
          <button
            type="button"
            aria-label="Decrement value"
            onClick={handleDecrement}
            className={tokens.form.spinners.button}
            tabIndex={-1}
          >
            <Minus className="w-3 h-3" />
          </button>
          <div className={tokens.form.spinners.divider} />
          <button
            type="button"
            aria-label="Increment value"
            onClick={handleIncrement}
            className={tokens.form.spinners.button}
            tabIndex={-1}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
});

NumberInputField.displayName = "NumberInputField";
