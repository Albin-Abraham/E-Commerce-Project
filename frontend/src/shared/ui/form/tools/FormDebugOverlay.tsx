import React from "react";

interface FormDebugOverlayProps {
  enabled: boolean;
}

/**
 * FormDebugOverlay - A transparency layer that visualizes form structure.
 * Helps developers inspect grid layouts, field boundaries, and spacing.
 */
export const FormDebugOverlay: React.FC<FormDebugOverlayProps> = ({
  enabled,
}) => {
  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[var(--z-system)] overflow-hidden">
      {/* Grid Inspector Layer */}
      <div className="absolute inset-x-0 h-full max-w-[1200px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-12 gap-4 h-full">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-blue-400/5 border-x border-blue-500/10 h-full"
            />
          ))}
        </div>
      </div>

      {/* Logic Overlay Label */}
      <div className="absolute top-4 right-4 bg-black/80 text-white text-[10px] px-2 py-1 rounded font-mono uppercase tracking-widest border border-white/20">
        Debug Mode: Active
      </div>
    </div>
  );
};

/**
 * FieldDebugWrapper - Wraps individual fields to show their boundaries and IDs.
 */
export const FieldDebugWrapper: React.FC<{
  children: React.ReactNode;
  id: string;
  type: string;
  enabled?: boolean;
}> = ({ children, id, type, enabled }) => {
  if (!enabled) return <>{children}</>;

  return (
    <div className="relative group/debug">
      <div className="absolute -inset-1 border border-dashed border-magenta-500/20 rounded pointer-events-none group-hover/debug:border-magenta-500/50 transition-colors" />
      <div className="absolute -top-3 left-2 bg-magenta-500 text-white text-[9px] px-1 rounded opacity-0 group-hover/debug:opacity-100 transition-opacity whitespace-nowrap z-50">
        {id} | {type}
      </div>
      {children}
    </div>
  );
};
