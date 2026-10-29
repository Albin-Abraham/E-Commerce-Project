import React from "react";

import { HelpText } from "@ui/form/atoms/HelpText";
import { useFormOrchestrator } from "@ui/form/context/FormOrchestratorContext";
import { useFormTheme } from "@ui/form/context/FormThemeContext";
import type { FormField } from "@ui/form/fields";
import { cn } from "@ui/form/utils/form-styles";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";

/**
 * FieldLabel: Standardized Label Renderer
 *
 * Responsibility: Renders the <label> tag, handles required indicators (*),
 * and optionally displays tooltips/help text.
 *
 * @param props.field - Field definition containing the label string and required status.
 * @param props.showLabel - Boolean override for conditional rendering.
 * @param props.hideTooltip - Whether to suppress the help tooltip next to the label.
 */
export interface FieldLabelProps {
  field?: Partial<FormField>;
  id?: string;
  name?: string;
  label?: string | TranslatedText;
  required?: boolean;
  type?: string;
  properties?: Record<string, any>;
  meta?: Record<string, any>;
  styles?: {
    label?: string;
    [key: string]: string | undefined;
  };
  showLabel?: boolean;
  hideTooltip?: boolean;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({
  field,
  id,
  name,
  label,
  required,
  type,
  properties,
  meta,
  styles = {},
  showLabel = true,
  hideTooltip = false,
}) => {
  const theme = useFormTheme();
  const orchestrator = useFormOrchestrator();
  const mode = orchestrator?.mode || "edit";

  const resolvedLabel = label ?? field?.label;
  const resolvedId = id ?? field?.id ?? name ?? (field?.name as string);
  const resolvedRequired = Boolean(required ?? field?.required);
  const resolvedType = type ?? field?.type;

  // Checkbox/Switch heuristic (isolated here until moved to schema)
  const isBooleanToggle = resolvedType === "checkbox" || resolvedType === "switch";
  const labelPlacement =
    properties?.labelPlacement ?? field?.properties?.labelPlacement ?? "top";
  const isLabelHidden = labelPlacement === "hidden";
  const isFloating = labelPlacement === "inline-floating";

  // Logic: Force Show > !Toggle > !Hidden
  const shouldRender =
    showLabel !== undefined ? showLabel : !isBooleanToggle && !isLabelHidden;

  if (!shouldRender || !resolvedLabel) return null;

  const hasCustomRequiredIndicator =
    !!theme.components?.label?.requiredIndicator;
  const requiredClass =
    resolvedRequired && mode !== "view" && hasCustomRequiredIndicator
      ? theme.components?.label?.requiredIndicator || ""
      : "";

  const Component = mode === "view" ? "span" : "label";
  const tooltip = properties?.tooltip ?? field?.properties?.tooltip;
  const labelAction = meta?.ui?.labelAction ?? field?.meta?.ui?.labelAction;

  return (
    <div
      className={cn(
        "flex justify-between items-center w-full",
        isFloating ? "mb-0 min-h-0 leading-none" : "mb-1.5 min-h-[1.5rem]"
      )}
    >
      <Component
        {...(mode === "edit" ? { htmlFor: resolvedId } : {})}
        data-part="label"
        className={cn(
          styles.label,
          "mb-0 transition-colors",
          requiredClass,
          mode === "view" &&
            "text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1"
        )}
      >
        {resolveTranslation(resolvedLabel)}
        {resolvedRequired && mode !== "view" && !hasCustomRequiredIndicator && (
          <>
            <span aria-hidden="true" className="ml-1 text-danger text-sm font-bold">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        )}
        {tooltip && !hideTooltip && (
          <HelpText
            id={`${resolvedId}-tooltip`}
            text={resolveTranslation(tooltip as any)}
          />
        )}
      </Component>


      {labelAction && (
        <a
          href={labelAction.href}
          className="text-[10px] uppercase tracking-wider font-extrabold text-primary hover:text-primary-600 transition-colors duration-200 whitespace-nowrap shrink-0 ml-4 mb-1"
        >
          {resolveTranslation(labelAction.label)}
        </a>
      )}
    </div>
  );
};

