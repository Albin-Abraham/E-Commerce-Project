/**
 * Zenith Modular Form Tokens: Checkbox Control
 *
 * Provides styling definitions for native checkboxes, custom square indicators,
 * check icons, and card options.
 */

export const checkboxTokens = {
  container:
    "relative inline-flex items-center justify-center h-5 w-5 shrink-0 select-none",
  input:
    "peer h-5 w-5 rounded-md border-2 transition-all duration-200 cursor-pointer appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  unchecked:
    "border-form-checkbox-border bg-form-checkbox-bg group-hover:border-form-checkbox-border-hover",
  checked:
    "checked:bg-form-checkbox-bg-checked checked:border-form-checkbox-border-checked",
  indeterminate:
    "bg-form-checkbox-bg-checked border-form-checkbox-border-checked",
  icon: "absolute inset-0 h-5 w-5 text-form-checkbox-icon pointer-events-none p-1 transition-opacity duration-200",
  iconCheck: "opacity-0 peer-checked:opacity-100",
  iconIndeterminate: "opacity-100",
  card: "group relative flex items-start p-3.5 rounded-xl border w-full transition-all duration-200 cursor-pointer select-none gap-3",
  cardChecked:
    "border-form-checkbox-card-border-checked bg-form-checkbox-card-bg-checked shadow-xs",
  cardUnchecked:
    "border-form-checkbox-card-border bg-form-checkbox-card-bg hover:bg-form-checkbox-card-bg-hover hover:border-primary/40",
} as const;
