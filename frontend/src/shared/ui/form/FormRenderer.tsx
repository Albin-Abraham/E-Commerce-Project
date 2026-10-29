import React, { useMemo } from "react";

import { useThemeStore } from "@core/state/theme.store";

import { FormComposer } from "./FormComposer";
import { FormRegistryProvider } from "./context/FormRegistryContext";
import { FormRuntimeProvider } from "./context/FormRuntimeProvider";
import { FormThemeProvider } from "./context/FormThemeContext";
import type { FormField } from "./fields";
import { defaultRegistry } from "./fields/lazy-registry-builder";
import { useForm } from "./hooks/useForm";
import { DEFAULT_FORM_THEME } from "./styles/FormTheme";
import type { StyleAdapter } from "./styles/style-adapter";
import type { FormDefinition, RenderDefinition } from "./types";
import { SchemaNormalizer } from "./utils/SchemaNormalizer";
import { validateFormDefinition } from "./utils/form-config-validator";

export interface FormRendererProps<
  T extends Record<string, any> = Record<string, any>,
> {
  definition: FormDefinition<T> | RenderDefinition<T>;
  value?: T;
  onChange?: (fieldId: string, value: any) => void;
  errors?: Record<string, string>;
  slots?: Record<string, any>;
  className?: string;
  adapter?: StyleAdapter;
}

/**
 * RenderNode - Renders an individual FieldNode in the dynamic tree.
 * getComponentProps/visibility are optional — resolved from context (usePrimitiveRuntime).
 */
export const RenderNode: React.FC<{
  node: FormField;
  getComponentProps?: (id: string) => any;
  visibility?: Record<string, boolean>;
}> = ({ node }) => {
  return <FormComposer fields={[node]} />;
};

/**
 * RenderChild - Recursively renders children list inside a parent layout node.
 * getComponentProps/visibility are optional — resolved from context (usePrimitiveRuntime).
 */
export const RenderChild: React.FC<{
  children: FormField[];
  getComponentProps?: (id: string) => any;
  visibility?: Record<string, boolean>;
}> = ({ children }) => {
  return <FormComposer fields={children} />;
};

const EMPTY_DATA = Object.freeze({});

/**
 * FormRenderer - A lightweight dynamic layout renderer.
 *
 * Perfect for rendering a RenderDefinition or FormDefinition purely as functional
 * layout nodes without the full <form> wrapper, submit buttons, headers, or footers.
 *
 * Uses `FormRuntimeProvider` for a single clean provider root — no provider hell.
 * Integrates global theme orchestration and ingest validation diagnostics.
 */
export function FormRenderer<
  T extends Record<string, any> = Record<string, any>,
>({
  definition,
  value,
  onChange,
  slots,
  className = "",
  adapter,
}: FormRendererProps<T>) {
  // Runtime ingest validation diagnostic
  const validation = useMemo(() => {
    return validateFormDefinition(definition);
  }, [definition]);

  if (import.meta.env?.DEV) {
    if (!validation.valid) {
      console.error("[FormRenderer] Validation errors in FormDefinition:", validation.errors);
    }
    if (validation.warnings.length > 0) {
      console.warn("[FormRenderer] Validation warnings in FormDefinition:", validation.warnings);
    }
  }

  const nodes = useMemo(() => {
    return SchemaNormalizer.normalize(definition as any);
  }, [definition]);

  const effectiveValue = value ?? (EMPTY_DATA as unknown as T);
  const previousValuesRef = React.useRef<Record<string, any>>(effectiveValue || {});

  React.useEffect(() => {
    if (value) {
      previousValuesRef.current = value;
    }
  }, [value]);

  const { form, getComponentProps, visibility } = useForm(
    definition as any,
    effectiveValue,
    {
      onChange: (values, changedField) => {
        if (!onChange) return;
        if (changedField) {
          const fieldKey = changedField.name || changedField.id;
          if (fieldKey && previousValuesRef.current[fieldKey] !== (values as any)[fieldKey]) {
            previousValuesRef.current[fieldKey] = (values as any)[fieldKey];
            onChange(fieldKey, (values as any)[fieldKey]);
            return;
          }
        }
        Object.entries(values).forEach(([key, val]) => {
          if (previousValuesRef.current[key] !== val) {
            previousValuesRef.current[key] = val;
            onChange(key, val);
          }
        });
      },
    }
  );

  const storeTheme = useThemeStore();

  const activeTheme = useMemo(() => {
    const settings = (definition as any).settings || {};
    const style = (definition as any).style || {};

    const density = style.density || settings.density || storeTheme.density || "comfortable";

    const radiusMap: Record<string, any> = {
      sharp: "none",
      rounded: "medium",
      pill: "full",
      default: "large",
    };
    const storeRadiusMapped = radiusMap[storeTheme.radius] || "large";
    const explicitRadius = style.radius
      ? radiusMap[style.radius] || style.radius
      : storeRadiusMapped;

    return {
      ...DEFAULT_FORM_THEME,
      density: density as any,
      radius: explicitRadius as any,
    };
  }, [definition, storeTheme.density, storeTheme.radius]);

  const brand = (definition as any).style?.themeBrand || storeTheme.brand;
  const surfaceVariant = (definition as any).style?.surfaceVariant || "default";

  const registryContextValue = useMemo(
    () => ({
      registry: defaultRegistry,
      debug: false,
      form,
      i18nNamespace: "features/forms",
    }),
    [form]
  );

  const orchestratorValue = useMemo(
    () => ({
      registry: registryContextValue,
      getComponentProps,
      visibility,
      slots,
      data: value,
    }),
    [registryContextValue, getComponentProps, visibility, slots, value]
  );

  return (
    <FormThemeProvider theme={activeTheme} adapter={adapter}>
      {/* Single provider replaces the previous 3-level nesting */}
      <FormRuntimeProvider
        orchestrator={orchestratorValue}
        surface={{
          layoutMode: "inline",
          isWizard: false,
          initialStepId: nodes[0]?.id || "",
        }}
        remoteOptions={(form as any).remoteOptions}
      >
        <FormRegistryProvider value={registryContextValue}>
          <div
            data-brand={brand}
            data-density={activeTheme.density}
            data-radius={storeTheme.radius}
            data-surface={surfaceVariant}
            className={`form-renderer-root ${className} w-full flex flex-col gap-6`}
          >
            {nodes.map((node) => (
              <RenderNode key={node.id} node={node} />
            ))}
          </div>
        </FormRegistryProvider>
      </FormRuntimeProvider>
    </FormThemeProvider>
  );
}
