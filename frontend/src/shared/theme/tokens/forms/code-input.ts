/**
 * Zenith Modular Form Tokens: Code / OTP Input
 *
 * Provides styling definitions for verification code, PIN, and OTP inputs.
 */

export const codeInputTokens = {
  container:
    "flex items-center justify-center gap-2 sm:gap-3 w-full py-2 select-none",
  group: "flex items-center gap-2 sm:gap-2.5",
  separator:
    "w-3 h-0.5 bg-form-code-separator rounded-full mx-1 select-none shrink-0",
  box: "relative w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl transition-all duration-200 outline-none select-none border border-form-code-border bg-form-code-bg text-foreground shadow-2xs caret-primary",
  boxHover:
    "hover:border-form-code-border-hover hover:bg-form-code-bg-hover",
  boxFocused:
    "border-form-code-border-focus ring-4 ring-form-code-ring-focus bg-form-code-bg-focus text-foreground shadow-xs scale-105 z-10",
  boxFilled:
    "border-form-code-border-filled bg-form-code-bg-filled text-foreground font-extrabold",
  boxError: "border-form-code-border-error ring-4 ring-form-code-ring-error text-destructive",
  boxDisabled:
    "opacity-50 cursor-not-allowed bg-form-code-bg-disabled border-form-code-border-disabled text-muted pointer-events-none",
} as const;
