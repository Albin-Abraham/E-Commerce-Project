import React from "react";

/**
 * PageSkeleton
 *
 * A premium, glassmorphic loading skeleton for route transitions.
 * Prevents layout shifts and provides professional visual feedback.
 */
export const PageSkeleton: React.FC = () => {
  return (
    <div className="app-container py-12 animate-in fade-in duration-500">
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className="h-10 w-1/3 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-4 w-1/2 bg-gray-100 dark:bg-gray-800/50 rounded-md animate-pulse" />
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 space-y-4 shadow-sm"
            >
              <div className="h-2/3 bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-50 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pulse effect overlay */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-t from-white/10 to-transparent dark:from-black/10 animate-pulse" />
    </div>
  );
};
