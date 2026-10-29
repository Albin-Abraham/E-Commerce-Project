/**
 * Zenith Modular Form Tokens: Inputs & Base Surfaces
 *
 * Provides styling definitions for standard inputs (Text, Textarea, Number, Phone, Search),
 * standalone fields, and base visual variants (outlined, filled, underlined).
 */

export const inputVariants = {
  outlined: {
    base: "border border-border bg-surface text-foreground shadow-sm placeholder:text-muted/50 rounded-[var(--radius-md)] transition-all duration-200 ease-in-out",
    hover: "hover:border-primary/40 hover:shadow-md",
    focus:
      "focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none",
    error:
      "border-danger text-danger placeholder:text-danger/30 focus:border-danger focus:ring-danger/20 shadow-none",
  },
  filled: {
    base: "border-none bg-subtle text-foreground placeholder:text-muted/50 rounded-[var(--radius-md)] transition-colors duration-200",
    hover: "hover:bg-muted/10",
    focus:
      "focus:bg-surface focus:ring-2 focus:ring-primary/20 outline-none shadow-sm",
    error: "bg-danger/10 text-danger ring-1 ring-danger",
  },
  underlined: {
    base: "border-b-2 border-border rounded-none px-0 bg-transparent text-foreground placeholder:text-muted/50 transition-colors duration-200",
    hover: "hover:border-primary/40",
    focus: "focus:border-primary focus:ring-0 outline-none",
    error: "border-danger text-danger",
  },
} as const;

export const field = {
  shell: "relative group w-full transition-all duration-300",
  ring: {
    idle: "ring-1 ring-border group-hover:ring-primary/30",
    focus: "ring-2 ring-primary shadow-sm",
    error: "ring-2 ring-danger shadow-sm",
  },
  surface: {
    idle: "bg-surface",
    active: "bg-background",
  },
} as const;

export const text = {
  label: "text-sm font-bold text-foreground/80 tracking-tight",
  description: "text-xs text-foreground/50 leading-relaxed",
  error:
    "text-xs font-semibold text-danger animate-in fade-in slide-in-from-top-1",
  value: "text-sm text-foreground antialiased",
} as const;

export const input = {
  base: "w-full bg-transparent border-none focus:ring-0 placeholder:text-foreground/30",
  compact: "py-1.5 px-3 text-xs",
  comfortable: "py-2.5 px-4 text-sm",
  spacious: "py-4 px-6 text-base",
} as const;

export const surface = {
  base: "bg-surface",
  subtle: "bg-subtle",
  card: "bg-surface border border-border shadow-md rounded-[var(--radius-xl)]",
} as const;

export const animation = {
  micro: "transition-all duration-200 ease-out active:scale-[0.98]",
  entry: "animate-in fade-in slide-in-from-bottom-2 duration-400",
} as const;

export const standaloneInput = {
  base: "w-full rounded-xl border border-form-field-border bg-form-field-bg px-3.5 py-2.5 text-sm font-medium text-foreground transition-all duration-200 outline-none shadow-2xs placeholder:text-form-field-placeholder",
  hover:
    "hover:border-form-field-border-hover hover:bg-form-field-bg-hover",
  focus:
    "focus:border-form-field-border-focus focus:ring-2 focus:ring-form-field-ring-focus focus:bg-form-field-bg-focus",
  error:
    "border-destructive focus:border-destructive focus:ring-destructive/20 text-destructive",
  disabled:
    "opacity-50 cursor-not-allowed bg-form-field-bg-disabled border-form-field-border-disabled text-muted pointer-events-none",
} as const;
