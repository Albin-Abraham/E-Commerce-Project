import React from "react";

import { tokens } from "@shared/theme";
import { useFieldShellContext } from "@ui/form/structure/FieldShell";
import { cn } from "@ui/form/utils/form-styles";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";

import { CheckboxControl } from "./controls/CheckboxControl";
import type { AtomicFieldProps } from "./types";

/**
 * CheckboxField Component Props
 */
export interface CheckboxFieldProps
  extends AtomicFieldProps<boolean>,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  indeterminate?: boolean;
  variant?: "default" | "card" | "tile";
  [key: string]: unknown;
}

/**
 * CheckboxField Component
 *
 * Responsibility: Single-state toggle (true/false) with indeterminate support,
 * vertical description stacking, and Card/Tile selection variant.
 * Delegates native checkbox input & icons to `CheckboxControl` (Tier 1 Atom).
 */
export const CheckboxField = React.forwardRef<
  HTMLInputElement,
  CheckboxFieldProps
>(function CheckboxFieldInternal(
  {
    name,
    type,
    component,
    id,
    label,
    placeholder: _placeholder,
    description,
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
    indeterminate: propIndeterminate,
    variant: propVariant,
    error: propError,
    ...rest
  },
  ref
) {
  const resolvedName = name ?? field?.name;
  const resolvedType = type ?? field?.type ?? "checkbox";
  const resolvedId = id ?? field?.id ?? resolvedName;
  const resolvedComponent =
    typeof component === "string"
      ? component
      : typeof field?.component === "string"
        ? field.component
        : "checkbox";

  const shellContext = useFieldShellContext();
  const resolvedLabel = label ?? field?.label;
  const isDisabled = Boolean(
    disabled ?? layout?.disabled ?? field?.disabled ?? false
  );
  const isReadOnly = Boolean(
    readOnly ?? layout?.readOnly ?? field?.readOnly ?? false
  );
  const hasError = Boolean(
    (rest as any)["aria-invalid"] ?? shellContext?.hasError ?? !!propError
  );
  const describeByIds =
    (rest as any)["aria-describedby"] ||
    shellContext?.describedByIds ||
    undefined;
  const isRequired = Boolean(
    (rest as any)["aria-required"] ??
      shellContext?.required ??
      required ??
      field?.required
  );
  const isChecked = Boolean(value);

  const isIndeterminate = Boolean(
    propIndeterminate ?? (field?.properties as any)?.indeterminate
  );

  const resolvedDescription =
    description ||
    field?.description ||
    (field?.properties as any)?.description ||
    layout?.description;

  const resolvedVariant = String(
    propVariant ||
      (field?.properties as any)?.variant ||
      (layout as any)?.variant ||
      "default"
  );
  const isCard = resolvedVariant === "card" || resolvedVariant === "tile";

  const ariaKeyShortcuts =
    shellContext?.ariaKeyShortcuts ||
    (field?.properties as any)?.ariaKeyShortcuts ||
    (layout as any)?.ariaKeyShortcuts ||
    (rest as any)["aria-keyshortcuts"];

  const controlsTokens = tokens.form.controls;
  const layoutTokens = controlsTokens.layout;
  const typographyTokens = controlsTokens.typography;
  const checkboxTokens = controlsTokens.checkbox;

  const hasDescription = Boolean(resolvedDescription);

  const controlNode = (
    <CheckboxControl
      ref={ref}
      id={resolvedId}
      name={resolvedName}
      checked={isChecked}
      indeterminate={isIndeterminate}
      disabled={isDisabled}
      readOnly={isReadOnly}
      required={isRequired}
      aria-required={isRequired}
      aria-invalid={hasError}
      aria-errormessage={hasError ? `${resolvedId}-error` : undefined}
      aria-describedby={describeByIds}
      aria-keyshortcuts={ariaKeyShortcuts || undefined}
      data-field-name={resolvedName}
      data-field-type={resolvedType}
      data-field-component={resolvedComponent}
      className={
        hasDescription ? layoutTokens.controlOffset : layoutTokens.controlCenter
      }
      onChange={onChange}
      styles={styles}
      {...(rest as any)}
    />
  );

  // If no label and no description are provided, return the pure CheckboxControl directly
  if (!resolvedLabel && !resolvedDescription) {
    return controlNode;
  }

  return (
    <label
      htmlFor={resolvedId}
      data-checked={isChecked}
      data-indeterminate={isIndeterminate}
      data-variant={resolvedVariant}
      className={cn(
        isCard
          ? cn(
              checkboxTokens.card,
              isChecked || isIndeterminate
                ? checkboxTokens.cardChecked
                : checkboxTokens.cardUnchecked
            )
          : cn(
              hasDescription ? layoutTokens.multiLine : layoutTokens.singleLine,
              "w-full py-1.5"
            ),
        isDisabled && layoutTokens.disabled,
        className
      )}
      aria-keyshortcuts={ariaKeyShortcuts || undefined}
    >
      {controlNode}

      {(resolvedLabel || resolvedDescription) && (
        <div className={layoutTokens.labelStack}>
          {resolvedLabel && (
            <span
              className={cn(
                typographyTokens.title,
                isChecked || isIndeterminate
                  ? typographyTokens.titleChecked
                  : typographyTokens.titleUnchecked
              )}
            >
              {resolveTranslation(resolvedLabel)}
            </span>
          )}
          {resolvedDescription && (
            <span className={typographyTokens.description}>
              {resolveTranslation(resolvedDescription)}
            </span>
          )}
        </div>
      )}
    </label>
  );
});

CheckboxField.displayName = "CheckboxField";
