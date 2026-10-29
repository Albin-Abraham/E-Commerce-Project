import React from "react";

import { usePrimitiveRuntime } from "@ui/form/context/FormOrchestratorContext";

import type { LayoutRendererProps } from "./LayoutRendererRegistry";
import { layoutRendererRegistry } from "./LayoutRendererRegistry";

// ── Eager structural components ───────────────────────────────────────────
import { AccordionField } from "@ui/form/fields/structure/AccordionField";
import { FieldsetField } from "@ui/form/fields/structure/FieldsetField";
import { GroupField } from "@ui/form/fields/structure/GroupField";
import {
  CardField,
  ContainerField,
} from "@ui/form/fields/structure/LayoutFields";
import { TabsField } from "@ui/form/fields/structure/TabsField";

// ── Renderers ─────────────────────────────────────────────────────────────

const CardRenderer: React.FC<LayoutRendererProps> = ({
  field,
  children,
  styles,
  className,
}) => (
  <CardField field={field} className={className} styles={styles}>
    {children}
  </CardField>
);

const ContainerRenderer: React.FC<LayoutRendererProps> = ({
  field,
  children,
  styles,
}) => (
  <ContainerField
    field={field}
    className={(field.properties as any)?.className}
    styles={styles}
  >
    {children}
  </ContainerField>
);

const TabsRenderer: React.FC<LayoutRendererProps> = ({
  field,
  children: _children,
  styles,
  context,
}) => {
  const SectionContent = context?.renderSectionContent as
    | React.ComponentType<any>
    | undefined;
  const renderChildField = context?.renderChildField;
  // Phase 1: read from context, not from the prop-drilled `context` object
  const { getComponentProps, visibility } = usePrimitiveRuntime();
  const { spacing } = context || {};

  return (
    <TabsField field={field} styles={styles || {}}>
      {SectionContent && renderChildField
        ? (field.fields || []).map((childField) => (
            <SectionContent
              key={childField.id}
              layoutConfig={
                childField.layout || { type: "grid" as const, columns: 12 }
              }
              headless={false}
            >
              {(childField.fields || []).map((f) =>
                renderChildField({
                  key: f.id,
                  field: f,
                  getComponentProps,
                  visibility,
                  spacing,
                  parentLayout: childField.layout as any,
                })
              )}
            </SectionContent>
          ))
        : null}
    </TabsField>
  );
};

const AccordionRenderer: React.FC<LayoutRendererProps> = ({
  field,
  children,
  styles,
}) => (
  <AccordionField field={field} styles={styles || {}}>
    {children}
  </AccordionField>
);

const FieldsetRenderer: React.FC<LayoutRendererProps> = ({
  field,
  children,
  styles,
}) => (
  <FieldsetField field={field} styles={styles || {}}>
    {children}
  </FieldsetField>
);

const GroupRenderer: React.FC<LayoutRendererProps> = ({
  field,
  children,
  styles,
}) => (
  <GroupField field={field} styles={styles || {}}>
    {children}
  </GroupField>
);

/**
 * Default section renderer — a semantic `<div>` grouping with header.
 * Used when no specialized renderer is registered for "section".
 */
const SectionRenderer: React.FC<LayoutRendererProps> = ({
  field,
  children,
  className,
}) => {
  const base =
    className || "form-section z-layout-boundary transition-all duration-300";
  const header = "pl-6 mb-6 border-l-4 border-primary/20";
  const titleClass =
    "form-section__title z-heading-2 text-[length:var(--text-lg)] font-bold text-foreground tracking-tight";
  const descClass =
    "form-section__description z-body !text-[var(--text-sm)] opacity-50";

  return (
    <div className={base}>
      {(field.label || field.customData?.description) && (
        <div className={header}>
          {field.label && (
            <h2 className={titleClass}>{field.label as string}</h2>
          )}
          {field.customData?.description && (
            <p className={descClass}>
              {field.customData.description as string}
            </p>
          )}
        </div>
      )}
      <div className="form-section__content">{children}</div>
    </div>
  );
};

// ── Register all default renderers ────────────────────────────────────────
layoutRendererRegistry.registerMany({
  card: CardRenderer,
  container: ContainerRenderer,
  tabs: TabsRenderer,
  accordion: AccordionRenderer,
  fieldset: FieldsetRenderer,
  group: GroupRenderer,
  section: SectionRenderer,
});
