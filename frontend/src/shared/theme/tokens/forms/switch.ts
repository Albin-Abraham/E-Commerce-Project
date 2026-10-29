/**
 * Zenith Modular Form Tokens: Switch / Toggle Control
 *
 * Provides styling definitions for interactive switch controls and toggle cards.
 */

export const switchTokens = {
  container:
    "relative inline-flex items-center cursor-pointer select-none shrink-0 transition-opacity duration-200",
  sizes: {
    sm: {
      track: "w-8 h-4.5",
      thumb: "w-3.5 h-3.5 top-0.5 left-0.5",
      thumbChecked: "translate-x-3.5",
    },
    md: {
      track: "w-11 h-6",
      thumb: "w-5 h-5 top-0.5 left-0.5",
      thumbChecked: "translate-x-5",
    },
    lg: {
      track: "w-14 h-7.5",
      thumb: "w-6 h-6 top-0.5 left-0.5",
      thumbChecked: "translate-x-6.5",
    },
  },
  track:
    "relative shrink-0 rounded-full transition-colors duration-200 bg-form-switch-track peer-checked:bg-form-switch-track-checked peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
  thumb:
    "absolute rounded-full bg-form-switch-thumb shadow-md transition-transform duration-200 pointer-events-none",
  card: "group relative flex items-center justify-between p-4 rounded-xl border w-full transition-all duration-200 cursor-pointer select-none gap-4",
  cardChecked: "border-form-switch-card-border-checked bg-form-switch-card-bg-checked shadow-xs",
  cardUnchecked:
    "border-form-switch-card-border bg-form-switch-card-bg hover:bg-form-switch-card-bg-hover hover:border-primary/40",
} as const;
