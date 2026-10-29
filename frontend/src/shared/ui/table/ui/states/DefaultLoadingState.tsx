import { useEffect, useState } from "react";
import { Loader2, Database, Zap, CloudDownload } from "lucide-react";

import { cn } from "@core/libs/utils";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import type { LoadingSlotProps } from "../../types";

/** Deterministic skeleton width based on row/col index (no Math.random) */
function skeletonWidth(rowIndex: number, colIndex: number): number {
  const hash = ((rowIndex * 7 + colIndex * 13 + 37) % 40) + 60;
  return hash;
}

const VARIANT_ICONS = {
  rows: Database,
  cards: Zap,
  table: Database,
  list: Zap,
};

const VARIANT_MESSAGES = {
  rows: "Loading rows...",
  cards: "Preparing cards...",
  table: "Loading table...",
  list: "Loading list...",
};

/**
 * DefaultLoadingState
 *
 * Shown while data is being fetched.
 * Supports progressive loading, streaming, and partial renders.
 */
export function DefaultLoadingState({
  rows = 5,
  columns = 4,
  message,
  subtitle,
  showProgress = false,
  progress,
  variant = "table",
  minDuration = 500,
  onComplete,
}: LoadingSlotProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  const IconComponent = VARIANT_ICONS[variant] ?? Database;
  const defaultMessage = VARIANT_MESSAGES[variant];

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);

    if (minDuration > 0) {
      const timeout = setTimeout(() => {
        setShowLoader(false);
      }, minDuration);
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(timer);
  }, [minDuration]);

  useEffect(() => {
    if (progress !== undefined && progress >= 1 && !isComplete) {
      setIsComplete(true);
      onComplete?.();
      setTimeout(() => setShowLoader(false), 300);
    }
  }, [progress, isComplete, onComplete]);

  const displayMessage = message ?? resolveTranslation(defaultMessage, "common/base");
  const displaySubtitle = subtitle ?? resolveTranslation("Please wait...", "common/base");
  const displayProgress = progress !== undefined ? Math.round(progress * 100) : undefined;

  if (!showLoader) {
    return null;
  }

  const renderRowSkeleton = (rowIndex: number) => (
    <tr key={rowIndex} className="border-b border-border/20 animate-in fade-in duration-300">
      {Array.from({ length: columns }, (_, colIndex) => (
        <td key={colIndex} className="px-4 py-3">
          <div
            className="h-4 rounded-md bg-muted/50 animate-pulse"
            style={{
              width: `${skeletonWidth(rowIndex, colIndex)}%`,
              animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`,
            }}
          />
        </td>
      ))}
    </tr>
  );

  const renderCardSkeleton = (index: number) => (
    <div key={index} className="animate-in fade-in duration-300" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="bg-card border border-border/40 rounded-xl p-4">
        <div className="h-6 w-3/4 bg-muted/50 rounded animate-pulse mb-3" style={{ animationDelay: `${index * 50}ms` }} />
        <div className="h-4 w-1/2 bg-muted/50 rounded animate-pulse" style={{ animationDelay: `${index * 50 + 100}ms` }} />
        <div className="h-4 w-1/3 bg-muted/50 rounded animate-pulse mt-2" style={{ animationDelay: `${index * 50 + 200}ms` }} />
      </div>
    </div>
  );

  const renderListSkeleton = (index: number) => (
    <div key={index} className="animate-in slide-in-from-left duration-300" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex items-center gap-3 p-3 bg-card border border-border/40 rounded-lg">
        <div className="w-10 h-10 rounded-full bg-muted/50 animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse mb-1" />
          <div className="h-3 w-1/2 bg-muted/50 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4" role="status" aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <IconComponent size={28} className="text-primary animate-spin" />
            {progress !== undefined && (
              <svg className="absolute inset-0 w-16 h-16 -rotate-90" aria-hidden="true">
                <circle
                  cx="50%"
                  cy="50%"
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-primary/20"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${(progress ?? 0) * 125.66} 125.66`}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-500"
                  style={{ strokeDashoffset: (1 - (progress ?? 0)) * 125.66 }}
                />
              </svg>
            )}
          </div>
        </div>

        <div className="text-center max-w-sm">
          <p className="text-sm font-medium text-foreground">{displayMessage}</p>
          {displaySubtitle && <p className="text-xs text-muted-foreground mt-1">{displaySubtitle}</p>}
        </div>
      </div>

      <div className="w-full max-w-md">
        {(showProgress || progress !== undefined) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{displayProgress !== undefined ? `${displayProgress}%` : "Loading..."}</span>
              {elapsed > 0 && <span>{(elapsed / 1000).toFixed(1)}s</span>}
            </div>
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${displayProgress ?? (elapsed / 2000) * 100}%` }}
              />
            </div>
          </div>
        )}

        {variant === "table" && (
          <table className="w-full" aria-hidden="true">
            <tbody>
              {Array.from({ length: rows }, (_, rowIndex) => renderRowSkeleton(rowIndex))}
            </tbody>
          </table>
        )}

        {variant === "cards" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl" aria-hidden="true">
            {Array.from({ length: rows }, (_, i) => renderCardSkeleton(i))}
          </div>
        )}

        {variant === "list" && (
          <div className="space-y-2 w-full max-w-md" aria-hidden="true">
            {Array.from({ length: rows }, (_, i) => renderListSkeleton(i))}
          </div>
        )}

        {isComplete && (
          <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 animate-in fade-in">
            <Zap size={16} className="animate-pulse" />
            <span className="text-sm font-medium">{resolveTranslation("Ready!", "common/base")}</span>
          </div>
        )}
      </div>
    </div>
  );
}