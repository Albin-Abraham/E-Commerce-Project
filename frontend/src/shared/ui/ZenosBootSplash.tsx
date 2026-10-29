import React from "react";

/**
 * ZenosBootSplash React Component (Matches index.html inline bootloader)
 *
 * High-fidelity corporate splash loader featuring a pulsing geometric gradient,
 * dynamic SVG spinning tech ring, and absolute zero layout-shifting during initial hydrations.
 */
export const ZenosBootSplash: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-50 font-sans z-[var(--z-system)] animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center mb-6">
        {/* Pulsing Ambient Glow */}
        <div className="absolute w-[120px] h-[120px] rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
        {/* Tech Ring */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 100 100"
          style={{ animation: "zenos-spin 3s linear infinite" }}
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#6366f1"
            strokeWidth="6"
            fill="none"
            strokeDasharray="283"
            strokeDashoffset="120"
            strokeLinecap="round"
          />
        </svg>
        {/* Center Logo Element */}
        <div className="absolute font-black text-lg -tracking-wider text-indigo-500 [text-shadow:0_0_12px_rgba(99,102,241,0.5)]">
          Z
        </div>
      </div>
      <h1 className="text-sm font-extrabold tracking-[0.25em] uppercase mb-2 opacity-90">
        ZenOS
      </h1>
      <p className="text-[11px] font-semibold tracking-wider text-white/50 animate-pulse">
        Initializing Platform Core...
      </p>

      <style>{`
        @keyframes zenos-spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
