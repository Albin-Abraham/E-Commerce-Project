import { Inbox, Search, Shield, WifiOff, Plus, Filter, Settings, ArrowLeft, RefreshCw } from "lucide-react";

import { cn } from "@core/libs/utils";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import type { EmptySlotProps } from "../../types";

const ILLUSTRATIONS: Record<string, React.ElementType> = {
  "no-data": Inbox,
  "no-results": Search,
  "no-permissions": Shield,
  offline: WifiOff,
  custom: Inbox,
};

const CONTEXT_MESSAGES: Record<string, { title: string; description: string; actionLabel?: string }> = {
  "no-data": {
    title: "No data available",
    description: "There are no records to display. Get started by adding your first entry.",
    actionLabel: "Add record",
  },
  "no-results": {
    title: "No results found",
    description: "Try adjusting your search or filters to find what you're looking for.",
    actionLabel: "Clear filters",
  },
  "no-permissions": {
    title: "Access denied",
    description: "You don't have permission to view this data. Contact your administrator.",
    actionLabel: "Request access",
  },
  offline: {
    title: "You're offline",
    description: "Check your connection and try again. Data will sync when you're back online.",
    actionLabel: "Retry",
  },
  custom: {
    title: "Nothing here",
    description: "No data matches your current view.",
  },
};

interface DefaultEmptyStateProps extends EmptySlotProps {}

export function DefaultEmptyState({
  message,
  title,
  description,
  icon: CustomIcon,
  action,
  secondaryAction,
  context = "no-data",
  illustrationSize = "md",
  illustration: CustomIllustration,
  showPattern = false,
}: DefaultEmptyStateProps) {
  const ctx = CONTEXT_MESSAGES[context] ?? CONTEXT_MESSAGES.custom;
  const displayTitle = title ?? ctx.title;
  const displayDescription = description ?? ctx.description;
  const displayActionLabel = action?.label ?? ctx.actionLabel;

  const IconComponent = CustomIcon ?? ILLUSTRATIONS[context] ?? Inbox;

  const sizeClasses = {
    sm: "w-10 h-10 text-2xl",
    md: "w-16 h-16 text-4xl",
    lg: "w-20 h-20 text-5xl",
    xl: "w-24 h-24 text-6xl",
  };

  const patternBg = showPattern && (
    <div className="absolute inset-0 opacity-5" aria-hidden>
      <svg width="100%" height="100%">
        <defs>
          <pattern id="dots" patternUnits="userSpaceOnUse" width="20" height="20">
            <circle cx="10" cy="10" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
    </div>
  );

  const resolvedMessage = message ? resolveTranslation(message, "common/base") : displayDescription;
  const resolvedTitle = resolveTranslation(displayTitle, "common/base");
  const resolvedActionLabel = displayActionLabel ? resolveTranslation(displayActionLabel, "common/base") : undefined;

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center relative", showPattern && "overflow-hidden")}>
      {patternBg}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div
          className={cn(
            "rounded-2xl bg-muted/30 flex items-center justify-center flex-shrink-0 transition-all duration-300",
            sizeClasses[illustrationSize]
          )}
        >
          <IconComponent
            size={illustrationSize === "sm" ? 18 : illustrationSize === "md" ? 28 : illustrationSize === "lg" ? 36 : 48}
            className="text-muted-foreground/60"
            aria-hidden="true"
            data-testid="empty-state-icon"
          />
          {CustomIllustration && <span className="absolute inset-0 flex items-center justify-center">{CustomIllustration}</span>}
        </div>

        <div className="max-w-md text-center">
          <h3 className="text-lg font-semibold text-foreground">{resolvedTitle}</h3>
          <p className="text-sm text-muted-foreground mt-1">{resolvedMessage}</p>
        </div>

        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2 w-full max-w-md">
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-[var(--motion-medium)]",
                  secondaryAction.variant === "primary" && "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20",
                  secondaryAction.variant === "secondary" && "bg-surface-raised border border-border/40 text-foreground hover:bg-surface shadow-sm",
                  secondaryAction.variant === "outline" && "bg-transparent border border-border/40 text-foreground hover:bg-surface",
                  secondaryAction.variant === "ghost" && "bg-transparent text-muted-foreground hover:text-foreground",
                  "w-full sm:w-auto"
                )}
              >
                {secondaryAction.icon && <secondaryAction.icon size={14} />}
                {resolveTranslation(secondaryAction.label, "common/base")}
              </button>
            )}
            {action && (
              <button
                onClick={action.onClick}
                className={cn(
                  "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-[var(--motion-medium)]",
                  action.variant === "primary" && "bg-primary text-white hover:shadow-lg hover:shadow-primary/20",
                  action.variant === "secondary" && "bg-surface-raised border border-border/40 text-foreground hover:bg-surface shadow-sm",
                  action.variant === "outline" && "bg-transparent border border-border/40 text-foreground hover:bg-surface",
                  action.variant === "ghost" && "bg-transparent text-muted-foreground hover:text-foreground",
                  "w-full sm:w-auto"
                )}
              >
                {action.icon && <action.icon size={14} />}
                {resolvedActionLabel}
              </button>
            )}
          </div>
        )}

        {context === "no-data" && !action && !secondaryAction && (
          <div className="mt-6 pt-4 border-t border-border/40 w-full max-w-md">
            <p className="text-xs text-muted-foreground/70">
              {resolveTranslation("Get started by adding your first record or importing data.", "common/base")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}