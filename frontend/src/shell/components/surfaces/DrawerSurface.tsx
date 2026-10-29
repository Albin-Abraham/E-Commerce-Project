/**
 * ── DrawerSurface ─────────────────────────────────────────────────────────────
 *
 * Renders all docked drawer surfaces for a given side.
 * Reads from SurfaceManager — feature modules register content via
 * the Slot system or by directly rendering into a named slot.
 *
 * Geometry: driven by LayoutCoordinator CSS variables on the root element.
 * Animation: Framer Motion slide in/out keyed to surface lifecycle.
 */
import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useSurfaceManager } from "../../view-controller/surface/SurfaceManager";
import type { Surface, SurfaceGeometry } from "../../view-controller/surface/surface.types";
import { useSurfaceActions } from "../../view-controller/surface/useSurface";
import { Slot } from "@core/slots";

interface DrawerSurfaceProps {
  side: "left" | "right";
}

const SLIDE = {
  left: { hidden: { x: "-100%" }, visible: { x: 0 } },
  right: { hidden: { x: "100%" }, visible: { x: 0 } },
};

export const DrawerSurface: React.FC<DrawerSurfaceProps> = ({ side }) => {
  const surfaces = useSurfaceManager((s) => s.surfaces);

  const drawers = useMemo(
    () =>
      Object.values(surfaces).filter(
        (surface) =>
          surface.kind === "drawer" &&
          surface.presentation === "docked" &&
          surface.geometry?.side === side &&
          surface.lifecycle !== "closed"
      ),
    [surfaces, side]
  );

  return (
    <AnimatePresence>
      {drawers.map((surface) => (
        <DrawerPanel key={surface.id} surface={surface} side={side} />
      ))}
    </AnimatePresence>
  );
};

// ── Individual drawer panel ───────────────────────────────────────────────────

const DrawerPanel: React.FC<{ surface: Surface; side: "left" | "right" }> = ({
  surface,
  side,
}) => {
  const { close, transition } = useSurfaceActions();
  const width = (surface.geometry as SurfaceGeometry)?.width ?? 420;

  return (
    <motion.aside
      key={surface.id}
      role="complementary"
      aria-label={surface.type}
      style={{ width: typeof width === "number" ? `${width}px` : width }}
      className="h-full bg-background border-l border-border/30 shadow-xl flex flex-col overflow-hidden z-30 shrink-0"
      initial={SLIDE[side].hidden}
      animate={
        surface.lifecycle === "closing"
          ? SLIDE[side].hidden
          : SLIDE[side].visible
      }
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onAnimationComplete={() => {
        if (surface.lifecycle === "mounting") transition(surface.id, "open");
      }}
    >
      {/* Drawer header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
        <span className="text-sm font-semibold text-foreground capitalize">
          {surface.type.replace(/-/g, " ")}
        </span>
        <button
          onClick={() => close(surface.id)}
          className="p-1 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Drawer content — feature modules fill this via slots */}
      <div className="flex-1 overflow-y-auto">
        <Slot
          name={`drawer:${surface.type}`}
          fallback={
            import.meta.env.DEV ? (
              <div className="p-6 text-sm text-muted-foreground">
                <p className="font-medium text-amber-500 mb-1">⚠ Unregistered drawer slot</p>
                <p>
                  No content registered for{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    drawer:{surface.type}
                  </code>
                </p>
                <p className="mt-2 text-xs opacity-60">
                  Register via{" "}
                  <code className="text-xs">slotRegistry.register(&quot;drawer:{surface.type}&quot;, ...)</code>
                </p>
              </div>
            ) : null
          }
        />
      </div>
    </motion.aside>
  );
};
