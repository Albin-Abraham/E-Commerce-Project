import React from "react";

import { useFormOrchestrator } from "@ui/form/context/FormOrchestratorContext";
import { useFormTheme } from "@ui/form/context/FormThemeContext";
import type { DetailedError } from "@form-core/int-types";
import type { FormField } from "@ui/form/fields";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import { AlertCircle } from "lucide-react";

/**
 * FieldFeedback: Error & Help Text Handling
 *
 * Responsibility: Displays validation errors (single or multiple) and field descriptions.
 * Leverages the current theme for consistent typography.
 *
 * @param props.field - Field definition for deriving help text from layout.
 * @param props.error - Quick string error or boolean status.
 * @param props.errorMessage - Specific error string (5V Form Engine standard).
 * @param props.errors - Array of detailed error objects for multi-rule validation reporting.
 */
export interface FieldFeedbackProps {
  field?: Partial<FormField>;
  id?: string;
  name?: string;
  description?: string | TranslatedText;
  helperText?: string | TranslatedText;
  error?: string | boolean;
  errorMessage?: string; // New 5V standard
  errors?: readonly DetailedError[];
  styles?: {
    description?: string;
    errorMessage?: string;
  };
}

export const FieldFeedback: React.FC<FieldFeedbackProps> = ({
  field,
  id,
  name,
  description,
  helperText,
  error,
  errorMessage,
  errors,
  styles = {},
}) => {
  const theme = useFormTheme();
  const orchestrator = useFormOrchestrator();
  const mode = orchestrator?.mode || "edit";

  const resolvedId = id ?? field?.id ?? name ?? (field?.name as string) ?? "field";

  // 1. Helper Text (Resolved from flat props, field description, or explicit UI meta)
  const helperContent = resolveTranslation(
    description || helperText || field?.description || field?.meta?.ui?.helpText
  );

  // 2. Error Content
  const hasMultipleErrors = errors && errors.length > 0;
  const singleError =
    errorMessage || (typeof error === "string" ? error : null);

  // Styling
  const descriptionClass =
    styles.description || theme.components?.helpText?.base;
  const errorBaseClass =
    styles.errorMessage ||
    theme.components?.error?.base ||
    "text-[length:var(--text-xs)] font-medium text-danger mt-1 flex items-center gap-1.5";

  return (
    <>
      {/* Helper Text */}
      {helperContent && (
        <p id={`${resolvedId}-help`} className={descriptionClass}>
          {helperContent}
        </p>
      )}

      {/* Errors (Hidden in View Mode) */}
      {mode === "edit" && (hasMultipleErrors || singleError) && (
        <div
          id={`${resolvedId}-error`}
          className="mt-1 flex flex-col gap-1"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          {hasMultipleErrors && errors!.length > 1 ? (
            <ul className="flex flex-col gap-1 list-none p-0 m-0" role="list">
              {errors!.map((err, idx) => (
                <li key={idx} className={errorBaseClass}>
                  <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
                  <span>{err.message}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={errorBaseClass}>
              <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
              <span>{hasMultipleErrors ? errors![0].message : singleError}</span>
            </div>
          )}
        </div>
      )}

    </>
  );
};

