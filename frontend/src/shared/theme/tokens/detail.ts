/**
 * Zenith Detail-Specific Design Tokens
 *
 * Provides semantic styling contracts for read-only entity detail views,
 * slot renderers, key-value grids, and elevated summary cards across
 * both Light and Dark themes.
 */
import { form } from "./forms";

export const detail = {
  header: {
    container:
      "w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 border-b border-border/60",
    iconBadge: {
      outer:
        "relative flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 shadow-xs shrink-0",
      inner:
        "flex items-center justify-center w-10 h-10 rounded-xl bg-background border border-border shadow-xs text-primary",
      icon: "w-5 h-5",
    },
    title: "text-2xl font-bold tracking-tight text-foreground leading-tight",
    subtitle: "text-sm text-muted-foreground leading-relaxed",
    tag: "inline-flex items-center px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground text-xs font-medium",
    statusBadge:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs",
  },
  card: {
    container:
      "w-full rounded-2xl border border-border/70 dark:border-border-strong bg-surface/50 dark:bg-surface/30 p-6 shadow-xs backdrop-blur-xs transition-all",
    header:
      "flex items-center justify-between pb-4 mb-4 border-b border-border/50 dark:border-border-strong/50 gap-4",
    title: "text-base font-semibold text-foreground tracking-tight",
    subtitle: "text-xs text-muted-foreground mt-0.5",
    content: "w-full",
  },
  row: {
    base: "py-3 border-b border-border/30 dark:border-border-strong/40 last:border-b-0",
    horizontal:
      "flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4",
    vertical: "flex flex-col gap-1",
    label:
      "text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 dark:text-muted-foreground",
    description: "text-2xs text-muted-foreground mt-0.5",
    value: "text-sm font-medium text-foreground",
    valueRight: "sm:text-right",
  },
  display: {
    empty: "text-muted-foreground/50 italic",
    boolean:
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs",
    booleanTrue:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 dark:bg-emerald-500/15 dark:border-emerald-500/30",
    booleanFalse:
      "bg-muted text-muted-foreground border-border dark:bg-muted/80 dark:border-border-strong",
    optionPill:
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 dark:bg-primary/15 dark:border-primary/30 text-xs font-semibold shadow-2xs",
    link: "text-primary hover:underline font-medium inline-flex items-center gap-1 text-sm",
    image:
      "w-12 h-12 rounded-xl object-cover border border-border/60 dark:border-border-strong shadow-xs",
  },
  actions: {
    base: "w-full flex items-center justify-end gap-3 pt-6 border-t border-border/60",
    sticky:
      "sticky bottom-0 z-10 bg-background/90 backdrop-blur-md p-4 rounded-b-2xl border-t border-border/60 shadow-lg",
  },
  section: {
    cardContainer: "space-y-6",
    card: "rounded-2xl border border-border/40 dark:border-border-strong bg-surface/40 dark:bg-surface/30 p-6 shadow-sm",
    flat: "rounded-2xl border border-border/40 dark:border-border-strong bg-surface/40 dark:bg-surface/30 p-6",
    divider: "border-border/50 dark:border-border-strong/50",
    staticHeader: "text-base font-bold text-foreground",
  },
} as const;

export type DetailTokens = typeof detail;
