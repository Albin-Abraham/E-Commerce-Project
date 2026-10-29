import React, { useEffect } from "react";

import "../manifest/default-manifests";
import { ActionProvider } from "@ui/form/context/ActionContext";
import { BindingProvider } from "@ui/form/context/BindingContext";
import { ControlProvider } from "@ui/form/context/ControlContext";
import { DataSourceProvider } from "@ui/form/context/DataSourceContext";
import { ExpressionProvider } from "@ui/form/context/ExpressionContext";
import { FormOrchestratorProvider } from "@ui/form/context/FormOrchestratorContext";
import type { FormOrchestratorValue } from "@ui/form/context/FormOrchestratorContext";
import {
  type LayoutMode,
  LayoutProvider,
} from "@ui/form/context/LayoutContext";
import { LayoutManagerProvider } from "@ui/form/context/LayoutManagerContext";
import {
  type PermissionMap,
  PermissionProvider,
  usePermissionManager,
} from "@ui/form/context/PermissionContext";
import { ServiceProvider } from "@ui/form/context/ServiceContext";

/**
 * @file FormRuntimeProvider.tsx
 * @description The single composition root for all form runtime managers.
 *
 * ## The Provider Hell Problem
 * Without this, `Form.tsx` had to nest 6 providers manually:
 * ```tsx
 * <FormOrchestratorProvider>
 *   <LayoutProvider>
 *     <LayoutManagerProvider>
 *       <ControlProvider>
 *         <PermissionProvider>
 *           {children}
 * ```
 *
 * ## The Solution
 * `FormRuntimeProvider` is the single external API. The providers remain
 * separate, modular, and independently testable internally — but the
 * consumer only sees ONE provider:
 *
 * ```tsx
 * <FormRuntimeProvider orchestrator={...} surface={...} form={form}>
 *   {children}
 * </FormRuntimeProvider>
 * ```
 *
 * ## Analogy
 * This mirrors how `<MaterialApp>` (Flutter), `<ApolloProvider>`,
 * and `<QueryClientProvider>` all compose many internal providers
 * while presenting a single clean API to their consumers.
 *
 * The domain boundaries are preserved — each manager is still a separate
 * context with its own hook. Only the *provider nesting* is centralized here.
 */

export interface FormRuntimeConfig {
  /**
   * Pre-built `FormOrchestratorValue` from the parent Form or FormRenderer.
   * Contains: theme, registry, getComponentProps, visibility, routing, manifest.
   */
  orchestrator: FormOrchestratorValue;

  /**
   * Application shell / surface configuration.
   */
  surface: {
    layoutMode?: LayoutMode;
    isWizard?: boolean;
    initialStepId?: string;
  };

  /**
   * The `form.remoteOptions` from FormCore — bridges RemoteOptionsManager
   * into the DataSourceContext. Or can be implemented via React Query in state.
   */
  remoteOptions?: {
    executeSearch: (fieldId: string, query: string) => void;
    refresh?: (fieldId: string) => void;
    getOptions?: (
      fieldId: string
    ) => ReadonlyArray<{ label: string; value: unknown }>;
    isLoading?: (fieldId: string) => boolean;
  } | null;

  /**
   * Field-level permission map: { [fieldId]: "edit" | "view" | "hidden" }.
   * Forwarded to PermissionProvider.
   * @example { salary_field: "view", delete_btn: "hidden" }
   */
  permissions?: PermissionMap;

  /**
   * Optional form engine. When provided, permission-hidden field ids are
   * synced into the engine so `getPayload()` and validation honor `"hidden"`.
   */
  form?: {
    definition: { fields: Record<string, unknown> };
    setHiddenFields: (ids: string[]) => void;
  } | null;

  /**
   * External services configuration for dependency injection.
   */
  services?: Record<string, any>;

  /**
   * Action handlers map to fulfill string-based intents from the schema.
   * Forwarded to ActionProvider.
   * @example { "dispatch:SAVE_DRAFT": api.saveDraft }
   */
  actions?: Record<string, (payload?: any) => Promise<any>>;

  children: React.ReactNode;
}

/**
 * `FormRuntimeProvider` — single composition root for all form runtime services.
 *
 * Internally composes (in order):
 * 1. `FormOrchestratorProvider` — Global runtime: theme, registry, getComponentProps, visibility
 * 2. `LayoutProvider`           — Surface runtime: layoutMode, wizard navigation
 * 3. `LayoutManagerProvider`    — Layout runtime:  Tabs/Accordion imperative control
 * 4. `ControlProvider`          — Primitive control: focus, blur, scrollIntoView
 * 5. `PermissionProvider`       — Primitive access:  edit / view / hidden per field
 * 6. `DataSourceProvider`       — Primitive data:    remote options search/refresh
 * 7. `ActionProvider`           — Primitive execution: trigger actions
 * 8. `ServiceProvider`          — Primitive DI:      external service injection
 * 9. `ExpressionProvider`       — Primitive rules:   dynamic expression evaluation
 * 10. `BindingProvider`         — Primitive binding: value binding abstraction
 *
 * Each layer corresponds to the hierarchical runtime:
 * ```
 * Global Runtime (orchestrator)
 *     ↓
 * Surface Runtime (layout + wizard)
 *     ↓
 * Layout Runtime (tabs/accordion)
 *     ↓
 * Primitive Runtime (control + permissions + datasource)
 *     ↓
 * Field Drivers → HeroUI
 * ```
 *
 * @example
 * ```tsx
 * // In Form.tsx — replaces 6 nested providers with one:
 * <FormRuntimeProvider
 *   orchestrator={orchestratorValue}
 *   surface={{ layoutMode: "dashboard", isWizard: false, initialStepId: "step-1" }}
 *   remoteOptions={form.remoteOptions}
 *   permissions={{ salary_field: "view", delete_btn: "hidden" }}
 * >
 *   {formContent}
 * </FormRuntimeProvider>
 * ```
 */
/**
 * Syncs permission-hidden field ids into the form engine so `getPayload()`
 * strips them and validation skips them. Mounted inside PermissionProvider;
 * re-runs whenever the permission map changes (mount, prop, or manager update).
 */
function PermissionEngineSync({
  form,
}: {
  form: NonNullable<FormRuntimeConfig["form"]>;
}) {
  const { getPermission } = usePermissionManager();

  useEffect(() => {
    const hiddenIds = Object.keys(form.definition.fields).filter(
      (id) => getPermission(id) === "hidden"
    );
    form.setHiddenFields(hiddenIds);
  }, [form, getPermission]);

  return null;
}

export const FormRuntimeProvider: React.FC<FormRuntimeConfig> = ({
  orchestrator,
  surface,
  remoteOptions,
  permissions,
  form,
  services,
  actions,
  children,
}) => {
  return (
    <FormOrchestratorProvider value={orchestrator}>
      <LayoutProvider
        initialMode={surface.layoutMode}
        isWizard={surface.isWizard}
        initialStepId={surface.initialStepId}
      >
        <LayoutManagerProvider>
          <ControlProvider>
            <PermissionProvider permissions={permissions}>
              {form ? <PermissionEngineSync form={form} /> : null}
              <DataSourceProvider remoteOptions={remoteOptions}>
                <ActionProvider actions={actions}>
                  <ServiceProvider services={services}>
                    <ExpressionProvider>
                      <BindingProvider>{children}</BindingProvider>
                    </ExpressionProvider>
                  </ServiceProvider>
                </ActionProvider>
              </DataSourceProvider>
            </PermissionProvider>
          </ControlProvider>
        </LayoutManagerProvider>
      </LayoutProvider>
    </FormOrchestratorProvider>
  );
};
