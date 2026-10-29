import React from "react";

import { tokens } from "@shared/theme";
import type { FormField } from "@ui/form/fields";
import { useFieldShellContext } from "@ui/form/structure/FieldShell";
import type { FieldLayout } from "@ui/form/utils/form-layout-utils";
import { cn } from "@ui/form/utils/form-styles";

import { SwitchControl } from "./controls/SwitchControl";
import type { AtomicFieldProps } from "./types";

export interface SwitchFieldProps extends Partial<AtomicFieldProps<boolean>> {
  field?: Partial<FormField>;
  value?: boolean;
  onChange?: (val: boolean | undefined) => void;
  layout?: Partial<FieldLayout>;
  error?: boolean | string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "card";
  styles?: {
    input?: string;
    track?: string;
    thumb?: string;
    [key: string]: string | undefined;
  };
  [key: string]: unknown;
}

/**
 * SwitchField Component
 *
 * Responsibility: Binary toggle field supporting both standalone and shell-wrapped operation.
 * Consumes design tokens from `tokens.form.controls` for layout, optical alignment, and typography.
 * Delegates native input and switch track/thumb presentation to `SwitchControl` (Tier 1 Atom).
 */
export const SwitchField = React.forwardRef<HTMLInputElement, SwitchFieldProps>(
  (
    {
      name,
      type,
      component,
      id,
      label,
      placeholder,
      description,
      disabled,
      readOnly,
      required,
      field,
      value,
      onChange,
      layout,
      error,
      className,
      styles,
      size: propSize,
      variant: propVariant,
      role: propRole,
      ...rest
    },
    ref
  ) => {
    const resolvedName = name ?? field?.name;
    const resolvedType = type ?? field?.type ?? "switch";
    const resolvedId = id ?? field?.id ?? resolvedName;
    const resolvedComponent =
      typeof component === "string"
        ? component
        : typeof field?.component === "string"
          ? field.component
          : "switch";

    const shellContext = useFieldShellContext();
    const isChecked = Boolean(value);
    const isDisabled = Boolean(
      disabled ?? (layout as any)?.disabled ?? field?.disabled ?? false
    );
    const isReadOnly = Boolean(readOnly ?? (layout as any)?.readOnly ?? field?.readOnly ?? false);
    const isRequired = Boolean(
      (rest as any)["aria-required"] ??
        shellContext?.required ??
        required ??
        field?.required
    );
    const hasError = Boolean(
      (rest as any)["aria-invalid"] ?? shellContext?.hasError ?? !!error
    );
    const describeByIds =
      (rest as any)["aria-describedby"] ||
      shellContext?.describedByIds ||
      undefined;

    const resolvedSize = (propSize ||
      (field?.properties as any)?.size ||
      (layout as any)?.size ||
      "md") as "sm" | "md" | "lg";

    const resolvedVariant = String(
      propVariant ||
        (field?.properties as any)?.variant ||
        (layout as any)?.variant ||
        "default"
    );
    const isCard = resolvedVariant === "card";

    const resolvedLabel = label ?? field?.label;
    const resolvedDescription =
      description ??
      placeholder ??
      ((field?.properties?.placeholder || field?.properties?.description) as
        | string
        | undefined);

    const ariaKeyShortcuts =
      shellContext?.ariaKeyShortcuts ||
      (field?.properties as any)?.ariaKeyShortcuts ||
      (layout as any)?.ariaKeyShortcuts ||
      (rest as any)["aria-keyshortcuts"];

    const resolvedRole =
      propRole ||
      (rest as any).role ||
      (field?.properties as any)?.role ||
      "switch";

    const controlsTokens = tokens.form.controls;
    const layoutTokens = controlsTokens.layout;
    const typographyTokens = controlsTokens.typography;
    const switchTokens = controlsTokens.switch;

    const hasDescription = Boolean(resolvedDescription);

    const switchControlNode = (
      <SwitchControl
        ref={ref}
        id={resolvedId}
        name={resolvedName}
        checked={isChecked}
        disabled={isDisabled}
        readOnly={isReadOnly}
        required={isRequired}
        size={resolvedSize}
        role={resolvedRole}
        onChange={onChange}
        aria-invalid={hasError}
        aria-errormessage={hasError ? `${resolvedId}-error` : undefined}
        aria-describedby={describeByIds}
        aria-keyshortcuts={ariaKeyShortcuts || undefined}
        data-field-name={resolvedName}
        data-field-type={resolvedType}
        data-field-component={resolvedComponent}
        className={hasDescription && !isCard ? layoutTokens.controlOffset : layoutTokens.controlCenter}
        styles={styles}
        {...(rest as any)}
      />
    );

    // If no label and no description are provided, return the pure SwitchControl directly
    if (!resolvedLabel && !resolvedDescription) {
      return switchControlNode;
    }

    return (
      <label
        htmlFor={resolvedId}
        data-checked={isChecked}
        data-size={resolvedSize}
        data-variant={resolvedVariant}
        className={cn(
          isCard
            ? cn(
                switchTokens.card,
                isChecked
                  ? switchTokens.cardChecked
                  : switchTokens.cardUnchecked,
                isDisabled && layoutTokens.disabled
              )
            : cn(
                hasDescription ? layoutTokens.multiLine : layoutTokens.singleLine,
                isDisabled && layoutTokens.disabled
              ),
          className
        )}
      >
        {isCard ? (
          <>
            <div className={layoutTokens.labelStack}>
              {resolvedLabel && (
                <span
                  className={cn(
                    typographyTokens.title,
                    isChecked
                      ? typographyTokens.titleChecked
                      : typographyTokens.titleUnchecked
                  )}
                >
                  {typeof resolvedLabel === "string"
                    ? resolvedLabel
                    : (resolvedLabel as any).en || String(resolvedLabel)}
                </span>
              )}
              {resolvedDescription && (
                <span className={typographyTokens.description}>
                  {resolvedDescription}
                </span>
              )}
            </div>
            {switchControlNode}
          </>
        ) : (
          <>
            {switchControlNode}
            <div className={layoutTokens.labelStack}>
              {resolvedLabel && (
                <span
                  className={cn(
                    typographyTokens.title,
                    isChecked
                      ? typographyTokens.titleChecked
                      : typographyTokens.titleUnchecked
                  )}
                >
                  {typeof resolvedLabel === "string"
                    ? resolvedLabel
                    : (resolvedLabel as any).en || String(resolvedLabel)}
                </span>
              )}
              {resolvedDescription && (
                <span className={typographyTokens.description}>
                  {resolvedDescription}
                </span>
              )}
            </div>
          </>
        )}
      </label>
    );
  }
);

SwitchField.displayName = "SwitchField";
