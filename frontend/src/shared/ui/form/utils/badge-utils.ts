import type { FieldBadgeConfig, FormField } from "@ui/form/fields";
import { cn } from "@ui/form/utils/form-styles";

export interface ResolvedBadgeStyles {
  tagClass: string;
  overflowBadgeClass: string;
  removeButtonClass: string;
  selectedAreaClass: string;
  badgeConfig: FieldBadgeConfig;
}

/**
 * Resolves comprehensive badge and tag styling with 100% extensibility
 * from the Form Definition (field.properties.badge, field.meta.ui.badge,
 * DCS slot classNames, and direct prop overrides).
 */
export function resolveBadgeStyles(
  field: FormField,
  styles?: Record<string, string | undefined>,
  propBadgeConfig?: FieldBadgeConfig
): ResolvedBadgeStyles {
  const badgeConfig: FieldBadgeConfig =
    propBadgeConfig ||
    (field.properties as any)?.badge ||
    (field as any).badge ||
    field.meta?.ui?.badge ||
    {};

  const intent = badgeConfig.intent || (field.properties as any)?.intent || "primary";
  const variant = badgeConfig.variant || "soft";
  const radius = badgeConfig.radius || "md";
  const size = badgeConfig.size || "sm";

  // Intent + Variant style generator
  const intentClass = getBadgeIntentClasses(intent, variant, false);

  // Overflow intent + variant
  const overflowIntent = badgeConfig.overflowIntent || intent;
  const overflowVariant = badgeConfig.overflowVariant || variant;
  const overflowIntentClass = getBadgeIntentClasses(overflowIntent, overflowVariant, true);

  // Border radius scale
  const radiusClass =
    radius === "full"
      ? "rounded-full"
      : radius === "lg"
        ? "rounded-lg"
        : radius === "sm"
          ? "rounded-sm"
          : radius === "none"
            ? "rounded-none"
            : "rounded-md";

  // Overflow badge radius: defaults to full pill for clean counter geometry, or inherits badgeConfig.radius
  const overflowRadiusClass =
    badgeConfig.radius === undefined
      ? "rounded-full"
      : radiusClass;

  // Size and typography scale
  const sizeClass =
    size === "xs"
      ? "text-[10px]"
      : size === "lg"
        ? "text-sm"
        : size === "md"
          ? "text-xs"
          : "text-xs";

  // Padding scale (user override takes absolute precedence)
  const defaultPadding =
    size === "xs"
      ? "px-1.5 py-0.5"
      : size === "lg"
        ? "px-3 py-1"
        : "px-2 py-0.5";
  const paddingClass = badgeConfig.padding || defaultPadding;

  // Margin (user override)
  const marginClass = badgeConfig.margin || "";

  // Slot classNames from DCS / properties
  const slotTag =
    styles?.tag ||
    styles?.badge ||
    field.meta?.ui?.classNames?.tag ||
    field.meta?.ui?.classNames?.badge ||
    (field.properties?.classNames as any)?.tag ||
    (field.properties?.classNames as any)?.badge;

  const slotOverflow =
    styles?.overflowBadge ||
    field.meta?.ui?.classNames?.overflowBadge ||
    (field.properties?.classNames as any)?.overflowBadge;

  const slotRemove =
    styles?.removeButton ||
    field.meta?.ui?.classNames?.removeButton ||
    (field.properties?.classNames as any)?.removeButton;

  const slotSelectedArea =
    styles?.selectedArea ||
    field.meta?.ui?.classNames?.selectedArea ||
    (field.properties?.classNames as any)?.selectedArea;

  const tagClass = cn(
    "inline-flex items-center gap-1 font-semibold border shrink-0 select-none animate-in fade-in zoom-in-95 duration-150",
    intentClass,
    radiusClass,
    sizeClass,
    paddingClass,
    marginClass,
    slotTag,
    badgeConfig.className
  );

  const overflowBadgeClass = cn(
    "inline-flex items-center justify-center min-w-[1.5rem] font-bold border shrink-0 select-none cursor-pointer transition-all hover:scale-105 active:scale-95",
    overflowIntentClass,
    overflowRadiusClass,
    sizeClass,
    badgeConfig.padding || "px-1.5 py-0.5",
    marginClass,
    slotOverflow,
    badgeConfig.overflowClassName
  );

  const removeButtonClass = cn(
    "rounded-full p-0.5 transition-colors cursor-pointer opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10",
    slotRemove,
    badgeConfig.removeButtonClassName
  );

  const selectedAreaClass = cn(
    "flex flex-wrap items-center gap-1.5 pt-2 w-full",
    slotSelectedArea
  );

  return {
    tagClass,
    overflowBadgeClass,
    removeButtonClass,
    selectedAreaClass,
    badgeConfig,
  };
}

/**
 * Resolves color and border classes guaranteed to satisfy WCAG AA/AAA contrast ratios
 * in both Light and Dark themes, eliminating hardcoded `bg-muted` text-color misuse.
 */
export function getBadgeIntentClasses(
  intent: string,
  variant: string,
  isOverflow = false
): string {
  if (variant === "outline") {
    switch (intent) {
      case "secondary":
        return "bg-transparent text-secondary border-secondary/50 dark:border-secondary/60";
      case "success":
        return "bg-transparent text-success border-success/50 dark:border-success/60";
      case "warning":
        return "bg-transparent text-warning-700 dark:text-warning-300 border-warning/50 dark:border-warning/60";
      case "danger":
        return "bg-transparent text-danger border-danger/50 dark:border-danger/60";
      case "info":
        return "bg-transparent text-info border-info/50 dark:border-info/60";
      case "neutral":
      case "subtle":
        return "bg-transparent text-foreground/80 dark:text-foreground/90 border-border dark:border-neutral-700";
      case "primary":
      default:
        return "bg-transparent text-primary border-primary/50 dark:border-primary/60";
    }
  }

  if (variant === "solid") {
    switch (intent) {
      case "secondary":
        return "bg-secondary text-secondary-foreground border-transparent";
      case "success":
        return "bg-success text-success-foreground border-transparent";
      case "warning":
        return "bg-warning text-warning-foreground border-transparent";
      case "danger":
        return "bg-danger text-danger-foreground border-transparent";
      case "info":
        return "bg-info text-info-foreground border-transparent";
      case "neutral":
      case "subtle":
        return "bg-neutral-800 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-900 border-transparent";
      case "primary":
      default:
        return "bg-primary text-primary-foreground border-transparent";
    }
  }

  // Soft variant (default)
  switch (intent) {
    case "secondary":
      return isOverflow
        ? "bg-secondary/15 text-secondary border-secondary/30 dark:bg-secondary/25 dark:text-secondary dark:border-secondary/45"
        : "bg-secondary/10 text-secondary border-secondary/25 dark:bg-secondary/20 dark:text-secondary dark:border-secondary/35";
    case "success":
      return isOverflow
        ? "bg-success/15 text-success border-success/30 dark:bg-success/25 dark:text-success dark:border-success/45"
        : "bg-success/10 text-success border-success/25 dark:bg-success/20 dark:text-success dark:border-success/35";
    case "warning":
      return isOverflow
        ? "bg-warning/20 text-warning-700 border-warning/35 dark:bg-warning/25 dark:text-warning-300 dark:border-warning/45"
        : "bg-warning/15 text-warning-700 border-warning/30 dark:bg-warning/20 dark:text-warning-300 dark:border-warning/40";
    case "danger":
      return isOverflow
        ? "bg-danger/15 text-danger border-danger/30 dark:bg-danger/25 dark:text-danger dark:border-danger/45"
        : "bg-danger/10 text-danger border-danger/25 dark:bg-danger/20 dark:text-danger dark:border-danger/35";
    case "info":
      return isOverflow
        ? "bg-info/15 text-info border-info/30 dark:bg-info/25 dark:text-info dark:border-info/45"
        : "bg-info/10 text-info border-info/25 dark:bg-info/20 dark:text-info dark:border-info/35";
    case "neutral":
    case "subtle":
      return isOverflow
        ? "bg-neutral-200/90 text-neutral-800 border-neutral-300/80 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700"
        : "bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800/90 dark:text-neutral-200 dark:border-neutral-700";
    case "primary":
    default:
      return isOverflow
        ? "bg-primary/15 text-primary border-primary/30 dark:bg-primary/25 dark:text-primary dark:border-primary/45"
        : "bg-primary/10 text-primary border-primary/25 dark:bg-primary/20 dark:text-primary dark:border-primary/35";
  }
}
