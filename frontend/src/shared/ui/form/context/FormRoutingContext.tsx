import React from "react";

import type { FormField } from "@ui/form/fields";
import type { RuntimeLayoutConfig } from "@ui/form/types/layout";
import type { SpacingConfig } from "@ui/form/utils/spacing-calculator";

import {
  FormOrchestratorProvider,
  useFormOrchestrator,
} from "./FormOrchestratorContext";

interface RoutingRenderProps {
  field: FormField;
  getComponentProps: (fieldId: string) => any;
  visibility?: Record<string, boolean>;
  spacing?: SpacingConfig;
  parentLayout?: RuntimeLayoutConfig;
}

interface FormRoutingContextValue {
  renderField: (props: RoutingRenderProps) => React.ReactNode;
  renderStructure: (props: RoutingRenderProps) => React.ReactNode;
}

export function FormRoutingProvider({
  renderField,
  renderStructure,
  children,
}: {
  renderField: any;
  renderStructure: any;
  children: React.ReactNode;
}) {
  const parent = useFormOrchestrator();
  return (
    <FormOrchestratorProvider
      value={{ ...parent, routing: { renderField, renderStructure } }}
    >
      {children}
    </FormOrchestratorProvider>
  );
}

export function useFieldRouter(): FormRoutingContextValue["renderField"] {
  const ctx = useFormOrchestrator();
  if (!ctx?.routing) {
    return () => null;
  }
  return ctx.routing.renderField;
}

export function useStructureRenderer(): FormRoutingContextValue["renderStructure"] {
  const ctx = useFormOrchestrator();
  if (!ctx?.routing) {
    return () => null;
  }
  return ctx.routing.renderStructure;
}
