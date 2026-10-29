/**
 * Zenith Modular Form Tokens: Shared Control Layout & Typography
 *
 * Provides optical alignment and typography standards across interactive controls
 * (Checkbox, Switch, Radio).
 */

export const controlLayoutTokens = {
  singleLine:
    "group relative flex items-center gap-3 cursor-pointer select-none transition-all duration-200",
  multiLine:
    "group relative flex items-start gap-3 cursor-pointer select-none transition-all duration-200",
  disabled: "opacity-50 cursor-not-allowed pointer-events-none",
  controlOffset: "mt-0.5 shrink-0",
  controlCenter: "shrink-0",
  labelStack: "flex flex-col min-w-0 flex-1",
  labelRow: "flex items-center gap-2",
} as const;

export const controlTypographyTokens = {
  title: "text-sm font-medium leading-snug transition-colors",
  titleChecked: "font-semibold text-foreground",
  titleUnchecked: "text-foreground/80 group-hover:text-foreground",
  description: "text-xs text-muted-foreground mt-0.5 leading-relaxed",
  icon: "transition-colors shrink-0",
  iconChecked: "text-primary",
  iconUnchecked: "text-foreground/50",
} as const;
