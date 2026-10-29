import React, { useId } from "react";
import { Info } from "lucide-react";

import { tokens } from "@shared/theme";
import { cn } from "@libs/utils";

export interface FieldTooltipProps {
  text?: string;
  className?: string;
}

export const FieldTooltip: React.FC<FieldTooltipProps> = ({
  text,
  className,
}) => {
  const generatedId = useId();
  if (!text) return null;

  const tooltipTokens = tokens.form.tooltip;

  return (
    <div className={cn("group relative inline-flex items-center cursor-help", className)}>
      <button
        type="button"
        aria-describedby={`tooltip-${generatedId}`}
        aria-label="More information"
        className={tooltipTokens.trigger}
      >
        <Info size={15} aria-hidden="true" />
      </button>

      {/* Accessible Tooltip Container */}
      <div
        id={`tooltip-${generatedId}`}
        role="tooltip"
        className={cn(
          "absolute bottom-full right-0 mb-2 w-52",
          tooltipTokens.container,
          "opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible",
          "pointer-events-none"
        )}
      >
        <span>{text}</span>
        <div
          aria-hidden="true"
          className={cn(
            "absolute top-full right-2.5 -mt-1",
            tooltipTokens.arrow
          )}
        />
      </div>
    </div>
  );
};

FieldTooltip.displayName = "FieldTooltip";
