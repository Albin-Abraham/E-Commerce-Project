/**
 * Zenith Modular Form Tokens: Stepper Spinners
 *
 * Provides styling definitions for NumberInputField stepper controls.
 */

export const spinnerTokens = {
  container:
    "absolute right-1.5 flex items-center gap-0.5 bg-form-spinner-bg border border-form-spinner-border rounded-lg p-0.5 shadow-2xs",
  button:
    "flex items-center justify-center w-6 h-6 rounded hover:bg-form-spinner-btn-hover text-muted-foreground hover:text-foreground active:scale-90 transition-all cursor-pointer",
  divider: "w-[1px] h-3.5 bg-form-spinner-divider",
} as const;
