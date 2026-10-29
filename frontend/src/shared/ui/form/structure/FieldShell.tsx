import React, { createContext, useContext, useEffect } from "react";

import { useEventRegistry } from "@core/events/stores/eventRegistry.store";
import type { DetailedError } from "@form-core/int-types";
import type { FormField } from "@ui/form/fields";
import type { TranslatedText } from "@ui/form/types/i18n-accessibility";
import type { FieldLayout } from "@ui/form/utils/form-layout-utils";
import { cn } from "@ui/form/utils/form-styles";
import { Box } from "@ui/layout/Box";

import { FieldFeedback } from "./FieldFeedback";
import { FieldLabel } from "./FieldLabel";
import { InputWrapper } from "./InputWrapper";
import { OuterWrapper } from "./OuterWrapper";
import { FieldCompositionContext } from "../context/FieldCompositionContext";

export interface FieldShellContextValue {
  id: string;
  name: string;
  type: string;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
  hasError: boolean;
  error?: boolean | string;
  errorMessage?: string;
  errors?: readonly DetailedError[];
  describedByIds?: string;
  ariaKeyShortcuts?: string;
  density?: "compact" | "comfortable" | "spacious";
}

export const FieldShellContext = createContext<FieldShellContextValue | null>(null);

export function useFieldShellContext() {
  return useContext(FieldShellContext);
}

export interface FieldShellProps {
  // ── 1. The Canonical Form Definition Trinity ───────────────────────
  /** Form state data binding key & submission payload key */
  name?: string;

  /** Semantic data type (e.g. "text", "number", "select", "boolean", "date", "file") */
  type?: string;

  /** Presentation component mapping key or React component override */
  component?: string | React.ComponentType<any>;

  // ── 2. Identification & Accessibility ─────────────────────────────
  id?: string;
  label?: string | TranslatedText;
  placeholder?: string | TranslatedText;
  description?: string | TranslatedText;
  helperText?: string | TranslatedText;

  // ── 3. Constraints & Validation ───────────────────────────────────
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean | string;
  errorMessage?: string;
  errors?: readonly DetailedError[];

  // ── 4. Layout & Surface Configuration ─────────────────────────────
  labelPlacement?: "top" | "side" | "hidden" | "inline";
  tooltip?: string | TranslatedText;
  labelAction?: { href: string; label: string | TranslatedText };
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  density?: "compact" | "comfortable" | "spacious";
  wrapOuter?: boolean;
  showLabel?: boolean;
  className?: string;
  styles?: {
    base?: string;
    label?: string;
    inputWrapper?: string;
    innerWrapper?: string;
    contentWrapper?: string;
    description?: string;
    errorMessage?: string;
    [key: string]: string | undefined;
  };

  // ── 5. Backward Compatibility Slots ───────────────────────────────
  field?: Partial<FormField>;
  layout?: Partial<FieldLayout>;
  children: React.ReactNode;
  [key: string]: unknown;
}

/**
 * FieldShell: The Composite Interaction Surface & Shell
 *
 * Single Responsibility: Assembles the Zenith Wrapper Trinity:
 * - FieldLabel (Header, accessibility, required asterisk, tooltips)
 * - OuterWrapper (Singular etched surface border, focus-glow, slots)
 * - InputWrapper (Spatial relationships, label placement, error reservation)
 * - FieldFeedback (Validation error messages, accessibility alerts, helper texts)
 */
export const FieldShell: React.FC<FieldShellProps> = ({
  name,
  type,
  component,
  id,
  label,
  description,
  helperText,
  required,
  disabled: _disabled,
  readOnly: _readOnly,
  error,
  errorMessage,
  errors,
  labelPlacement = "top",
  tooltip,
  labelAction,
  startContent,
  endContent,
  prefix,
  suffix,
  density,
  wrapOuter = true,
  showLabel = true,
  className,
  styles = {},
  field,
  layout,
  children,
}) => {
  const resolvedName = name ?? (field?.name as string);
  const resolvedType = type ?? field?.type ?? "text";
  const resolvedId = id ?? field?.id ?? resolvedName;
  const resolvedLabel = label ?? field?.label;
  const resolvedRequired = Boolean(required ?? field?.required);
  const resolvedComponentName =
    typeof component === "string"
      ? component
      : typeof field?.component === "string"
        ? field.component
        : resolvedType;

  // Resolve prefix / startContent
  const resolvedStartContent = startContent || prefix;
  // Resolve suffix / endContent
  const resolvedEndContent = endContent || suffix;

  // Feedback Node
  const feedbackNode = (
    <FieldFeedback
      field={field}
      id={resolvedId}
      name={resolvedName}
      description={description}
      helperText={helperText}
      error={error}
      errorMessage={errorMessage}
      errors={errors}
      styles={styles}
    />
  );

  // Label Node
  const labelNode = (
    <FieldLabel
      field={field}
      id={resolvedId}
      name={resolvedName}
      label={resolvedLabel}
      required={resolvedRequired}
      type={resolvedType}
      properties={{
        ...(field?.properties || {}),
        ...(tooltip ? { tooltip } : {}),
      }}
      meta={{
        ...(field?.meta || {}),
        ui: {
          ...(field?.meta?.ui || {}),
          ...(labelAction ? { labelAction } : {}),
        },
      }}
      styles={styles}
      showLabel={showLabel}
    />
  );

  // Calculate Multi-Target ARIA describedby IDs
  const hasHelper = Boolean(
    description || helperText || field?.description || field?.meta?.ui?.helpText
  );
  const hasError = Boolean(
    error || errorMessage || (errors && errors.length > 0)
  );
  const hasTooltip = Boolean(tooltip || field?.properties?.tooltip);

  const describedByIds = [
    hasHelper ? `${resolvedId}-help` : undefined,
    hasError ? `${resolvedId}-error` : undefined,
    hasTooltip ? `${resolvedId}-tooltip` : undefined,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  // Auto-bridge ariaKeyShortcuts with Core Event Registry
  const resolvedAriaKeyShortcuts =
    (field?.properties as any)?.ariaKeyShortcuts ||
    (layout as any)?.ariaKeyShortcuts ||
    (field as any)?.ariaKeyShortcuts;

  useEffect(() => {
    if (!resolvedAriaKeyShortcuts || !resolvedId) return;
    const normalizedKey = String(resolvedAriaKeyShortcuts).toLowerCase().trim();
    const shortcutId = `form-field-${resolvedId}-${normalizedKey}`;

    useEventRegistry.getState().registerShortcut(shortcutId, {
      key: normalizedKey,
      description: `Focus ${typeof resolvedLabel === "string" ? resolvedLabel : resolvedName || resolvedId}`,
      enabled: true,
      priority: 10,
      scope: "global",
      command: {
        execute: () => {
          const el = document.getElementById(resolvedId);
          if (el) {
            el.focus();
            if ("select" in el && typeof (el as any).select === "function") {
              (el as any).select();
            }
          }
        },
      },
    });

    return () => {
      useEventRegistry.getState().unregisterShortcut(shortcutId);
    };
  }, [resolvedAriaKeyShortcuts, resolvedId, resolvedLabel, resolvedName]);

  const shellContextValue: FieldShellContextValue = {
    id: resolvedId,
    name: resolvedName,
    type: resolvedType,
    required: resolvedRequired,
    disabled: Boolean(_disabled || field?.disabled),
    readOnly: Boolean(_readOnly || field?.readOnly),
    hasError,
    error,
    errorMessage,
    errors,
    describedByIds,
    ariaKeyShortcuts: resolvedAriaKeyShortcuts,
    density,
  };

  const compositionValue = React.useMemo(
    () => ({ mode: "managed" as const }),
    []
  );

  // Surface Content (with or without OuterWrapper)
  const surfaceContent = wrapOuter ? (
    <OuterWrapper
      field={field}
      type={resolvedType}
      density={density}
      styles={styles}
      startContent={resolvedStartContent}
      endContent={resolvedEndContent}
    >
      <FieldShellContext.Provider value={shellContextValue}>
        <FieldCompositionContext.Provider value={compositionValue}>
          {children}
        </FieldCompositionContext.Provider>
      </FieldShellContext.Provider>
    </OuterWrapper>
  ) : (
    <FieldShellContext.Provider value={shellContextValue}>
      <FieldCompositionContext.Provider value={compositionValue}>
        {children}
      </FieldCompositionContext.Provider>
    </FieldShellContext.Provider>
  );

  return (
    <Box
      className={cn("form-field-shell form-field-container group relative w-full", styles.base, className)}
      data-testid={resolvedId ? `field-${resolvedId}` : undefined}
      data-field-id={resolvedId}
      data-field-name={resolvedName}
      data-field-type={resolvedType}
      data-field-component={resolvedComponentName}
      data-density={density}
      data-state={hasError ? "invalid" : "valid"}
      data-disabled={_disabled || field?.disabled ? "" : undefined}
      data-readonly={_readOnly || field?.readOnly ? "" : undefined}
      data-required={resolvedRequired ? "" : undefined}
    >
      <InputWrapper
        field={field}
        label={labelNode}
        feedback={feedbackNode}
        labelPlacement={labelPlacement}
        error={error}
        styles={styles}
      >
        {surfaceContent}
      </InputWrapper>
    </Box>
  );
};


FieldShell.displayName = "FieldShell";
