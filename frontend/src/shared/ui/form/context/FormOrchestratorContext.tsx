import React, { createContext, useContext } from "react";

import type { RegistryStore } from "@ui/form/registry";
import type { Form } from "@form-core/form";
import type { FormField } from "@ui/form/fields";
import type { FormTheme } from "@ui/form/styles/FormTheme";
import type { StyleAdapter } from "@ui/form/styles/style-adapter";
import type { RuntimeLayoutConfig } from "@ui/form/types/layout";
import type { SpacingConfig } from "@ui/form/utils/spacing-calculator";

import type { ManifestRegistry } from "@form-core/ManifestRegistry";

export interface RoutingRenderProps {
  field: FormField;
  getComponentProps: (fieldId: string) => any;
  visibility?: Record<string, boolean>;
  spacing?: SpacingConfig;
  parentLayout?: RuntimeLayoutConfig;
}

export interface FormOrchestratorValue {
  mode?: "edit" | "view";
  slots?: Record<string, any>;
  data?: Record<string, any>;
  registry?: {
    registry: RegistryStore;
    form: Form<any>;
    i18nNamespace?: string;
    debug?: boolean;
    motionConfig?: { disabled?: boolean; reduced?: boolean };
  };
  theme?: FormTheme;
  styleAdapter?: StyleAdapter;
  spacing?: SpacingConfig;
  routing?: {
    renderField: (props: RoutingRenderProps) => React.ReactNode;
    renderStructure: (props: RoutingRenderProps) => React.ReactNode;
  };
  manifest?: {
    manifestRegistry: ManifestRegistry;
  };
  /**
   * Resolved component props factory for primitive fields.
   * Provided by Form/FormRenderer at the top level so that layout nodes
   * (Tabs, Accordion, Grid, etc.) do NOT need to receive it as a prop.
   */
  getComponentProps?: (fieldId: string) => any;
  /**
   * Map of fieldId → boolean visibility flags.
   * Provided at the top level so layout nodes don't pass it through.
   */
  visibility?: Record<string, boolean>;
  /**
   * When a grid-like section supplies automatic gap spacing, this is set to
   * "gap" so leaf fields suppress their own vertical margins — the section
   * gap becomes the single vertical spacing authority (prevents double
   * spacing between fields and their authored top/bottom margin classes).
   */
  spacingAuthority?: "gap";
}

export const FormOrchestratorContext = createContext<FormOrchestratorValue>({});

export const FormOrchestratorProvider: React.FC<{
  value: FormOrchestratorValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <FormOrchestratorContext.Provider value={value}>
      {children}
    </FormOrchestratorContext.Provider>
  );
};

export const useFormOrchestrator = () => useContext(FormOrchestratorContext);

/**
 * `usePrimitiveRuntime` — the primary hook for primitive field drivers.
 *
 * Instead of receiving `getComponentProps` and `visibility` as props,
 * every leaf field driver calls this hook to lazily resolve them from context.
 *
 * This eliminates prop drilling through Tabs → Accordion → Grid → Field.
 *
 * @example
 * // Inside FieldRouter or a custom driver — no props needed:
 * const { getComponentProps, visibility } = usePrimitiveRuntime();
 * const props = getComponentProps(field.id);
 */
export const usePrimitiveRuntime = () => {
  const ctx = useContext(FormOrchestratorContext);
  return {
    getComponentProps: ctx.getComponentProps ?? (() => ({})),
    visibility: ctx.visibility ?? {},
  };
};
