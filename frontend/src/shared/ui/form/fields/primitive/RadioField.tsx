import React from "react";

import { useFieldShellContext } from "@ui/form/structure/FieldShell";

import { RadioGroup } from "./controls/RadioGroup";
import type { AtomicFieldProps } from "./types";

/**
 * RadioField Component Props
 */
export interface RadioFieldProps extends AtomicFieldProps<string> {
  options?: any[];
  disabled?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  variant?: "default" | "card" | "tile" | "segmented";
  [key: string]: unknown;
}

/**
 * RadioField Component
 *
 * Responsibility: Exclusive selection from a set of options.
 * Implements the **Dynamic Slot Architecture** and full WAI-ARIA 1.2+ roving tabindex.
 * Delegates grouping, keyboard arrow navigation, and option items to `RadioGroup` (Tier 1 Atom).
 */
export const RadioField = React.forwardRef<
  HTMLDivElement,
  RadioFieldProps & Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">
>(function RadioFieldInternal(
  {
    name,
    type,
    component,
    id,
    label,
    placeholder: _placeholder,
    description: _description,
    disabled,
    readOnly,
    required,
    field,
    value,
    onChange,
    layout,
    options,
    className,
    styles,
    startContent: propStartContent,
    endContent: propEndContent,
    componentProps: _componentProps,
    variant: propVariant,
    error: propError,
    ...rest
  },
  ref
) {
  const resolvedName = name ?? field?.name;
  const resolvedType = type ?? field?.type ?? "radio";
  const resolvedId = id ?? field?.id ?? resolvedName;
  const resolvedComponent =
    typeof component === "string"
      ? component
      : typeof field?.component === "string"
        ? field.component
        : "radio";

  const shellContext = useFieldShellContext();
  const resolvedLabel = label ?? field?.label;
  const isDisabled = Boolean(
    disabled ?? layout?.disabled ?? field?.disabled ?? false
  );
  const isReadOnly = Boolean(readOnly ?? (layout as any)?.readOnly ?? field?.readOnly ?? false);
  const isRequired = Boolean(
    (rest as any)["aria-required"] ??
      shellContext?.required ??
      required ??
      field?.required
  );
  const hasError = Boolean(
    (rest as any)["aria-invalid"] ?? shellContext?.hasError ?? !!propError
  );
  const describeByIds =
    (rest as any)["aria-describedby"] ||
    shellContext?.describedByIds ||
    undefined;

  const resolvedVariant = (propVariant ||
    (field?.properties as any)?.variant ||
    (layout as any)?.variant ||
    "default") as "default" | "card" | "tile" | "segmented";

  const isSegmented = resolvedVariant === "segmented";

  const isHorizontal =
    isSegmented ||
    (field?.properties as any)?.direction === "row" ||
    (layout as any)?.direction === "row" ||
    (field?.properties as any)?.orientation === "horizontal";

  const ariaKeyShortcuts =
    shellContext?.ariaKeyShortcuts ||
    (field?.properties as any)?.ariaKeyShortcuts ||
    (layout as any)?.ariaKeyShortcuts ||
    (rest as any)["aria-keyshortcuts"];

  const resolvedStartContent =
    propStartContent ||
    field?.properties?.startContent ||
    field?.properties?.leftContent ||
    field?.meta?.ui?.startContent ||
    field?.meta?.ui?.leftContent;

  const resolvedEndContent =
    propEndContent ||
    field?.properties?.endContent ||
    field?.properties?.rightContent ||
    field?.meta?.ui?.endContent ||
    field?.meta?.ui?.rightContent;

  // Resolve options: prop > field.options > field.properties.options
  const resolvedOptions =
    options ||
    field?.options ||
    field?.properties?.options ||
    field?.meta?.options?.options ||
    [];

  return (
    <RadioGroup
      ref={ref}
      id={resolvedId}
      name={resolvedName}
      value={value}
      options={resolvedOptions}
      disabled={isDisabled}
      readOnly={isReadOnly}
      required={isRequired}
      variant={resolvedVariant}
      orientation={isHorizontal ? "horizontal" : "vertical"}
      onChange={onChange}
      className={className}
      styles={styles as any}
      startContent={resolvedStartContent}
      endContent={resolvedEndContent}
      aria-label={typeof resolvedLabel === "string" ? resolvedLabel : undefined}
      aria-required={isRequired}
      aria-invalid={hasError}
      aria-errormessage={hasError ? `${resolvedId}-error` : undefined}
      aria-describedby={describeByIds}
      aria-keyshortcuts={ariaKeyShortcuts || undefined}
      data-field-name={resolvedName}
      data-field-type={resolvedType}
      data-field-component={resolvedComponent}
      {...(rest as any)}
    />
  );
});

RadioField.displayName = "RadioField";
