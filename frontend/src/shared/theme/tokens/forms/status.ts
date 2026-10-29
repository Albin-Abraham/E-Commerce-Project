/**
 * Zenith Modular Form Tokens: Status Indicators
 *
 * Provides styling definitions for field status pills and validation badges.
 */

export const statusTokens = {
  primary:
    "bg-primary/10 text-primary border-primary/20 dark:bg-primary/15 dark:border-primary/30",
  success:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 dark:bg-emerald-500/15 dark:border-emerald-500/30",
  warning:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 dark:bg-amber-500/15 dark:border-amber-500/30",
  danger:
    "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/15 dark:border-destructive/30",
  default:
    "bg-muted text-muted-foreground border-border dark:bg-muted/80 dark:border-border-strong",
} as const;
