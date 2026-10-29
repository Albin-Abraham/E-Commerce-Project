/**
 * ── NotificationSurface ───────────────────────────────────────────────────────
 *
 * Toast notification stack. Lives outside layout geometry — always floating,
 * never affects sidebar/drawer/content dimensions.
 *
 * Auto-dismisses based on surface.dismissal.timeoutMs (default 4000ms).
 * Stacks vertically — newest on top.
 */
import React, { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

import { useSurfaceManager } from "../../view-controller/surface/SurfaceManager";
import type { Surface } from "../../view-controller/surface/surface.types";
import { useSurfaceActions } from "../../view-controller/surface/useSurface";

export const NotificationSurface: React.FC = () => {
  const surfaces = useSurfaceManager((s) => s.surfaces);

  const notifications = useMemo(
    () =>
      Object.values(surfaces)
        .filter(
          (surface) =>
            surface.kind === "notification" && surface.lifecycle !== "closed"
        )
        .reverse(), // Newest first in the stack
    [surfaces]
  );

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((surface) => (
          <Toast key={surface.id} surface={surface} />
        ))}
      </AnimatePresence>
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────────────────────

const VARIANTS: Record<string, { icon: React.ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />,
    className: "border-emerald-500/20 bg-emerald-500/5",
  },
  error: {
    icon: <XCircle className="w-4 h-4 text-red-500 shrink-0" />,
    className: "border-red-500/20 bg-red-500/5",
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    className: "border-amber-500/20 bg-amber-500/5",
  },
  info: {
    icon: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
    className: "border-blue-500/20 bg-blue-500/5",
  },
};

const Toast: React.FC<{ surface: Surface }> = ({ surface }) => {
  const { close } = useSurfaceActions();
  const variant = (surface.payload?.variant as string) ?? "info";
  const message = (surface.payload?.message as string) ?? "";
  const timeoutMs = surface.dismissal.timeoutMs ?? 4000;
  const config = VARIANTS[variant] ?? VARIANTS.info;
  const isClosing = surface.lifecycle === "closing";

  // Auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => close(surface.id), timeoutMs);
    return () => clearTimeout(timer);
  }, [surface.id, timeoutMs, close]);

  return (
    <motion.div
      layout
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg bg-background ${config.className}`}
      initial={{ opacity: 0, x: 60, scale: 0.96 }}
      animate={isClosing ? { opacity: 0, x: 60 } : { opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
    >
      {config.icon}
      <p className="flex-1 text-sm text-foreground leading-snug">{message}</p>
      <button
        onClick={() => close(surface.id)}
        className="p-0.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};
