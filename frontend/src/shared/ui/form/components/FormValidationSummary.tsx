import React from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";

interface FormValidationSummaryProps {
  valid: boolean;
  touched: boolean;
}

export const FormValidationSummary: React.FC<FormValidationSummaryProps> = ({
  valid,
  touched,
}) => {
  const { t } = useTranslation();

  if (valid || !touched) return null;

  return (
    <div
      className="mb-6 animate-in slide-in-from-top-4 fade-in duration-300"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="p-4 rounded-xl bg-danger/5 border border-danger/20 flex items-start gap-3 shadow-xs">
        <div className="p-1.5 bg-danger/10 rounded-lg text-danger shrink-0">
          <AlertCircle className="w-5 h-5 text-danger" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-danger mb-1">
            {t("validation.summary_title", { defaultValue: "Please check the form" })}
          </h4>
          <p className="text-xs text-danger/80 leading-relaxed">
            {t("validation.summary_description", { defaultValue: "One or more required fields contain invalid or missing information." })}
          </p>
        </div>
      </div>
    </div>
  );
};
