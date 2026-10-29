import React, { useCallback, useEffect, useMemo, useState } from "react";

import { HelpText } from "@ui/form/atoms/HelpText";
import {
  FormOrchestratorProvider,
  useFormOrchestrator,
} from "@ui/form/context/FormOrchestratorContext";
import {
  useFormTheme,
  useStyleAdapter,
} from "@ui/form/context/FormThemeContext";
import { synthesizeFormField } from "@form-core/domain/field-adapter";
import type { DetailedError } from "@form-core/int-types";
import { type FieldType, type FormField, getFieldCategory } from "@ui/form/fields";
import type { FieldComponent } from "@ui/form/fields/registry";
import { FieldShell } from "@ui/form/structure/FieldShell";
import {
  getFieldLayout,
  getFieldOptions,
  getFieldPlaceholder,
  getFieldIcon,
} from "@ui/form/utils/form-layout-utils";
import { cn, stripVerticalMargins } from "@ui/form/utils/form-styles";
import { getIcon } from "@ui/form/utils/icon-registry";

import { useFieldComposition } from "../context/FieldCompositionContext";

/**
 * Direct props contract for invoking wrapped field components outside of schema definitions.
 */
export interface DirectFieldProps<TValue = any> {
  name: string;
  id?: string;
  type?: FieldType | string;
  label?: React.ReactNode;
  placeholder?: string;
  value?: TValue;
  defaultValue?: TValue;
  onChange?: (value: TValue) => void;
  onBlur?: () => void;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  errors?: readonly DetailedError[];
  helpText?: React.ReactNode;
  tooltip?: React.ReactNode;
  density?: "compact" | "comfortable" | "spacious";
  showLabel?: boolean;
  options?: readonly any[];
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  startIcon?: string | React.ReactNode;
  endIcon?: string | React.ReactNode;
  className?: string;
  styles?: Record<string, string | undefined>;
}

/**
 * Options for the withAtom HOC.
 */
export interface WithAtomOptions {
  /** Whether the label is rendered. */
  showLabel?: boolean;
  /** Whether the outer wrapper div is rendered. */
  wrapOuter?: boolean;
}

/**
 * Props that withAtom injects into the wrapped component.
 * These come from the FormEngine adapter and the DCS layer.
 */
export interface WithAtomInjectedProps {
  field: FormField;
  layout?: ReturnType<typeof getFieldLayout>;
  styles?: Record<string, string | undefined>;
  error?: boolean;
  errorMessage?: string;
  errors?: readonly DetailedError[];
  showPassword?: boolean;
  tabIndex?: number;
}

/**
 * withAtom HOC (The DCS - Data Component System Layer)
 *
 * Responsibility: Handles only the visual orchestration of a component.
 * It applies the "Wrapper Trinity" (Outer/Inner) and maps presentation
 * data (intent, variant, layout) to Tailwind classes.
 */
export function withAtom(
  Component: React.ComponentType<any>,
  options: WithAtomOptions = {
    showLabel: true,
    wrapOuter: true,
  }
): FieldComponent {
  // If Component is already wrapped with withAtom, return it directly to guarantee idempotency.
  if ((Component as any)?.__isAtomWrapped) {
    return Component as FieldComponent;
  }

  const AtomWrapper = React.forwardRef<any, any>(function AtomWrapper(
    props: Record<string, unknown> &
      WithAtomInjectedProps & { showLabel?: boolean; density?: string },
    ref
  ) {
    const {
      field: propField,
      className: _className,
      value: propValue,
      onChange: propOnChange,
      error: propError,
      errorMessage: propErrorMessage,
      errors: propErrors,
      density: forcedDensity,
      layout: _layout,
      styles: _styles,
      showPassword: _showPassword,
      tabIndex: _tabIndex,
      showLabel: _showLabel,
      ...rest
    } = props;

    // Autonomous fallback: synthesize a canonical FormField when the wrapped component is used standalone
    const field = useMemo<FormField>(() => {
      if (propField) return propField;
      const resolvedOptions = getFieldOptions(undefined, props);
      const resolvedPlaceholder = getFieldPlaceholder(undefined, props);
      const icons = getFieldIcon(undefined, props);

      return synthesizeFormField({
        ...props,
        placeholder: resolvedPlaceholder,
        options: resolvedOptions,
        properties: {
          ...((props.properties as Record<string, any>) || {}),
          startIcon: icons.startIcon,
          endIcon: icons.endIcon,
        },
      });
    }, [
      propField,
      props.id,
      props.name,
      props.type,
      props.label,
      props.placeholder,
      props.required,
      props.disabled,
      props.options,
      props.properties,
      props.componentProps,
      props.meta,
      props.className,
      props.startIcon,
      props.endIcon,
      props.leftIcon,
      props.rightIcon,
    ]);

    // Explicit composition contract: check if rendered inside a FieldShell or another atom
    const composition = useFieldComposition();

    const theme = useFormTheme();
    const adapter = useStyleAdapter();

    // 1. Orchestrator & Inline Edit Metamorphosis
    const orchestrator = useFormOrchestrator();
    const globalMode = orchestrator?.mode || "edit";
    const isStandalone = !orchestrator?.getComponentProps;

    // Autonomous fallback: in standalone / Storybook mode, manage local state
    // so fields are interactive and reactive without an external container.
    const [standaloneValue, setStandaloneValue] = useState<any>(() =>
      propValue !== undefined ? propValue : (props.defaultValue ?? field.initialValue)
    );

    useEffect(() => {
      if (propValue !== undefined) {
        setStandaloneValue(propValue);
      }
    }, [propValue]);

    const value = isStandalone ? (standaloneValue ?? propValue) : propValue;

    const onChange = useCallback(
      (newVal: any) => {
        if (isStandalone) {
          setStandaloneValue(newVal);
        }
        if (typeof propOnChange === "function") {
          (propOnChange as any)(newVal);
        }
      },
      [isStandalone, propOnChange]
    );

    const error = propError;
    const errorMessage = propErrorMessage;
    const errors = propErrors;

    // DCS Capability Check
    const supportsInlineEdit = field.meta?.ui?.inlineEditable === true;
    const [isInlineEditing, setIsInlineEditing] = useState(false);
    const effectiveMode = isInlineEditing ? "edit" : globalMode;

    // 2. Derive Presentation Components
    const layout = useMemo(() => getFieldLayout(field), [field]);
    const styles = useMemo(() => {
      // P1 FIX: Allow structure components to force density on their atomic children
      const effectiveTheme = forcedDensity
        ? { ...theme, density: forcedDensity }
        : theme;
      const computed = adapter.buildFieldStyles(
        field,
        false,
        !!error,
        effectiveTheme as any
      );
      // Grid-like sections own vertical spacing via gap — suppress any
      // per-field vertical margins (mb-*/mt-*/m-*) so they don't double-stack.
      if (orchestrator?.spacingAuthority === "gap") {
        computed.base = stripVerticalMargins(computed.base);
      }
      return computed;
    }, [
      adapter,
      field,
      theme,
      error,
      forcedDensity,
      orchestrator?.spacingAuthority,
    ]);

    // 3. Resolve Icons/Prefixes/Left Content for the OuterWrapper Surface
    const startContent = useMemo(() => {
      // 1. Explicit prop passed to wrapped component
      if (props.startContent) return props.startContent as React.ReactNode;
      if ((props as any).leftContent) return (props as any).leftContent as React.ReactNode;
      if ((props as any).prefix) return (props as any).prefix as React.ReactNode;

      // 2. ComponentProps override
      if (field.componentProps?.startContent) return field.componentProps.startContent;
      if (field.componentProps?.leftContent) return field.componentProps.leftContent;

      // 3. Properties override
      if (field.properties?.startContent) return field.properties.startContent;
      if (field.properties?.leftContent) return field.properties.leftContent;
      if (field.properties?.prefix) return field.properties.prefix;

      // 4. Meta UI slot override
      if (field.meta?.ui?.startContent) return field.meta.ui.startContent;
      if (field.meta?.ui?.leftContent) return field.meta.ui.leftContent;

      // 5. Icon registry lookup
      const iconName =
        field.meta?.ui?.icon ||
        field.properties?.icon ||
        field.properties?.leftIcon;

      if (!iconName) return null;
      if (React.isValidElement(iconName)) return iconName;
      if (typeof iconName === "string") {
        const IconComp = getIcon(iconName);
        if (IconComp) return <IconComp size={16} strokeWidth={2.5} />;
      }
      return null;
    }, [
      props.startContent,
      (props as any).leftContent,
      (props as any).prefix,
      field.componentProps?.startContent,
      field.componentProps?.leftContent,
      field.properties?.startContent,
      field.properties?.leftContent,
      field.properties?.prefix,
      field.properties?.icon,
      field.properties?.leftIcon,
      field.meta?.ui?.startContent,
      field.meta?.ui?.leftContent,
      field.meta?.ui?.icon,
    ]);

    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = field.type === "password";

    // 4. Resolve Right Content / Tooltip / Password Toggle
    const endContent = useMemo(() => {
      // 1. Explicit prop passed to wrapped component
      if (props.endContent) return props.endContent as React.ReactNode;
      if ((props as any).rightContent) return (props as any).rightContent as React.ReactNode;
      if ((props as any).suffix) return (props as any).suffix as React.ReactNode;

      // 2. ComponentProps override
      if (field.componentProps?.endContent) return field.componentProps.endContent;
      if (field.componentProps?.rightContent) return field.componentProps.rightContent;

      // 3. Properties override
      if (field.properties?.endContent) return field.properties.endContent;
      if (field.properties?.rightContent) return field.properties.rightContent;
      if (field.properties?.suffix) return field.properties.suffix;

      // 4. Meta UI slot override
      if (field.meta?.ui?.endContent) return field.meta.ui.endContent;
      if (field.meta?.ui?.rightContent) return field.meta.ui.rightContent;

      // 5. Right icon lookup
      const rightIconName =
        field.properties?.rightIcon ||
        field.properties?.endIcon ||
        field.meta?.ui?.rightIcon ||
        field.meta?.ui?.endIcon;

      if (rightIconName) {
        if (React.isValidElement(rightIconName)) return rightIconName;
        if (typeof rightIconName === "string") {
          const IconComp = getIcon(rightIconName);
          if (IconComp) return <IconComp size={16} strokeWidth={2.5} />;
        }
      }

      // 6. Password Toggle
      if (isPasswordField) {
        const Icon = showPassword ? getIcon("eye-off") : getIcon("eye");
        if (!Icon) return null;
        return (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-foreground/30 hover:text-primary transition-colors focus:outline-none cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <Icon size={16} strokeWidth={2.5} />
          </button>
        );
      }

      // 7. Inner Tooltip
      const tooltip = field.properties?.tooltip;
      const placement = field.properties?.tooltipPlacement;
      if (!tooltip || placement !== "inner") return null;

      return <HelpText text={tooltip} />;
    }, [
      props.endContent,
      (props as any).rightContent,
      (props as any).suffix,
      field.componentProps?.endContent,
      field.componentProps?.rightContent,
      field.properties?.endContent,
      field.properties?.rightContent,
      field.properties?.suffix,
      field.properties?.rightIcon,
      field.properties?.endIcon,
      field.meta?.ui?.endContent,
      field.meta?.ui?.rightContent,
      field.meta?.ui?.rightIcon,
      field.meta?.ui?.endIcon,
      isPasswordField,
      showPassword,
      field.properties?.tooltip,
      field.properties?.tooltipPlacement,
    ]);

    // Intercept blur to snap back to view mode if inline editing
    const handleBlur = (e: React.FocusEvent) => {
      if (isInlineEditing) setIsInlineEditing(false);
      if (rest.onBlur) (rest.onBlur as (e: React.FocusEvent) => void)(e);
    };

    const componentProps = {
      ...field.componentProps,
      field,
      layout,
      styles,
      error,
      onBlur: handleBlur,
      onFocus: rest.onFocus,
      showPassword,
      tabIndex:
        field.properties?.tabIndex ??
        (field.headless || options.wrapOuter === false ? -1 : 0),
      ...rest,
      // Re-assert after ...rest so rest cannot silently overwrite with undefined.
      // The no-op onChange prevents React's "value without onChange" controlled-input warning.
      value,
      onChange: onChange ?? (value !== undefined ? () => {} : undefined),
    };

    // 5. Clean up props to prevent leakage to DOM elements
    const {
      errorMessage: _em,
      errors: _errs,
      showLabel: _sl,
      dataPath: _dp,
      stateKey: _sk,
      rowGroup: _rg,
      componentProps: _cp,
      inputProps: _ip,
      touched: _tch,
      dirty: _drt,
      focused: _fcd,
      version: _ver,
      conflict: _cnf,
      isLoading: _ld,
      onSearch: _os,
      onDebouncedSearch: _ods,
      debounceMs: _dms,
      searchOnType: _sot,
      isInvalid: _inv,
      isEmpty: _emp,
      showPassword: _sp,
      ...cleanProps
    } = componentProps as Record<string, unknown>;

    // When OuterWrapper is enabled, slots (startContent, endContent, prefix, suffix) are
    // consumed exclusively by OuterWrapper. Strip them from child props to prevent double rendering.
    const forwardedProps = { ...(cleanProps as Record<string, unknown>) };
    if (options.wrapOuter !== false) {
      delete forwardedProps.startContent;
      delete forwardedProps.endContent;
      delete forwardedProps.leftContent;
      delete forwardedProps.rightContent;
      delete forwardedProps.prefix;
      delete forwardedProps.suffix;
    }

    const content = <Component ref={ref} {...forwardedProps} />;

    // Explicit composition contract: if rendered inside a FieldShell or another atom,
    // bypass the outer shell so we never double-wrap DOM nodes or labels.
    if (composition.mode === "managed" || composition.mode === "primitive") {
      return content;
    }

    // ── 6. Composite Bypass (True Headless / Static Element Mode) ─────
    // If headless, or a static element configured with wrapOuter === false (headers,
    // paragraphs, buttons, dividers), we skip the InputWrapper / FieldFeedback shell
    // to prevent duplicate descriptions and unwanted feedback margins.
    const isStaticCategory = field.type
      ? getFieldCategory(field.type as FieldType) === "static"
      : false;
    if (field.headless || (isStaticCategory && options.wrapOuter === false)) {
      return (
        <div
          className={cn("form-field-container w-full", styles.base)}
          data-field-id={field.id}
          data-headless="true"
          data-style-strategy="headless"
          data-density={theme.density}
        >
          {content}
        </div>
      );
    }

    const labelPlacement = field.properties?.labelPlacement || "top";

    const shell = (
      <FieldShell
        field={field}
        name={field.name}
        id={field.id}
        label={(props.label as any) ?? field.label}
        placeholder={(props.placeholder as any) ?? field.placeholder}
        description={(props.description as any) ?? field.description}
        helperText={props.helperText as any}
        required={Boolean(props.required ?? field.required)}
        disabled={Boolean(props.disabled ?? field.disabled)}
        readOnly={Boolean(props.readOnly ?? field.readOnly)}
        error={error}
        errorMessage={errorMessage}
        errors={errors}
        labelPlacement={labelPlacement}
        showLabel={props.showLabel ?? options.showLabel}
        wrapOuter={options.wrapOuter}
        startContent={startContent}
        endContent={endContent}
        density={(forcedDensity as any) || theme.density}
        className={props.className as string}
        styles={styles}
      >
        {content}
      </FieldShell>
    );

    if (effectiveMode !== globalMode && orchestrator) {
      return (
        <FormOrchestratorProvider
          value={{ ...(orchestrator as any), mode: effectiveMode }}
        >
          {shell}
        </FormOrchestratorProvider>
      );
    }

    return shell;
  });

  (AtomWrapper as any).__isAtomWrapped = true;
  AtomWrapper.displayName = `withAtom(${Component.displayName || Component.name || "Component"})`;

  return AtomWrapper as FieldComponent;
}

/**
 * Visual Design Component System (DCS) Field Shell Decorator.
 *
 * Enhances a primitive atomic input with the "Wrapper Trinity":
 * 1. `OuterWrapper`: Prefix/suffix adornments, clear actions, password reveal toggles.
 * 2. `InputWrapper`: Accessible labels, required indicators, error reservations, validation hints.
 * 3. `Box`: Responsive density tokens (`compact`, `comfortable`, `spacious`) and CSS variables.
 *
 * @param Component - The atomic primitive input component to wrap.
 * @param options - Configuration options determining label display and outer wrapper wrapping.
 *
 * @returns Pre-wrapped field component ready for direct or schema-driven rendering.
 *
 * @remarks
 * Canonical intent-revealing name for `withAtom`. Preserves exact function identity.
 *
 * @see withAtom
 */
export const withFieldShell = withAtom;

