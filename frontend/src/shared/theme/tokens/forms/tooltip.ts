/**
 * Zenith Modular Form Tokens: Tooltip & Contextual Help
 *
 * Provides styling definitions for form field tooltips, help triggers, and popover arrows.
 */

export const tooltipTokens = {
  container:
    "z-[var(--z-tooltip)] rounded-lg border border-form-tooltip-border bg-form-tooltip-bg backdrop-blur-xl text-foreground shadow-xl p-2.5 text-xs font-medium leading-relaxed transition-all",
  arrow:
    "border-4 border-transparent border-t-form-tooltip-arrow",
  arrowBorder:
    "border-4 border-transparent border-t-form-tooltip-border",
  trigger:
    "inline-flex items-center justify-center p-0.5 rounded-full text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 cursor-help",
} as const;
