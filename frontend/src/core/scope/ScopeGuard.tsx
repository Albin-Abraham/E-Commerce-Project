import React from "react";
import { useScope } from "./useScope";

export interface ScopeGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireBranch?: boolean;
}

/**
 * ScopeGuard — Ensures an active organization (and optionally branch) is selected
 * before rendering the child view.
 */
export const ScopeGuard: React.FC<ScopeGuardProps> = ({
  children,
  fallback = (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-card border border-border/50 rounded-2xl">
      <h3 className="text-base font-bold text-foreground">Scope Required</h3>
      <p className="text-xs text-muted-foreground mt-1">
        Please select an active organization or branch to continue.
      </p>
    </div>
  ),
  requireBranch = false,
}) => {
  const { activeOrg, activeBranch } = useScope();

  if (!activeOrg || (requireBranch && !activeBranch)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
