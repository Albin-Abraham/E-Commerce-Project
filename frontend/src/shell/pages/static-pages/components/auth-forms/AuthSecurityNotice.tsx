import React from "react";
import type { AuthPersona } from "../../configs/auth-personas";

export interface AuthSecurityNoticeProps {
  persona: AuthPersona;
  mode: "login" | "signup" | "forgot-password";
}

export const AuthSecurityNotice: React.FC<AuthSecurityNoticeProps> = ({
  persona,
  mode,
}) => {
  if (persona === "staff") {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/10 dark:bg-slate-900/60 p-3 text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2.5 mb-3">
        <span className="text-base" aria-hidden="true">
          🛡️
        </span>
        <div>
          <span className="font-bold">Restricted Corporate Gateway:</span> Session
          audited. Internal IT credentials required.
        </div>
      </div>
    );
  }

  if (persona === "partner" && mode === "signup") {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2.5 mb-3">
        <span className="text-base" aria-hidden="true">
          📋
        </span>
        <div>
          <span className="font-bold">Vendor Onboarding:</span> Accounts are
          subject to enterprise compliance verification before full PO access is
          granted.
        </div>
      </div>
    );
  }

  return null;
};
