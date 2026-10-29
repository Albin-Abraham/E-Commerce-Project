import type { PresentationDefinition } from "@ui/form/types/presentation";
import type { SurfaceDefinition } from "@ui/form/types/surface";

// ── LAYER 5: PRESENTATION SCHEMA ────────────────────────────────────────────

export function buildBranchPresentation(): PresentationDefinition {
  return {
    style: {
      classNames: {
        root: "glass shadow-premium rounded-3xl", // Premium container aesthetic
      },
    },
  };
}

// ── LAYER 3: SURFACE SCHEMA ─────────────────────────────────────────────────

export function buildBranchSurface(): SurfaceDefinition {
  return {
    ui: {
      target: "screen",
      density: "spacious",
      width: "contained",
      layoutMode: "dashboard",
      hideHeader: true,
      wizard: {
        enabled: true,
        stepperType: "sidebar",
      },
    } as any, // layoutMode extension
  };
}
