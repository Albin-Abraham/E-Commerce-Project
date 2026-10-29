/**
 * Zenith Modular Form Tokens: Radio Control & Groups
 *
 * Provides styling definitions for radio buttons, indicator rings,
 * cards, and segmented control tabs.
 */

export const radioTokens = {
  group: {
    vertical: "flex flex-col space-y-3 w-full",
    horizontal: "flex flex-row flex-wrap gap-4 items-center w-full",
    grid: "grid grid-cols-1 gap-2.5 sm:grid-cols-2 w-full",
    segmented:
      "inline-flex p-1 bg-form-radio-segmented-bg rounded-xl border border-form-radio-segmented-border gap-1 flex-wrap",
  },
  indicator: {
    base: "relative flex items-center justify-center shrink-0 w-4.5 h-4.5 rounded-full border-2 transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
    checked: "border-form-radio-border-checked bg-form-radio-bg-checked",
    unchecked:
      "border-form-radio-border group-hover:border-form-radio-border-hover bg-form-radio-bg",
    dot: "w-2.5 h-2.5 rounded-full bg-form-radio-dot transition-all duration-200 shrink-0",
    dotChecked: "scale-100 opacity-100",
    dotUnchecked: "scale-0 opacity-0",
  },
  card: {
    base: "group relative flex items-start p-3.5 rounded-xl border w-full transition-all duration-200 cursor-pointer select-none gap-3",
    checked: "border-form-radio-card-border-checked bg-form-radio-card-bg-checked shadow-xs",
    unchecked:
      "border-form-radio-card-border bg-form-radio-card-bg hover:bg-form-radio-card-bg-hover hover:border-primary/40",
  },
  segmented: {
    item: "relative inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer select-none",
    itemChecked:
      "bg-form-radio-segmented-active-bg text-foreground shadow-xs border border-form-radio-segmented-active-border",
    itemUnchecked:
      "text-foreground/70 hover:text-foreground hover:bg-background/40",
  },
} as const;
