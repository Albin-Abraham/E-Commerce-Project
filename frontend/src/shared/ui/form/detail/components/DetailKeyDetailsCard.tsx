import React, { Suspense } from "react";

import { tokens } from "@shared/theme";
import { cn } from "@ui/form/utils/form-styles";

import type { KeyDetailsCardRendererProps } from "../types";

/**
 * Accessible animated skeleton fallback for incremental hydration and Suspense streaming.
 */
export function DetailCardSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading details"
      aria-busy="true"
      className={cn(
        "w-full flex flex-col divide-y divide-border/40 animate-pulse",
        className
      )}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-3.5 px-1">
          {/* Label skeleton */}
          <div className="h-4 bg-muted/40 rounded-md w-1/4" />
          {/* Value skeleton */}
          <div className="h-4 bg-muted/60 rounded-md w-1/3" />
        </div>
      ))}
    </div>
  );
}

/**
 * Key Details Card Container.
 * Elevated container surface enforcing ZenOS tokens (rounded-2xl, border-border, shadow-xs)
 * with native React 19 <Suspense> streaming fallback slots for incremental skeleton loading.
 */
export function DetailKeyDetailsCard({
  title,
  subtitle,
  action,
  children,
  className,
  fallback,
  suspense = false,
}: KeyDetailsCardRendererProps) {
  const cardTokens = tokens.detail.card;
  const isSuspenseEnabled = suspense || Boolean(fallback);

  const content = isSuspenseEnabled ? (
    <Suspense fallback={fallback ?? <DetailCardSkeleton />}>
      {children}
    </Suspense>
  ) : (
    children
  );

  return (
    <section
      data-slot="key-details-card"
      className={cn(cardTokens.container, className)}
    >
      {(title || action) && (
        <div className={cardTokens.header}>
          <div className="flex flex-col">
            {title && <h2 className={cardTokens.title}>{title}</h2>}
            {subtitle && <p className={cardTokens.subtitle}>{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={cardTokens.content}>{content}</div>
    </section>
  );
}

DetailKeyDetailsCard.Skeleton = DetailCardSkeleton;
