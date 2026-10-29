import React, { useId, useState } from "react";
import { Info } from "lucide-react";

import { tokens } from "@shared/theme";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import { cn } from "@libs/utils";

export interface HelpTextProps {
  text: string | readonly string[];
  id?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * HelpText: Accessible contextual info icon & tooltip.
 *
 * Implements WAI-ARIA Tooltip design pattern:
 * - Keyboard accessible button trigger with aria-label & aria-describedby
 * - role="tooltip" container with deterministic ID
 * - Revealed on hover or focus-visible
 * - Dismissible on Escape key without losing focus
 */
export const HelpText: React.FC<HelpTextProps> = ({
  text,
  id,
  ariaLabel = "More information",
  className,
}) => {
  const generatedId = useId();
  const tooltipId = id || `tooltip-${generatedId}`;
  const [isOpen, setIsOpen] = useState(false);

  if (!text || (Array.isArray(text) && text.length === 0)) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) {
      e.stopPropagation();
      setIsOpen(false);
    }
  };

  const tooltipTokens = tokens.form.tooltip;

  return (
    <span
      className={cn("relative inline-flex items-center ml-1.5 align-middle", className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        aria-describedby={tooltipId}
        aria-label={ariaLabel}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className={tooltipTokens.trigger}
      >
        <Info size={15} aria-hidden="true" />
      </button>

      {/* Accessible Tooltip Container */}
      <div
        id={tooltipId}
        role="tooltip"
        aria-hidden={!isOpen}
        className={cn(
          "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64",
          tooltipTokens.container,
          "pointer-events-none",
          isOpen
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible translate-y-1"
        )}
      >
        {Array.isArray(text) ? (
          <ul className="list-disc pl-4 space-y-1">
            {text.map((item, index) => (
              <li key={index}>{resolveTranslation(item)}</li>
            ))}
          </ul>
        ) : (
          <span>{resolveTranslation(text)}</span>
        )}
        {/* Arrow */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute top-full left-1/2 transform -translate-x-1/2 -mt-1",
            tooltipTokens.arrow
          )}
        />
      </div>
    </span>
  );
};

HelpText.displayName = "HelpText";
