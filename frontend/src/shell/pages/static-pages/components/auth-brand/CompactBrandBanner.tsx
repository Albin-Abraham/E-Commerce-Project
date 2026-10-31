import React from "react";
import { type AuthPersona, AUTH_PERSONAS } from "../../configs/auth-personas";

export interface CompactBrandBannerProps {
  persona: AuthPersona;
}

export const CompactBrandBanner: React.FC<CompactBrandBannerProps> = ({ persona }) => {
  const config = AUTH_PERSONAS[persona];

  const colorStyles = {
    customer: "from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
    partner: "from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    staff: "from-slate-700/15 via-slate-700/5 to-transparent border-slate-700/30 text-slate-700 dark:text-slate-300",
  }[persona];

  return (
    <div
      className={`lg:hidden w-full p-4 mb-4 rounded-2xl border bg-gradient-to-r ${colorStyles} flex items-center justify-between gap-3`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">
          {config.icon}
        </span>
        <div>
          <div className="text-xs font-black uppercase tracking-wider">
            {config.title}
          </div>
          <div className="text-xs text-muted-foreground line-clamp-1">
            {config.headline}
          </div>
        </div>
      </div>
      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-surface/80 border border-border/60 shrink-0">
        {config.badge}
      </span>
    </div>
  );
};
