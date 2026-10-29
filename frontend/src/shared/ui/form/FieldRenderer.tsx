import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useFormRegistry } from "@ui/form/context/FormRegistryContext";
import type { DetailedError } from "@form-core/int-types";
import type { FormField } from "@ui/form/fields";
import { getFieldCategory } from "@ui/form/fields";
import { useFieldViewModel } from "@ui/form/hooks/useFieldViewModel";

import { ErrorBoundary } from "@shared/ui/common/ErrorBoundary";
import { FieldSkeleton } from "@ui/form/components/FieldSkeleton";
import { cn } from "@ui/form/utils/form-styles";

interface FieldRendererProps {
  field: FormField;
  value?: any;
  error?: string | boolean;
  errorMessage?: string;
  errors?: DetailedError[];
  onChange?: (value: any) => void;
  className?: string;
  showLabel?: boolean;
  options?: readonly any[];
  classes?: any; // Design System Classes (DCS)
  density?: "compact" | "comfortable" | "spacious";
  inputRef?: React.RefObject<any>; // Fallback for legacy ref passing
  [key: string]: any;
}

/**
 * InputFieldRenderer
 * Handles individual input components with ref forwarding and suspense support.
 */
const InputFieldRendererBase = React.forwardRef<
  any,
  FieldRendererProps & { isInvalid?: boolean; isEmpty?: boolean }
>(function InputFieldRendererBase(
  {
    field,
    isInvalid: _isInvalid, // Destruct to prevent DOM leakage
    isEmpty: _isEmpty, // Destruct to prevent DOM leakage
    ...rest
  },
  ref
) {
  useTranslation(); // Force reactivity on language change
  const { registry } = useFormRegistry();
  const Component = useMemo(() => {
    // 1. Explicit root component override (from field or rest props)
    // 2. Legacy/Injection meta component override
    const override = field.component || rest.component || field.meta?.ui?.component;

    if (override) {
      return typeof override === "string" ? registry.get(override) : override;
    }

    // 3. Default registry lookup via type
    const resolvedType = field.type || (rest.type as string);
    return registry.get(resolvedType);
  }, [field.type, field.component, field.meta?.ui?.component, rest.component, rest.type, registry]);

  if (!Component) {
    return <MissingField id={field.id} type={field.type} />;
  }

  const resolvedComponentName =
    typeof (field.component || rest.component) === "string"
      ? (field.component || rest.component)
      : field.type || rest.type;

  const element = (
    <Component
      ref={ref}
      field={field}
      name={field.name || (rest.name as string)}
      type={field.type || (rest.type as string)}
      component={resolvedComponentName}
      id={field.id || rest.id || field.name}
      label={field.label || rest.label}
      placeholder={field.placeholder || (field.layout as any)?.placeholder || rest.placeholder}
      disabled={field.disabled || (field.layout as any)?.disabled || rest.disabled}
      readOnly={(field.layout as any)?.readOnly || rest.readOnly}
      required={field.required || rest.required}
      description={field.description || rest.description}
      {...rest}
      error={rest.error}
      errorMessage={rest.errorMessage}
      errors={rest.errors}
      data-testid={`field-${field.id || field.name}`}
      data-field-type={field.type || rest.type}
      data-field-name={field.name || rest.name}
      data-field-component={resolvedComponentName}
    />
  );

  const isLazy =
    (Component as any)?.$$typeof === Symbol.for("react.lazy") ||
    (Component as any)?.__isLazy;

  if (isLazy) {
    return (
      <React.Suspense
        fallback={
          <FieldSkeleton type={field.type} component={field.component as string} />
        }
      >
        {element}
      </React.Suspense>
    );
  }

  return element;
});

const InputFieldRenderer = React.memo(InputFieldRendererBase);

/**
 * StaticFieldRenderer
 * Handles non-interactive elements like headers, images, etc.
 */
const StaticFieldRenderer = React.memo(function StaticFieldRenderer({
  field,
  className: _className,
  isInvalid: _isInvalid, // Destruct to prevent DOM leakage
  isEmpty: _isEmpty, // Destruct to prevent DOM leakage
  ...rest
}: FieldRendererProps & { isInvalid?: boolean; isEmpty?: boolean }) {
  useTranslation(); // Force reactivity on language change
  const { registry } = useFormRegistry();
  const Component = useMemo(() => {
    const override = field.component || rest.component || field.meta?.ui?.component;
    if (override) {
      return typeof override === "string" ? registry.get(override) : override;
    }
    const resolvedType = field.type || (rest.type as string);
    return registry.get(resolvedType);
  }, [field.type, field.component, field.meta?.ui?.component, rest.component, rest.type, registry]);

  if (!Component) {
    return <MissingField id={field.id} type={field.type} />;
  }

  const resolvedComponentName =
    typeof (field.component || rest.component) === "string"
      ? (field.component || rest.component)
      : field.type || rest.type;

  const staticContent = (
    <Component
      field={field}
      name={field.name || (rest.name as string)}
      type={field.type || (rest.type as string)}
      component={resolvedComponentName}
      id={field.id || rest.id || field.name}
      className={field.className}
      {...(rest as any)}
      data-field-type={field.type || rest.type}
      data-field-name={field.name || rest.name}
      data-field-component={resolvedComponentName}
    />
  );

  const isLazy =
    (Component as any)?.$$typeof === Symbol.for("react.lazy") ||
    (Component as any)?.__isLazy;

  return (
    <div
      className={cn("form-field-static group w-full", field.className)}
      data-testid={`field-${field.id || field.name}`}
      data-field-type={field.type || rest.type}
      data-field-name={field.name || rest.name}
      data-field-component={resolvedComponentName}
    >
      <ErrorBoundary
        fallback={
          <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-[10px] rounded-lg">
            <strong>Field Error:</strong> {field.type}
          </div>
        }
      >
        {isLazy ? (
          <React.Suspense
            fallback={
              <FieldSkeleton type={field.type} component={field.component as string} />
            }
          >
            {staticContent}
          </React.Suspense>
        ) : (
          staticContent
        )}
      </ErrorBoundary>
    </div>
  );
});

/**
 * Main FieldRenderer - Routes to category-specific renderers.
 */
const FieldRendererBase = React.forwardRef<any, FieldRendererProps>(
  function FieldRendererBase(props, ref) {
    useTranslation(); // Force reactivity on language change
    const { field } = props;
    const category = useMemo(() => getFieldCategory(field.type), [field.type]);

    const atomicProps = useFieldViewModel(field.id);

    const effectiveProps = {
      ...props,
      ...atomicProps,
      field, // Re-assert field to satisfy TypeScript
    } as unknown as FieldRendererProps & { isInvalid?: boolean; isEmpty?: boolean };

    switch (category) {
      case "input":
        return <InputFieldRenderer {...effectiveProps} ref={ref} />;
      case "static":
        return <StaticFieldRenderer {...effectiveProps} />;
      default:
        return <InputFieldRenderer {...effectiveProps} ref={ref} />;
    }
  }
);

export const FieldRenderer = React.memo(FieldRendererBase);

/**
 * Fallback Component for missing field types.
 */
const MissingField = ({ id, type }: { id: string; type: string }) => (
  <div
    className="p-4 border border-dashed border-danger/30 rounded-lg bg-danger/5 text-danger font-mono text-[10px] sm:text-xs"
    data-testid={`missing-field-${id}`}
    data-field-type={type}
  >
    <div className="flex items-center gap-2 mb-1">
      <span className="p-1 px-1.5 bg-danger text-white rounded font-bold uppercase">
        Missing Type
      </span>
      <span className="font-bold">{type}</span>
    </div>
    <div className="text-muted/60 truncate">ID: {id}</div>
  </div>
);
