/**
 * Zenith Modular Form Tokens: Popover & Dropdowns
 *
 * Provides styling definitions for select, autocomplete, and dropdown option lists.
 */

export const popoverTokens = {
  container:
    "z-50 w-full rounded-xl border border-form-popover-border bg-form-popover-bg backdrop-blur-2xl p-1.5 shadow-xl transition-all",
  option:
    "px-3 py-2 rounded-lg text-sm text-foreground hover:bg-subtle transition-colors cursor-pointer flex items-center justify-between",
  optionSelected:
    "bg-form-popover-option-selected text-primary font-semibold",
  optionActive: "bg-subtle text-foreground",
} as const;
