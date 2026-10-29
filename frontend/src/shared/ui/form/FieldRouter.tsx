/**
 * @file FieldRouter.tsx
 * @description Routes each field to the correct renderer based on manifest.
 *
 * Decision flow:
 * 1. Look up field type in ManifestRegistry.
 * 2. Check visibility (skip hidden fields).
 * 3. Route by category:
 *    - `container` / `composite` → SectionComposer (via `renderStructure`)
 *    - `repeater` routing → RepeaterField
 *    - `leaf` / `slot` routing → FieldRenderer (atomic input / static field)
 *
 * No hardcoded type sets — all routing metadata comes from FieldManifest.
 *
 * @module FieldRouter
 */
import React, { useMemo } from "react";

import { FieldRenderer } from "@ui/form/FieldRenderer";
import {
  useFormOrchestrator,
  usePrimitiveRuntime,
} from "@ui/form/context/FormOrchestratorContext";
import { useFormRegistry } from "@ui/form/context/FormRegistryContext";
import { useStructureRenderer } from "@ui/form/context/FormRoutingContext";
import { useFormTheme } from "@ui/form/context/FormThemeContext";
import { useManifestRegistry } from "@ui/form/context/ManifestRegistryContext";
import type { FormField } from "@ui/form/fields";
import { RepeaterField } from "@ui/form/fields/structure/RepeaterField";
import { FieldDebugWrapper } from "@ui/form/tools/FormDebugOverlay";
import type { RuntimeLayoutConfig } from "@ui/form/types/layout";
import {
  buildFieldWrapperClasses,
  cn,
  stripVerticalMargins,
} from "@ui/form/utils/form-styles";
import type { SpacingConfig } from "@ui/form/utils/spacing-calculator";
import { m } from "framer-motion";

interface FieldRouterProps {
  /** The field definition to render. */
  field: FormField;
  /**
   * @deprecated Resolved from context via usePrimitiveRuntime().
   * Kept for backward-compatibility with direct usages.
   */
  getComponentProps?: (fieldId: string) => any;
  /**
   * @deprecated Resolved from context via usePrimitiveRuntime().
   * Kept for backward-compatibility with direct usages.
   */
  visibility?: Record<string, boolean>;
  /** Spacing configuration passed to child renderers. */
  spacing?: SpacingConfig;
  /** Layout config of the parent container (for responsive column sizing). */
  parentLayout?: RuntimeLayoutConfig;
}

/**
 * FieldRouter — Routes each field to the correct renderer based on manifest.
 *
 * Routing strategy (manifest-driven):
 * - `container` / `composite` categories → renderStructure (SectionComposer)
 * - `repeater` routing → RepeaterField (dynamic row management)
 * - `leaf` / `slot` routing → FieldRenderer (atomic input / static field)
 *
 * No hardcoded type sets — all routing metadata comes from FieldManifest.
 */
export const FieldRouter = React.memo<FieldRouterProps>(function FieldRouter({
  field,
  getComponentProps: propGetComponentProps,
  visibility: propVisibility,
  spacing,
  parentLayout,
}) {
  const renderStructure = useStructureRenderer();
  const { manifestRegistry } = useManifestRegistry();
  const { debug, motionConfig: globalMotion } = useFormRegistry();
  const theme = useFormTheme();

  // Grid-like sections supplying automatic gap spacing mark the subtree with
  // spacingAuthority: "gap" — suppress per-field wrapper margins so they don't
  // double-stack on the section gap.
  const orchestrator = useFormOrchestrator();
  const gapAuthority = orchestrator?.spacingAuthority === "gap";

  // Phase 1: prefer context over props — eliminates prop drilling
  const { getComponentProps: ctxGetCP, visibility: ctxVisibility } =
    usePrimitiveRuntime();
  const getComponentProps = propGetComponentProps ?? ctxGetCP;
  const visibility = propVisibility ?? ctxVisibility;

  const manifest = useMemo(
    () => manifestRegistry.getField(field.type),
    [field.type]
  );
  const category = manifest?.category;
  const routing = manifest?.routing ?? "leaf";

  // Fallback for composite types not registered in ManifestRegistry (e.g., "address-group")
  const isExpandedComposite = field.isExpandedComposite === true;
  const isContainer =
    category === "container" || category === "composite" || isExpandedComposite;
  const isRepeater = routing === "repeater";
  const fieldMotion = field.meta?.ui?.motion;
  const motionEnabled =
    typeof fieldMotion === "boolean" ? fieldMotion : fieldMotion?.enabled;
  const shouldAnimate =
    globalMotion?.disabled !== true &&
    (motionEnabled ?? theme.motion) &&
    !isRepeater;

  if (visibility && visibility[field.id] === false) {
    return null;
  }

  // Direct Slot Resolution
  const isSlot = routing === "slot" || field.type === "slot";
  const SlotComponent = isSlot
    ? (field.meta?.ui?.component ||
        orchestrator?.slots?.[field.name] ||
        orchestrator?.slots?.[field.id])
    : null;

  const content = (
    <>
      {isSlot && SlotComponent && (
        React.isValidElement(SlotComponent) ? (
          SlotComponent
        ) : (
          React.createElement(SlotComponent as React.ComponentType<any>, {
            field,
            value: getComponentProps(field.id)?.value,
            data: orchestrator?.data,
            onChange: getComponentProps(field.id)?.onChange,
            ...getComponentProps(field.id),
          })
        )
      )}

      {isContainer && !isSlot &&
        renderStructure({
          field,
          getComponentProps,
          visibility,
          spacing,
          parentLayout,
        })}

      {isRepeater && (
        <RepeaterField
          field={field}
          getComponentProps={getComponentProps}
          visibility={visibility}
          styles={{}}
        />
      )}

      {!isContainer && !isRepeater && !isSlot && (
        <FieldRenderer field={field} {...getComponentProps(field.id)} />
      )}
    </>
  );

  const wrapperClassName = cn(
    "form-field-ensemble origin-top transition-shadow",
    parentLayout?.type === "flex" || parentLayout?.type === "group"
      ? "flex-1 min-w-0"
      : "w-full",
    gapAuthority
      ? stripVerticalMargins(buildFieldWrapperClasses(field, parentLayout))
      : buildFieldWrapperClasses(field, parentLayout)
  );

  if (shouldAnimate) {
    return (
      <m.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4, transition: { duration: 0.15 } }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={wrapperClassName}
        data-field-id={field.id}
        data-field-name={field.name}
        data-testid={`field-router-${field.id}`}
        data-field-type={field.type}
      >
        <FieldDebugWrapper id={field.id} type={field.type} enabled={debug}>
          {content}
        </FieldDebugWrapper>
      </m.div>
    );
  }

  return (
    <div
      className={wrapperClassName}
      data-field-id={field.id}
      data-field-name={field.name}
      data-testid={`field-router-${field.id}`}
      data-field-type={field.type}
    >
      <FieldDebugWrapper id={field.id} type={field.type} enabled={debug}>
        {content}
      </FieldDebugWrapper>
    </div>
  );
});
