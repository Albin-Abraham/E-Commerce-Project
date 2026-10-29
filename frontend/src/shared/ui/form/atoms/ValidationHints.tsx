import React from "react";

import { Zenith } from "@shared/theme";

interface ValidationHintsProps {
  hints?: string[];
}

export const ValidationHints: React.FC<ValidationHintsProps> = ({ hints }) => {
  if (!hints || hints.length === 0) return null;

  return (
    <div className="mt-[var(--space-2)] flex flex-col gap-[var(--space-1)]">
      {hints.map((hint, idx) => (
        <div
          key={idx}
          className="flex items-center gap-[var(--space-2)] opacity-60"
        >
          <div className="w-1 h-1 rounded-full bg-foreground/30"></div>
          <span
            className={
              Zenith.text("body") + " font-medium tracking-tight text-xs"
            }
          >
            {hint}
          </span>
        </div>
      ))}
    </div>
  );
};
