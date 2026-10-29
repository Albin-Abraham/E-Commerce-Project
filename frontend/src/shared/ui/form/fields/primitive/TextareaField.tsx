import React from "react";

import { tokens } from "@shared/theme";
import { useFieldCompositionContext } from "@ui/form/context/FieldCompositionContext";
import { useFieldShellContext } from "@ui/form/structure/FieldShell";
import { getI18nString } from "@ui/form/utils/field-utils";
import { cn } from "@ui/form/utils/form-styles";

import type { AtomicFieldProps } from "./types";

/**
 * TextareaField Component
 *
 * Responsibility: Multiline text input.
 * SURFACE-TRANSPARENT: Relies on OuterWrapper for borders/bg.
 */
export const TextareaField = React.forwardRef<
  HTMLTextAreaElement,
  AtomicFieldProps<string> & React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextareaFieldInternal(
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
    onChange,
    layout,
    className,
    styles,
    componentProps: _componentProps,
    rows,
    ...rest
  },
  ref
) {
  const resolvedName = name ?? field?.name;
  const resolvedType = type ?? field?.type ?? "textarea";
  const resolvedId = id ?? field?.id ?? resolvedName;
  const resolvedComponent =
    typeof component === "string"
      ? component
      : typeof field?.component === "string"
        ? field.component
        : "textarea";

  const isReadOnly = Boolean(readOnly ?? layout?.readOnly ?? (rest as any).readOnly);
  const isDisabled = Boolean(disabled ?? layout?.disabled ?? field?.disabled);
  const isRequired = Boolean(required ?? field?.required);
  const placeholderText =
    placeholder !== undefined
      ? getI18nString(placeholder as any)
      : getI18nString(layout?.placeholder ?? field?.properties?.placeholder ?? (field as any)?.placeholder);

  const resolvedRows = rows ?? layout?.rows ?? (field?.properties as any)?.rows ?? 3;

  const ariaKeyShortcuts =
    (field?.properties as any)?.ariaKeyShortcuts ||
    (layout as any)?.ariaKeyShortcuts ||
    (rest as any)["aria-keyshortcuts"];

  const shellContext = useFieldShellContext();
  const composition = useFieldCompositionContext();
  const isManaged = Boolean(shellContext) || composition?.mode === "managed";
  const standaloneTokens = tokens.form.controls.standaloneInput;

  const textareaElement = (
    <textarea
      ref={ref}
      id={resolvedId}
      name={resolvedName}
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={isDisabled}
      readOnly={isReadOnly}
      required={isRequired}
      aria-required={isRequired}
      placeholder={placeholderText}
      rows={resolvedRows}
      aria-keyshortcuts={ariaKeyShortcuts || undefined}
      data-field-name={resolvedName}
      data-field-type={resolvedType}
      data-field-component={resolvedComponent}
      className={cn(
        isManaged
          ? "w-full bg-transparent border-none outline-none ring-0 p-0 resize-none min-h-[80px]"
          : cn(
              standaloneTokens.base,
              standaloneTokens.hover,
              standaloneTokens.focus,
              (rest as any).error && standaloneTokens.error,
              isDisabled && standaloneTokens.disabled,
              "resize-y min-h-[100px]"
            ),
        "text-foreground placeholder:text-foreground/30",
        "font-medium selection:bg-primary/20",
        "text-[var(--text-base)]",
        styles?.input,
        className
      )}
      {...rest}
    />
  );

  if (isManaged) {
    return <div className="w-full h-full py-2">{textareaElement}</div>;
  }

  return textareaElement;
});

TextareaField.displayName = "TextareaField";
