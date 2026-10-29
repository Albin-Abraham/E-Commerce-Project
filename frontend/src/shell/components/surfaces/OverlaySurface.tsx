/**
 * ── OverlaySurface ────────────────────────────────────────────────────────────
 *
 * Renders the overlay stack (dialogs, confirmations, command palette).
 * Blocking overlays dim the background. Non-blocking overlays sit above
 * content without dimming.
 *
 * Dismissal:
 *   - explicit-action  → only a button closes it
 *   - outside-click-or-escape → Escape key or backdrop click closes it
 *
 * Feature modules register overlay content via the Slot system:
 *   slotRegistry.register("overlay:confirmation", { ... })
 */
import React, { useEffect, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useSurfaceManager } from "../../view-controller/surface/SurfaceManager";
import type { Surface } from "../../view-controller/surface/surface.types";
import { useSurfaceActions } from "../../view-controller/surface/useSurface";
import { Slot } from "@core/slots";

export const OverlaySurface: React.FC = () => {
  const surfaces = useSurfaceManager((s) => s.surfaces);

  const overlays = useMemo(
    () =>
      Object.values(surfaces).filter(
        (surface) =>
          (surface.kind === "overlay" || surface.kind === "popover") &&
          surface.lifecycle !== "closed"
      ),
    [surfaces]
  );

  return (
    <AnimatePresence>
      {overlays.map((surface, index) => (
        <OverlayPanel key={surface.id} surface={surface} stackIndex={index} />
      ))}
    </AnimatePresence>
  );
};

// ── Individual overlay panel ──────────────────────────────────────────────────

const OverlayPanel: React.FC<{ surface: Surface; stackIndex: number }> = ({
  surface,
  stackIndex,
}) => {
  const { close, transition } = useSurfaceActions();
  const isBlocking = surface.interaction === "blocking";
  const isExplicitOnly = surface.dismissal.policy === "explicit-action";

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isExplicitOnly) {
        close(surface.id);
      }
    },
    [close, surface.id, isExplicitOnly]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const isClosing = surface.lifecycle === "closing";

  return (
    <>
      {/* Backdrop */}
      {isBlocking && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          style={{ zIndex: 40 + stackIndex * 10 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isClosing ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          onClick={() => !isExplicitOnly && close(surface.id)}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <motion.div
        role="dialog"
        aria-modal={isBlocking}
        aria-label={surface.type}
        className="fixed inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 41 + stackIndex * 10 }}
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={
          isClosing
            ? { opacity: 0, scale: 0.95, y: 8 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onAnimationComplete={() => {
          if (surface.lifecycle === "mounting") transition(surface.id, "open");
        }}
      >
        <div
          className="pointer-events-auto bg-background border border-border/30 shadow-2xl rounded-xl overflow-hidden min-w-[320px] max-w-lg w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Feature content via slot */}
          <Slot
            name={`overlay:${surface.type}`}
            fallback={
              <div className="p-6">
                <p className="text-sm font-semibold mb-1 capitalize">
                  {surface.type.replace(/-/g, " ")}
                </p>
                <p className="text-sm text-muted-foreground">
                  No content registered for overlay type:{" "}
                  <code className="text-xs">{surface.type}</code>
                </p>
                {!isExplicitOnly && (
                  <button
                    onClick={() => close(surface.id)}
                    className="mt-4 text-xs text-primary hover:underline"
                  >
                    Close
                  </button>
                )}
              </div>
            }
          />
        </div>
      </motion.div>
    </>
  );
};
