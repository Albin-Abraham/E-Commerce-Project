/**
 * Zenith Modular Form Tokens: Shell, Header & Validation Summary
 *
 * Provides styling definitions for form shell headers, action toolbars,
 * and form-level validation summaries.
 */

export const shellTokens = {
  header: {
    container:
      "form-header w-full flex items-start justify-between pb-6 mb-6 border-b border-form-shell-divider gap-4",
    iconBadgeOuter:
      "relative flex items-center justify-center w-12 h-12 rounded-2xl bg-form-shell-badge-outer border border-primary/20 shadow-xs shrink-0",
    iconBadgeInner:
      "flex items-center justify-center w-8 h-8 rounded-xl bg-form-shell-badge-inner border border-border shadow-xs text-primary",
    icon: "w-4 h-4",
    title:
      "form-header__title text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight drop-shadow-xs",
    description:
      "form-header__description text-sm text-muted-foreground mt-1 leading-relaxed max-w-2xl font-medium",
    statusBadge:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs",
  },
  actions: {
    container:
      "w-full flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 mt-6 border-t border-form-shell-divider",
    submit:
      "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 active:scale-[0.98] shadow-sm shadow-primary/25 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
    cancel:
      "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-foreground bg-surface border border-border hover:bg-subtle active:scale-[0.98] transition-all duration-200 disabled:opacity-50 cursor-pointer",
  },
  validationSummary: {
    container:
      "rounded-xl border border-form-shell-validation-border bg-form-shell-validation-bg p-4 mb-6 shadow-xs",
    icon: "text-destructive shrink-0 mt-0.5",
    title: "text-sm font-semibold text-destructive",
    item: "text-xs text-destructive/90 hover:underline flex items-center gap-1.5 transition-colors cursor-pointer",
  },
} as const;
