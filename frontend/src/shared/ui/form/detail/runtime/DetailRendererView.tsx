import React, { useMemo } from "react";

import type { Form } from "@form-core/form";
import { FormComposer } from "@ui/form/FormComposer";
import { FormRegistryProvider } from "@ui/form/context/FormRegistryContext";
import { FormRuntimeProvider } from "@ui/form/context/FormRuntimeProvider";
import { FormThemeProvider } from "@ui/form/context/FormThemeContext";
import { defaultRegistry } from "@ui/form/fields/lazy-registry-builder";
import { DEFAULT_FORM_THEME } from "@ui/form/styles/FormTheme";
import type { DetailDefinition } from "@ui/form/types";
import { cn } from "@ui/form/utils/form-styles";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";

import { DetailBottomActions } from "../components/DetailBottomActions";
import { DetailHeader } from "../components/DetailHeader";
import type { DetailRendererInternalProps } from "../types";
import { DetailFieldList } from "./DetailFieldList";

const EMPTY_DATA: Record<string, any> = {};

export function DetailRendererView<
  T extends Record<string, any> = Record<string, any>,
>({
  definition,
  data = EMPTY_DATA as T,
  mode = "display",
  layoutStyle = "cards",
  density = "comfortable",
  slots = {},
  onChange,
  className = "",
  adapter,
  nodes,
  runtime,
  fallback,
  suspense,
  virtualized,
  maxDisplayRows,
}: DetailRendererInternalProps<T>) {
  const defMeta = definition as
    | (Partial<DetailDefinition> & {
        description?: DetailDefinition["title"];
      })
    | undefined;

  // Active theme resolution
  const activeTheme = useMemo(() => {
    const settings = defMeta?.settings || {};
    return {
      ...DEFAULT_FORM_THEME,
      density: (settings.density || density) as any,
      radius: "large" as const,
    };
  }, [defMeta, density]);

  // Component props factory: engine-backed in interactive mode, data-backed
  // read-only projection in display mode (slots/field-level onChange).
  const getComponentProps = useMemo(() => {
    if (mode === "interactive" && runtime?.engineGetComponentProps) {
      return runtime.engineGetComponentProps;
    }
    return (fieldId: string) => {
      const fieldNode = nodes.find(
        (n) => n.id === fieldId || n.name === fieldId
      );
      const val = fieldNode?.name
        ? data[fieldNode.name]
        : (data as any)[fieldId];

      return {
        value: val,
        data,
        onChange: (newVal: any) => {
          if (onChange && fieldNode) {
            onChange(fieldNode.name || fieldNode.id, newVal);
          }
        },
      };
    };
  }, [mode, runtime?.engineGetComponentProps, nodes, data, onChange]);

  // Registry context value (form is null only when no engine is mounted)
  const registryContextValue = useMemo(
    () => ({
      registry: defaultRegistry,
      debug: false,
      form: (runtime?.form ?? null) as unknown as Form<any>,
      i18nNamespace: "features/forms",
    }),
    [runtime?.form]
  );

  // Orchestrator context value with slots, data, and engine visibility
  const orchestratorValue = useMemo(
    () => ({
      mode: mode === "interactive" ? ("edit" as const) : ("view" as const),
      registry: registryContextValue,
      getComponentProps,
      visibility: runtime?.visibility ?? {},
      slots,
      data,
    }),
    [
      mode,
      registryContextValue,
      getComponentProps,
      runtime?.visibility,
      slots,
      data,
    ]
  );

  // Resolve Structural Slots
  const HeaderSlotContent = useMemo(() => {
    if (slots.headerSlot) {
      if (React.isValidElement(slots.headerSlot)) return slots.headerSlot;
      const HeaderComp = slots.headerSlot as React.ComponentType<{ data?: T }>;
      return <HeaderComp data={data} />;
    }

    // Auto-generate header from definition metadata if provided
    const title = defMeta?.title;
    const subtitle = defMeta?.subtitle ?? defMeta?.description;
    const badgeIcon = defMeta?.badgeIcon;

    if (title) {
      return (
        <DetailHeader
          title={typeof title === "string" ? title : resolveTranslation(title)}
          subtitle={
            subtitle
              ? typeof subtitle === "string"
                ? subtitle
                : resolveTranslation(subtitle)
              : undefined
          }
          badgeIcon={badgeIcon}
        />
      );
    }
    return null;
  }, [slots.headerSlot, defMeta, data]);

  const MediaSlotContent = useMemo(() => {
    if (!slots.mediaSlot) return null;
    if (React.isValidElement(slots.mediaSlot)) return slots.mediaSlot;
    const MediaComp = slots.mediaSlot as React.ComponentType<{ data?: T }>;
    return <MediaComp data={data} />;
  }, [slots.mediaSlot, data]);

  const ActionSlotContent = useMemo(() => {
    if (!slots.actionSlot) return null;
    if (React.isValidElement(slots.actionSlot)) {
      return (
        <DetailBottomActions>{slots.actionSlot}</DetailBottomActions>
      );
    }
    const ActionComp = slots.actionSlot as React.ComponentType<{ data?: T }>;
    return (
      <DetailBottomActions>
        <ActionComp data={data} />
      </DetailBottomActions>
    );
  }, [slots.actionSlot, data]);

  const FooterSlotContent = useMemo(() => {
    if (!slots.footerSlot) return null;
    if (React.isValidElement(slots.footerSlot)) return slots.footerSlot;
    const FooterComp = slots.footerSlot as React.ComponentType<{ data?: T }>;
    return <FooterComp data={data} />;
  }, [slots.footerSlot, data]);

  // Field Content Renderer by Mode
  const renderFieldContent = () => {
    if (mode === "interactive") {
      // Interactive Mode: renders live primitive controls with onChange without <form>
      return <FormComposer fields={nodes} />;
    }

    // Display Mode: clean field list with layout styling
    return (
      <DetailFieldList
        nodes={nodes}
        data={data}
        layoutStyle={layoutStyle}
        slots={slots}
        visibility={runtime?.visibility}
        getComponentProps={getComponentProps}
        defTitle={defMeta?.title}
        fallback={fallback}
        suspense={suspense}
        virtualized={virtualized}
        maxDisplayRows={maxDisplayRows}
      />
    );
  };

  const articleContent = (
    <article
      data-detail-renderer="true"
      className={cn(
        "detail-renderer-root w-full flex flex-col gap-6 max-w-4xl mx-auto text-foreground",
        className
      )}
    >
      {/* 1. Header Slot */}
      {HeaderSlotContent}

      {/* 2. Media / Hero Slot */}
      {MediaSlotContent}

      {/* 3. Main Details Field Content */}
      {renderFieldContent()}

      {/* 4. Action Bar Slot */}
      {ActionSlotContent}

      {/* 5. Footer Slot */}
      {FooterSlotContent}
    </article>
  );

  // When form engine is active (interactive mode or conditional rules),
  // wrap with the full FormRuntimeProvider composition root.
  if (runtime?.form) {
    return (
      <FormThemeProvider theme={activeTheme} adapter={adapter}>
        <FormRuntimeProvider
          orchestrator={orchestratorValue}
          surface={{
            layoutMode: "inline",
            isWizard: false,
            initialStepId: "",
          }}
          remoteOptions={runtime?.remoteOptions ?? null}
        >
          <FormRegistryProvider value={registryContextValue}>
            {articleContent}
          </FormRegistryProvider>
        </FormRuntimeProvider>
      </FormThemeProvider>
    );
  }

  // Pure Display Mode: Free of FormRuntimeProvider's 10 nested form contexts.
  return (
    <FormThemeProvider theme={activeTheme} adapter={adapter}>
      <FormRegistryProvider value={registryContextValue}>
        {articleContent}
      </FormRegistryProvider>
    </FormThemeProvider>
  );
}
