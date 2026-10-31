import React from "react";
import { type AuthPersona, AUTH_PERSONAS } from "../../configs/auth-personas";

export interface AuthPersonaBadgeProps {
  persona: AuthPersona;
}

export const AuthPersonaBadge: React.FC<AuthPersonaBadgeProps> = ({ persona }) => {
  const config = AUTH_PERSONAS[persona];

  const badgeTheme = {
    customer: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    partner: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    staff: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  }[persona];

  return (
    <div className="flex items-center justify-between mb-3 w-full">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">
          {config.icon}
        </span>
        <span
          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeTheme}`}
        >
          {config.badge}
        </span>
      </div>
      <span className="text-[11px] font-semibold text-muted-foreground">
        {config.title}
      </span>
    </div>
  );
};
