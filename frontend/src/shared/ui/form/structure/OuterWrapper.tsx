import React from "react";

import { useFormOrchestrator } from "@ui/form/context/FormOrchestratorContext";
import { useFormTheme } from "@ui/form/context/FormThemeContext";
import type { FormField } from "@ui/form/fields";
import { FieldSlot } from "@ui/form/slots/FieldSlot";
import { classNames } from "@ui/form/utils/field-utils";
import { cn } from "@ui/form/utils/form-styles";
import { Flex } from "@ui/layout/Flex";

export interface FieldSurfaceProps {
  field?: Partial<FormField>;
  type?: string;
  density?: "compact" | "comfortable" | "spacious";
  children: React.ReactNode;
  className?: string;
  styles?: any;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}

/**
 * Backward-compatible alias for existing codebase usages.
 * @see FieldSurface
 */
export type OuterWrapperProps = FieldSurfaceProps;

/**
 * Context allowing primitive fields to project dedicated sub-elements
 * (e.g. selected tag areas in multipleDisplay="area") to a separate container
 * rendered on the next line below the input surface.
 */
export const BelowSurfaceContext = React.createContext<HTMLDivElement | null>(null);

/**
 * FieldSurface (formerly OuterWrapper): The Unified Interaction Surface.
 *
 * Responsibility: Provides the singular 'Etched' surface, border, and focus-glow
 * for primitive fields, housing prefix/suffix adornments and action slots.
 * By centralizing the surface here, we eliminate the 'Double Surface Problem'
 * and ensure consistent alignment.
 */
export const FieldSurface: React.FC<FieldSurfaceProps> = ({
  field,
  type,
  density,
  children,
  className,
  styles = {},
  startContent,
  endContent,
}) => {
  const [belowSurfaceEl, setBelowSurfaceEl] = React.useState<HTMLDivElement | null>(null);
  const theme = useFormTheme();
  const orchestrator = useFormOrchestrator();
  const mode = orchestrator?.mode || "edit";
  const resolvedType = type ?? field?.type;
  const resolvedDensity =
    density ?? field?.settings?.density ?? theme.density ?? "comfortable";

  const resolvedWrapperStyle =
    mode === "view"
      ? ""
      : styles.inputWrapper ||
        "border border-border/80 dark:border-border-strong bg-surface dark:bg-surface/40 text-foreground rounded-xl px-3.5 py-2.5 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20";

  return (
    <BelowSurfaceContext.Provider value={belowSurfaceEl}>
      <Flex
        direction="col"
        className={cn(
          "form-field-outer form-field-ensemble group relative w-full min-w-0",
          className
        )}
        data-density={resolvedDensity}
      >
        {/* Surface: raw Tailwind — focus-within states and density padding
            cannot be expressed via Flex gap scale. */}
        <div
          className={classNames(
            "form-field-surface flex transition-all duration-500 min-w-0",
            resolvedType === "textarea" ? "items-start pt-2" : "items-center",
            resolvedWrapperStyle
          )}
          data-unit="input-wrapper"
        >
          <FieldSlot
            placement="startContent"
            field={field}
            fallback={startContent}
            className="shrink-0 min-w-fit text-foreground/40 transition-colors group-focus-within:text-primary flex items-center justify-center"
          />

          <div className="flex-grow min-w-0">{children}</div>

          <FieldSlot
            placement="endContent"
            field={field}
            fallback={endContent}
            className="shrink-0 min-w-fit flex items-center justify-center"
          />
        </div>

        {/* Dedicated Below-Surface Container (Next-line div outside input card) */}
        <div
          ref={setBelowSurfaceEl}
          data-unit="below-surface-container"
          className="w-full flex flex-col empty:hidden mt-2"
        />
      </Flex>
    </BelowSurfaceContext.Provider>
  );
};

/**
 * Canonical backward-compatible export.
 */
export const OuterWrapper = FieldSurface;
