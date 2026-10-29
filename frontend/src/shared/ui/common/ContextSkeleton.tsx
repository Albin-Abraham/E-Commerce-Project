import React, { useEffect, useState } from "react";

import { LoadingService } from "@core/services/helpers/loading-service";
import { UIScope } from "@core/services/helpers/loading-ui.enum";
import { AnimatePresence, m } from "framer-motion";

import { Zenith } from "@shared/theme";

interface ContextSkeletonProps {
  /** The specific key to monitor in the LoadingService */
  loadingKey?: string;
  /** The scope to monitor (e.g., FORM, PAGE). Ignored if loadingKey is provided. */
  scope?: UIScope;
  /** Custom skeleton component. Falls back to a pulse-box. */
  fallback?: React.ReactNode;
  /** The content to reveal once loading is complete. */
  children: React.ReactNode;
  /** Optional container class */
  className?: string;
}

/**
 * ContextSkeleton: A Service-Aware loading wrapper.
 * Automatically toggles between a skeleton fallback and children based on
 * the global LoadingService state.
 */
export const ContextSkeleton: React.FC<ContextSkeletonProps> = ({
  loadingKey,
  scope,
  fallback,
  children,
  className = "",
}) => {
  const service = LoadingService.instance();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkState = () => {
      if (loadingKey) {
        setIsLoading(service.isKeyLoading(loadingKey));
      } else if (scope) {
        setIsLoading(service.isScopeLoading(scope));
      } else {
        setIsLoading(service.isActive);
      }
    };

    // Initial check
    checkState();

    // Subscribe to all loading changes
    const unsub = service.subscribe(() => {
      checkState();
    });

    return () => {
      unsub();
    };
  }, [loadingKey, scope, service]);

  const defaultFallback = (
    <div className="w-full h-full min-h-[100px] bg-surface/50 rounded-[var(--radius-xl)] animate-pulse border border-border/20" />
  );

  return (
    <div className={Zenith.cn("relative", className)}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <m.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {fallback || defaultFallback}
          </m.div>
        ) : (
          <m.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};
