import React from "react";

import { classNames } from "@ui/form/utils/field-utils";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import { buildBoxModelClasses } from "@ui/form/utils/layout-generator";

import { useFormTheme } from "../context/FormThemeContext";
import { useLayout } from "../context/LayoutContext";
import type { FormDefinition } from "../types";

interface FormStepperProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "className" | "type"
> {
  definition: FormDefinition;
  type?: "sidebar" | "top" | "none";
  visibility?: Record<string, boolean>;
  className?: string;
  linear?: boolean;
}

/**
 * FormStepper: The Navigation Chassis for Multi-Step Orchestration.
 *
 * Supports Sidebar (operational) and Top-bar (consumer) variants.
 * Synchronized with LayoutContext for real-time step visualization.
 */
export const FormStepper: React.FC<FormStepperProps> = ({
  definition,
  type = "sidebar",
  visibility,
  className,
  linear,
  ...props
}) => {
  const { currentStepId, history, navigation, isWizard } = useLayout();
  const theme = useFormTheme();
  const rawSections = definition.sections || [];
  const sections = rawSections.filter(
    (section) => !section.id || !visibility || visibility[section.id] !== false
  );

  if (!isWizard || type === "none") return null;

  const isSidebar = type === "sidebar";

  // Resolve themed box model for the stepper
  const shellStyles = theme.components?.shell?.stepper || {};
  const isLinear = linear ?? (definition.settings?.wizard?.linear !== false);

  return (
    <nav
      className={classNames(
        "form-stepper transition-all duration-500",
        buildBoxModelClasses(shellStyles),
        isSidebar
          ? "w-full space-y-4"
          : "flex items-center justify-between w-full",
        className
      )}
      aria-label="Form Steps"
      data-part={isSidebar ? "stepper-sidebar" : "stepper-top"}
      {...props}
    >
      {sections.map((section, idx) => {
        const isActive = currentStepId === section.id;
        const isCompleted = history.includes(section.id || "");
        const isVisited = isActive || isCompleted;

        // If linear, block jumping ahead to unvisited steps
        const isClickable = !isActive && (!isLinear || isVisited);

        return (
          <div
            key={section.id}
            data-part="stepper-item"
            data-active={isActive}
            className={classNames(
              "step-item flex transition-all duration-300 relative",
              isSidebar
                ? "items-start gap-4 pb-8 last:pb-0"
                : "flex-1 flex-col items-center text-center",
              isVisited ? "opacity-100" : "opacity-40 grayscale-[0.4]"
            )}
          >
            {/* Connecting Track (Sidebar) */}
            {isSidebar && idx < sections.length - 1 && (
              <div className="absolute left-[15px] top-10 bottom-0 w-[2px] bg-border/40">
                <div
                  className="h-full bg-primary transition-all duration-700 origin-top"
                  style={{ transform: `scaleY(${isCompleted ? 1 : 0})` }}
                />
              </div>
            )}

            {/* Step Number / Icon */}
            <button
              type="button"
              aria-label={`Step ${idx + 1}: ${resolveTranslation(section.title)}${isCompleted ? " (completed)" : ""}`}
              disabled={!isClickable && !isActive}
              onClick={(e) => {
                e.preventDefault();
                if (isClickable) {
                  navigation.jump(section.id || "");
                }
              }}
              className={classNames(
                "flex items-center justify-center rounded-full font-black z-[var(--z-accent)] transition-all duration-500",
                isSidebar
                  ? "w-8 h-8 text-xs shrink-0"
                  : "w-10 h-10 text-sm mb-3",
                isActive
                  ? "bg-primary text-white scale-110 shadow-glow ring-4 ring-primary/10"
                  : isCompleted
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-surface-elevated text-foreground/20 border border-border",
                !isClickable && !isActive ? "cursor-not-allowed" : "cursor-pointer"
              )}
            >
              {isCompleted ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                idx + 1
              )}
            </button>

            {/* Labels */}
            <div
              onClick={() => {
                if (isClickable) {
                  navigation.jump(section.id || "");
                }
              }}
              className={classNames(
                "flex flex-col transition-all duration-300",
                isSidebar ? "pt-1.5" : "mt-2",
                isClickable ? "cursor-pointer" : "cursor-default"
              )}
            >
              <span
                data-part="stepper-label"
                className={classNames(
                  "font-black tracking-tight leading-none transition-colors duration-300",
                  isSidebar
                    ? "text-sm mb-1.5"
                    : "text-[10px] uppercase tracking-widest mb-1",
                  isActive ? "text-foreground" : "text-foreground/40"
                )}
              >
                {resolveTranslation(section.title)}
              </span>
              {isSidebar && section.description && (
                <span
                  data-part="stepper-description"
                  className="text-[11px] text-foreground/40 leading-snug max-w-[180px]"
                >
                  {resolveTranslation(section.description)}
                </span>
              )}
            </div>

            {/* Connecting Line (for Top variant) */}
            {!isSidebar && idx < sections.length - 1 && (
              <div className="absolute top-5 left-[calc(50%+25px)] right-[calc(-50%+25px)] h-[2px] bg-border/40 -z-0">
                <div
                  className="h-full bg-primary transition-all duration-700 origin-left"
                  style={{ width: isCompleted ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
