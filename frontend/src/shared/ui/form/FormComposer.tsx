import { useCallback, useMemo } from "react";

import { FieldRouter } from "@ui/form/FieldRouter";
import {
  FormOrchestratorProvider,
  useFormOrchestrator,
  usePrimitiveRuntime,
} from "@ui/form/context/FormOrchestratorContext";
import { manifestRegistry } from "@form-core/ManifestRegistry";
import type { FormField } from "@ui/form/fields";
import { SectionComposer } from "@ui/form/layout/SectionComposer";
import type { RuntimeLayoutConfig } from "@ui/form/types/layout";
import { FormMetricsAnalyzer } from "@ui/form/utils/form-metrics";
import { SpacingCalculator } from "@ui/form/utils/spacing-calculator";
import { AnimatePresence } from "framer-motion";

interface FormComposerProps {
  fields: FormField[];
  /**
   * @deprecated Pass getComponentProps/visibility into the FormOrchestratorContext
   * via usePrimitiveRuntime() at the root instead. These props are kept for
   * backward-compatibility but context values take precedence.
   */
  getComponentProps?: (fieldId: string) => any;
  parentLayout?: RuntimeLayoutConfig;
  visibility?: Record<string, boolean>;
  /** Fill the parent pane's height, spreading fields evenly (e.g. auth split pane). */
  fillVertical?: boolean;
}

/**
 * FormComposer - Orchestrates form layout and structure.
 *
 * COMPOSITION LAYER: Handles spacing context and wires FieldRouter ↔ SectionComposer
 * via FormRoutingContext (avoids circular imports between the two).
 *
 * Phase 1: getComponentProps and visibility are now resolved from context
 * (usePrimitiveRuntime) rather than being prop-drilled. The props remain for
 * backward-compatibility with direct usages, but context always takes precedence.
 */
export function FormComposer({
  fields,
  parentLayout,
  fillVertical = false,
}: FormComposerProps) {
  // Phase 1: resolve from context — no more prop drilling
  const { getComponentProps, visibility } = usePrimitiveRuntime();

  const metrics = useMemo(() => FormMetricsAnalyzer.analyze(fields), [fields]);
  const spacing = useMemo(
    () => SpacingCalculator.calculateSpacing(metrics),
    [metrics]
  );

  const renderField = useCallback(
    (props: {
      field: FormField;
      getComponentProps: (fieldId: string) => any;
      visibility?: Record<string, boolean>;
      spacing?: any;
      parentLayout?: RuntimeLayoutConfig;
    }) => (
      <FieldRouter
        key={props.field.id}
        field={props.field}
        getComponentProps={props.getComponentProps}
        visibility={props.visibility}
        spacing={props.spacing}
        parentLayout={props.parentLayout}
      />
    ),
    []
  );

  const renderStructure = useCallback(
    (props: {
      field: FormField;
      getComponentProps: (fieldId: string) => any;
      visibility?: Record<string, boolean>;
      spacing?: any;
      parentLayout?: RuntimeLayoutConfig;
    }) => (
      <SectionComposer
        key={props.field.id}
        field={props.field}
        getComponentProps={props.getComponentProps}
        visibility={props.visibility}
        spacing={props.spacing}
        parentLayout={props.parentLayout}
      />
    ),
    []
  );

  const parentOrchestrator = useFormOrchestrator();
  const orchestratorValue = useMemo(
    () => ({
      ...parentOrchestrator,
      spacing,
      routing: { renderField, renderStructure },
      manifest: { manifestRegistry },
    }),
    [parentOrchestrator, spacing, renderField, renderStructure]
  );

  return (
    <FormOrchestratorProvider value={orchestratorValue}>
      <div
        className={`${spacing.sectionVertical} w-full${
          fillVertical ? " flex-1 flex flex-col justify-between" : ""
        }`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {fields.map((field) =>
            renderField({
              field,
              getComponentProps,
              visibility,
              spacing,
              parentLayout,
            })
          )}
        </AnimatePresence>
      </div>
    </FormOrchestratorProvider>
  );
}
