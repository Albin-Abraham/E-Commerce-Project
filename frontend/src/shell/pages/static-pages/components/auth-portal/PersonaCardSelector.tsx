import React from "react";
import { type AuthPersona, AUTH_PERSONAS } from "../../configs/auth-personas";

export interface PersonaCardSelectorProps {
  activePersona: AuthPersona;
  onSelectPersona: (persona: AuthPersona) => void;
}

export const PersonaCardSelector: React.FC<PersonaCardSelectorProps> = ({
  activePersona,
  onSelectPersona,
}) => {
  const personas: AuthPersona[] = ["customer", "partner", "staff"];

  return (
    <section
      aria-label="Portal Selection"
      className="w-full max-w-6xl mx-auto mb-4"
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <span>Choose Your Portal</span>
          <span className="text-[10px] lowercase px-2 py-0.5 rounded-full bg-surface-raised border border-border/50 text-foreground/70">
            3 access tiers
          </span>
        </h2>
        <span className="text-xs text-muted-foreground/80 hidden sm:inline">
          Switch roles anytime
        </span>
      </div>

      <div
        role="tablist"
        aria-label="Authentication Portals"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
      >
        {personas.map((id) => {
          const config = AUTH_PERSONAS[id];
          const isActive = activePersona === id;

          // Theme-based accent classes
          const themeClasses = {
            customer: {
              activeCard:
                "border-indigo-500/80 bg-indigo-500/[0.04] shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/30",
              badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
              iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
              pill: "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30",
            },
            partner: {
              activeCard:
                "border-emerald-500/80 bg-emerald-500/[0.04] shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/30",
              badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
              iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              pill: "bg-emerald-600 text-white shadow-sm shadow-emerald-500/30",
            },
            staff: {
              activeCard:
                "border-slate-500/80 bg-slate-500/[0.06] shadow-md shadow-slate-500/10 ring-2 ring-slate-500/30",
              badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
              iconBg: "bg-slate-500/15 text-slate-700 dark:text-slate-200",
              pill: "bg-slate-700 text-white shadow-sm shadow-slate-500/30",
            },
          }[id];

          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`portal-${id}`}
              id={`tab-${id}`}
              onClick={() => onSelectPersona(id)}
              className={`relative flex flex-col p-4 sm:p-5 text-left rounded-2xl border transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? `${themeClasses.activeCard} scale-[1.01]`
                  : "border-border/60 bg-surface hover:border-border hover:bg-surface-raised/40 hover:shadow-sm"
              }`}
            >
              {/* Top Row: Icon + Badge */}
              <div className="flex items-center justify-between mb-3 w-full">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-transform ${
                    isActive ? themeClasses.iconBg : "bg-surface-raised text-foreground/80"
                  }`}
                >
                  {config.icon}
                </div>
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${themeClasses.badge}`}
                >
                  {config.badge}
                </span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight mb-1">
                {config.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                {config.subtitle}
              </p>

              {/* Bottom Row: Active Indicator Pill */}
              <div className="mt-3.5 pt-2.5 border-t border-border/30 flex items-center justify-between">
                {isActive ? (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${themeClasses.pill}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Active Portal
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-muted-foreground/70 group-hover:text-foreground flex items-center gap-1">
                    Select Portal →
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground font-mono">
                  ?mode={id}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
