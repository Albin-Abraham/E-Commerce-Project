import React from "react";
import { I18nextProvider } from "react-i18next";

import i18n from "@i18n/i18n";
import { FormThemeProvider } from "@ui/form/context/FormThemeContext";
import { FormShellProvider } from "@ui/form/context/FormShellContext";
import { FormRuntimeProvider } from "@ui/form/context/FormRuntimeProvider";
import type { FormRuntime } from "@ui/form/hooks/useFormCore";

import { FormNavigationGuard } from "./FormNavigationGuard";

/**
 * @file FormRuntimeTree.tsx
 *
 * Shared render tree for both form components. The only difference between
 * `Form` (simple) and `FormFlow` (flow) is the shell component and the
 * `isWizard` surface flag:
 *
 * - `Form` → `FormShell` + `isWizard={false}`
 * - `FormFlow` → `FormFlowShell` + `isWizard={true}`
 *
 * Everything else — providers, navigation guard, orchestration — is identical.
 */

export interface FormShellComponentProps {
  children?: React.ReactNode;
  onStepChange?: (stepId: string, stepIndex: number) => void;
}

export interface FormRuntimeTreeProps<
  T extends Record<string, any> = Record<string, any>,
> {
  runtime: FormRuntime<T>;
  Shell: React.ComponentType<FormShellComponentProps>;
  isWizard: boolean;
  children?: React.ReactNode;
}

export function FormRuntimeTree<
  T extends Record<string, any> = Record<string, any>,
>({
  runtime,
  Shell,
  isWizard,
  children,
}: FormRuntimeTreeProps<T>): React.ReactElement {
  const hasOnSubmit = Boolean(runtime.onSubmit);
  const providerActions: Record<string, (payload?: any) => Promise<any>> = {
    ...(runtime.actions || {}),
    ...(hasOnSubmit && !runtime.actions?.submit
      ? { submit: async (payload: any) => runtime.onSubmit!(payload) }
      : {}),
  };

  return (
    <I18nextProvider i18n={i18n}>
      <FormThemeProvider theme={runtime.theme} adapter={runtime.styleAdapter}>
        <FormRuntimeProvider
          orchestrator={runtime.orchestratorValue}
          surface={{
            layoutMode: runtime.layoutMode,
            isWizard,
            initialStepId: runtime.initialStepId,
          }}
          remoteOptions={(runtime.form as any)?.remoteOptions}
          permissions={runtime.permissions}
          form={runtime.form}
          actions={providerActions}
        >
          <FormNavigationGuard
            guardConfig={runtime.guardConfig}
            formTitle={runtime.formTitle}
            i18nNamespace={runtime.i18nNamespace}
            isDirty={runtime.isDirty}
            isSubmitting={runtime.isSubmitting}
          />
          <FormShellProvider {...(runtime.shellContext as any)}>
            <Shell onStepChange={runtime.onStepChange}>{children}</Shell>
          </FormShellProvider>
        </FormRuntimeProvider>
      </FormThemeProvider>
    </I18nextProvider>
  );
};