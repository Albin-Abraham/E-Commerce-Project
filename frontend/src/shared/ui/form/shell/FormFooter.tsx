import React from "react";
import { useTranslation } from "react-i18next";

import { tokens } from "@shared/theme";
import { cn } from "@ui/form/utils/form-styles";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import { Loader2 } from "lucide-react";

import { useFormActionManager } from "../context/ActionContext";
import { useFormOrchestrator } from "../context/FormOrchestratorContext";
import { useLayout } from "../context/LayoutContext";
import type { FormDefinition } from "../types";

export interface FormFooterProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "className"
> {
  definition: FormDefinition;
  form: any; // The Form engine instance
  sticky?: boolean;
  isSubmitting?: boolean;
  actionClasses?: string;
  submitBtnClass?: string;
  cancelBtnClass?: string;
  className?: string;
  secondaryActions?: React.ReactNode;
  slots?: Record<string, string>;
  /** Called when the last wizard step submit button is clicked */
  onExecuteSubmit?: () => Promise<boolean>;
}

export const FormFooter: React.FC<FormFooterProps> = ({
  definition,
  form,
  isSubmitting = false,
  actionClasses = "",
  submitBtnClass = "",
  cancelBtnClass = "",
  className,
  secondaryActions,
  slots = {},
  onExecuteSubmit,
  ...props
}) => {
  const { t } = useTranslation(["common/base", "features/forms"]);
  const { submitLabel, cancelLabel } = definition;
  const { isWizard, currentStepId, history, navigation } = useLayout();
  const { executeAction } = useFormActionManager();
  const orchestrator = useFormOrchestrator();
  const mode = orchestrator?.mode || "edit";

  const actionTokens = tokens.form.shell.actions;
  const resolvedSubmitClass = submitBtnClass || actionTokens.submit;
  const resolvedCancelClass = cancelBtnClass || actionTokens.cancel;
  const resolvedActionClasses = actionClasses || actionTokens.container;

  const isFirstStep = history.length === 0;
  const nextStepId = isWizard && form.flow ? form.flow.getNextStep(currentStepId) : null;
  const isLastStep = isWizard && form.flow ? form.flow.isLastStep(currentStepId) : true;

  if (mode === "view") {
    return (
      <div
        className={cn(slots.footer, className)}
        data-testid="form-footer"
        {...props}
      >
        <div className={resolvedActionClasses}>
          <button
            type="button"
            className={resolvedCancelClass}
            onClick={() => executeAction("cancel")}
          >
            {t("buttons.close")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(slots.footer, className)}
      data-testid="form-footer"
      {...props}
    >
      <div className={resolvedActionClasses}>
        {secondaryActions && (
          <div className="form-actions__secondary flex-grow w-full sm:w-auto">
            {secondaryActions}
          </div>
        )}

        {isWizard && !isFirstStep && (
          <button
            type="button"
            className={resolvedCancelClass}
            onClick={() => navigation.back()}
            disabled={isSubmitting}
          >
            {t("buttons.back")}
          </button>
        )}

        {cancelLabel && !isWizard && (
          <button
            type="button"
            className={resolvedCancelClass}
            disabled={isSubmitting}
            onClick={() => executeAction("cancel")}
          >
            {resolveTranslation(cancelLabel)}
          </button>
        )}

        <button
          type={isWizard && !isLastStep ? "button" : "submit"}
          className={resolvedSubmitClass}
          onClick={async (e) => {
            e.preventDefault();
            if (isWizard && !isLastStep) {
              // ── NEXT STEP: validate current step before advancing ──────
              const isLinear = definition.settings?.wizard?.linear !== false;
              if (isLinear) {
                const sectionsRecord: Record<string, any> =
                  form.definition.sections || {};
                const currentSection = sectionsRecord[currentStepId];
                const sectionFieldIds: string[] =
                  currentSection?.fieldIds || [];
                sectionFieldIds.forEach((id: string) => form.setTouched(id));
                const isValid = await form.validateFields(sectionFieldIds);
                if (!isValid) return;
              }
              navigation.next(nextStepId!);
            } else {
              // ── LAST STEP SUBMIT ──────────────────────────────────────
              if (!onExecuteSubmit) return;
              const isValid = await onExecuteSubmit();

              // On wizard validation failure: jump to the first step with errors
              if (!isValid && isWizard) {
                const sectionsRecord: Record<string, any> =
                  form.definition.sections || {};
                const rootSections: string[] =
                  form.definition.rootSections || [];
                const errorFieldIds = new Set(
                  Object.entries(
                    form.validity as Record<string, { valid: boolean }>
                  )
                    .filter(([, v]) => !v.valid)
                    .map(([id]) => id)
                );

                // Find the first section that has an invalid field
                const firstErrorStep = rootSections.find((sectionId) => {
                  const section = sectionsRecord[sectionId];
                  const fieldIds: string[] = section?.fieldIds || [];
                  return fieldIds.some((fid) => errorFieldIds.has(fid));
                });

                if (firstErrorStep && firstErrorStep !== currentStepId) {
                  navigation.jump(firstErrorStep);
                }
              }
            }
          }}
          disabled={isSubmitting}
          data-part={isWizard && !isLastStep ? "next-btn" : "submit-btn"}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{t("feedback.submitting", { defaultValue: "Submitting..." })}</span>
            </span>
          ) : isWizard && !isLastStep ? (
            t("buttons.next", { defaultValue: "Next" })
          ) : (
            resolveTranslation(submitLabel || "buttons.submit")
          )}
        </button>
      </div>
    </div>
  );
};
