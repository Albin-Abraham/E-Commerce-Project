import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  RefreshCw,
  WifiOff,
  Server,
  Shield,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  AlertCircle,
  Info,
  Bug,
  Loader2,
} from "lucide-react";

import { cn } from "@core/libs/utils";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import type { ErrorSlotProps } from "../../types";

const ERROR_ICONS: Record<string, React.ElementType> = {
  network: WifiOff,
  server: Server,
  permission: Shield,
  validation: AlertTriangle,
  "not-found": AlertTriangle,
  timeout: AlertTriangle,
  unknown: AlertCircle,
};

const ERROR_MESSAGES: Record<string, { title: string; description: string; suggestion?: string }> = {
  network: {
    title: "Connection lost",
    description: "Unable to reach the server. Please check your internet connection.",
    suggestion: "Check your network and try again.",
  },
  server: {
    title: "Server error",
    description: "The server encountered an error while processing your request.",
    suggestion: "Try again in a few moments. If the problem persists, contact support.",
  },
  permission: {
    title: "Access denied",
    description: "You don't have permission to access this resource.",
    suggestion: "Contact your administrator for access.",
  },
  validation: {
    title: "Invalid data",
    description: "The request contains invalid data.",
    suggestion: "Check your input and try again.",
  },
  "not-found": {
    title: "Not found",
    description: "The requested resource could not be found.",
    suggestion: "Check the URL or try a different search.",
  },
  timeout: {
    title: "Request timed out",
    description: "The server took too long to respond.",
    suggestion: "Try again or simplify your request.",
  },
  unknown: {
    title: "Something went wrong",
    description: "An unexpected error occurred while loading data.",
    suggestion: "Try refreshing the page or contact support if the issue persists.",
  },
};

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

interface DefaultErrorStateProps extends ErrorSlotProps {}

export function DefaultErrorState({
  error,
  retry,
  classification = "unknown",
  title: overrideTitle,
  description: overrideDescription,
  errorCode,
  actions = [],
  showDetails: initialShowDetails = false,
  onDismiss,
  autoRetry = false,
  maxRetries = 3,
  baseRetryDelay = 1000,
}: DefaultErrorStateProps) {
  const { t } = useTranslation("common/base");
  const [showDetails, setShowDetails] = useState(initialShowDetails);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const ctx = ERROR_MESSAGES[classification] ?? ERROR_MESSAGES.unknown;
  const IconComponent = ERROR_ICONS[classification] ?? AlertCircle;

  const displayTitle = overrideTitle ?? ctx.title;
  const displayDescription = overrideDescription ?? (error?.message ? `${ctx.description} ${error.message}` : ctx.description);
  const displaySuggestion = ctx.suggestion;

  const resolvedTitle = resolveTranslation(displayTitle, "common/base");
  const resolvedDescription = resolveTranslation(displayDescription, "common/base");
  const resolvedSuggestion = displaySuggestion ? resolveTranslation(displaySuggestion, "common/base") : undefined;
  const retryLabel = t("buttons.retry", "Retry");
  const dismissLabel = t("buttons.dismiss", "Dismiss");
  const detailsLabel = t("buttons.details", "Details");
  const hideDetailsLabel = t("buttons.hideDetails", "Hide details");
  const copyLabel = t("buttons.copy", "Copy error");
  const copiedLabel = t("buttons.copied", "Copied!");

  const handleRetry = async () => {
    if (!retry) return;
    setIsRetrying(true);
    try {
      await retry();
    } finally {
      setRetryCount((c) => c + 1);
      setIsRetrying(false);
    }
  };

  const handleAutoRetry = async () => {
    if (!autoRetry || retryCount >= maxRetries || !retry) return;
    const delay = baseRetryDelay * Math.pow(2, retryCount);
    await new Promise((resolve) => setTimeout(resolve, delay));
    await handleRetry();
  };

  const handleCopyError = () => {
    const errorInfo = {
      message: error?.message,
      classification,
      errorCode,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    };
    navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
  };

  const handleDismiss = () => {
    onDismiss?.();
  };

  // Auto-retry effect
  useEffect(() => {
    if (autoRetry && retryCount < maxRetries && retry && !isRetrying) {
      const timer = setTimeout(() => handleAutoRetry(), baseRetryDelay * Math.pow(2, retryCount));
      return () => clearTimeout(timer);
    }
  }, [autoRetry, retryCount, maxRetries, retry, isRetrying, baseRetryDelay, handleAutoRetry]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md w-full" role="alert">
      <div className="relative w-full">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-4 mx-auto">
          <IconComponent size={28} className="text-danger" aria-hidden="true" />
        </div>

        {errorCode && (
          <span className="absolute -top-2 -right-2 bg-muted/80 backdrop-blur-sm text-xs px-2 py-0.5 rounded-full text-muted-foreground font-mono">
            {errorCode}
          </span>
        )}
      </div>

      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {resolvedTitle}
        </h3>
        <p className="text-sm text-muted-foreground mb-2 max-w-md mx-auto">
          {resolvedDescription}
        </p>

        {resolvedSuggestion && (
          <p className="text-xs text-muted-foreground/80 max-w-md mx-auto flex items-center justify-center gap-1">
            <Info size={12} aria-hidden="true" />
            <span>{resolvedSuggestion}</span>
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-4">
        {retry && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-[var(--motion-medium)]",
              "bg-primary text-white hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed",
              "w-full sm:w-auto"
            )}
          >
            {isRetrying ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t("buttons.retrying", "Retrying...")}
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                {retryLabel}
              </>
            )}
          </button>
        )}

        {actions.length > 0 && actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-[var(--motion-medium)]",
              "w-full sm:w-auto",
              action.variant === "primary" && "bg-primary text-white hover:shadow-lg hover:shadow-primary/20",
              action.variant === "secondary" && "bg-surface-raised border border-border/40 text-foreground hover:bg-surface shadow-sm",
              action.variant === "outline" && "bg-transparent border border-border/40 text-foreground hover:bg-surface",
              action.variant === "destructive" && "bg-destructive text-white hover:shadow-lg hover:shadow-destructive/20",
            )}
          >
            {action.icon && <action.icon size={14} />}
            {resolveTranslation(action.label, "common/base")}
          </button>
        ))}

        {(onDismiss || showDetails) && (
          <button
            onClick={onDismiss ?? (() => setShowDetails(!showDetails))}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-[var(--motion-medium)]",
              "bg-transparent text-muted-foreground hover:text-foreground hover:bg-surface/50",
              "w-full sm:w-auto"
            )}
          >
            {showDetails ? (
              <>
                <ChevronUp size={14} />
                {hideDetailsLabel}
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                {detailsLabel}
              </>
            )}
          </button>
        )}
      </div>

{/* Error Details */}
      {showDetails ? (
        <div className="w-full max-w-md mt-4 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-muted/50 border border-border/40 rounded-lg p-3 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("error.details", "Error Details")}
              </span>
              <button
                onClick={handleCopyError}
                className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title={copyLabel}
              >
                <Copy size={12} />
                {copyLabel}
              </button>
            </div>
            <div className="space-y-1 text-xs font-mono text-muted-foreground/80 max-h-40 overflow-auto">
              <div className="flex gap-2">
                <span className="font-medium w-24">Type:</span>
                <span>{classification}</span>
              </div>
              {errorCode && (
                <div className="flex gap-2">
                  <span className="font-medium w-24">Code:</span>
                  <span>{errorCode}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="font-medium w-24">Time:</span>
                <span>{new Date().toISOString()}</span>
              </div>
              {error?.message && (
                <div className="flex gap-2">
                  <span className="font-medium w-24">Message:</span>
                  <span className="break-all">{error.message}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="font-medium w-24">Stack:</span>
                <span className="break-all">{error?.stack?.split("\n")[0] ?? "N/A"}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Retry indicator */}
      {autoRetry && retryCount > 0 && retryCount < maxRetries && (
        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-center text-sm text-primary">
          <span className="flex items-center justify-center gap-1">
            <RefreshCw size={12} className="animate-spin" />
            {t("error.retrying", "Auto-retry attempt {current} of {max}", {
              current: retryCount,
              max: maxRetries,
            })}
          </span>
        </div>
      )}

      {retryCount >= maxRetries && autoRetry && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-center text-sm text-destructive">
          <AlertCircle size={14} className="mx-auto mb-1" />
          <p>{t("error.maxRetriesReached", "Max retries reached. Please try manually.")}</p>
        </div>
      )}
    </div>
  );
}