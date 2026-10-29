import React, { useEffect } from "react";
import {
  UNSAFE_DataRouterContext,
  useBlocker,
  useInRouterContext,
} from "react-router-dom";

import { useOptionalAlertDialog } from "@shared/ui/AlertDialog";
import { toastInfo } from "@shared/ui/Toast";
import type { NavigationGuardConfig } from "@ui/form/types";
import type { TranslatedText } from "@ui/form/types/i18n-accessibility";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";

/**
 * @file FormNavigationGuard.tsx
 *
 * Extracted from `Form.tsx` so both `Form` and `FormFlow` share the same
 * unsaved-changes navigation blocker.
 */

export interface FormNavigationGuardProps {
  guardConfig?: boolean | NavigationGuardConfig;
  formTitle?: string | TranslatedText;
  i18nNamespace?: string;
  isDirty: boolean;
  isSubmitting: boolean;
}

const FormNavigationGuardInternal: React.FC<FormNavigationGuardProps> = ({
  guardConfig,
  formTitle,
  i18nNamespace = "features/forms",
  isDirty,
  isSubmitting,
}) => {
  const alertDialog = useOptionalAlertDialog();
  const isPromptingRef = React.useRef(false);

  const isObjectConfig =
    typeof guardConfig === "object" && guardConfig !== null;
  const isEnabled =
    typeof guardConfig === "boolean"
      ? guardConfig
      : Boolean(guardConfig?.enabled ?? true);

  // Navigation is guarded only when enabled, the form has unsaved edits, and is not currently submitting
  const shouldBlock = Boolean(isEnabled && isDirty && !isSubmitting);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      Boolean(
        shouldBlock &&
          currentLocation.pathname !== nextLocation.pathname
      )
  );

  useEffect(() => {
    if (blocker.state === "blocked" && !isPromptingRef.current) {
      isPromptingRef.current = true;

      const handleConfirm = async () => {
        try {
          const cfg = (isObjectConfig ? guardConfig : {}) as NavigationGuardConfig;
          const fallbackDomainName =
            resolveTranslation(formTitle, i18nNamespace) || "Form";
          const domainName = cfg.domainName
            ? resolveTranslation(cfg.domainName, i18nNamespace)
            : fallbackDomainName;

          const interpolationParams = {
            domain_name: domainName,
            form_name: domainName,
            ...cfg.params,
          };

          const titleText = resolveTranslation(
            cfg.title || "features/forms:navigationGuard.title",
            i18nNamespace,
            interpolationParams
          );

          const messageText = resolveTranslation(
            cfg.message || "features/forms:navigationGuard.message",
            i18nNamespace,
            interpolationParams
          );

          const confirmText = resolveTranslation(
            cfg.confirmLabel ||
              cfg.confirm ||
              "features/forms:navigationGuard.confirm",
            i18nNamespace,
            interpolationParams
          );

          const cancelText = resolveTranslation(
            cfg.cancelLabel || cfg.cancel || "features/forms:navigationGuard.cancel",
            i18nNamespace,
            interpolationParams
          );

          const toastTitleText = resolveTranslation(
            cfg.toastTitle || "features/forms:navigationGuard.toastTitle",
            i18nNamespace,
            interpolationParams
          );

          const toastDescText = resolveTranslation(
            cfg.toastDescription ||
              "features/forms:navigationGuard.toastDescription",
            i18nNamespace,
            interpolationParams
          );

          if (alertDialog) {
            const proceed = await alertDialog.confirm({
              title: titleText,
              message: messageText,
              confirmLabel: confirmText,
              cancelLabel: cancelText,
              intent: "warning",
            });
            if (proceed) {
              toastInfo(toastTitleText, toastDescText);
              blocker.proceed();
            } else {
              blocker.reset();
            }
          } else if (
            typeof window !== "undefined" &&
            typeof window.confirm === "function"
          ) {
            const proceed = window.confirm(`${titleText}\n\n${messageText}`);
            if (proceed) {
              toastInfo(toastTitleText, toastDescText);
              blocker.proceed();
            } else {
              blocker.reset();
            }
          } else {
            blocker.proceed();
          }
        } finally {
          isPromptingRef.current = false;
        }
      };

      handleConfirm();
    }
  }, [
    blocker,
    alertDialog,
    guardConfig,
    isObjectConfig,
    formTitle,
    i18nNamespace,
  ]);

  return null;
};

export const FormNavigationGuard: React.FC<FormNavigationGuardProps> = (
  props
) => {
  const inRouter = useInRouterContext();
  const dataRouter = React.useContext(UNSAFE_DataRouterContext);
  const isEnabled =
    typeof props.guardConfig === "boolean"
      ? props.guardConfig
      : Boolean(props.guardConfig && (props.guardConfig.enabled ?? true));

  if (!inRouter || !dataRouter || !isEnabled) return null;
  return <FormNavigationGuardInternal {...props} />;
};