import type { PresentationDefinition } from "@ui/form/types/presentation";
import type { SurfaceDefinition } from "@ui/form/types/surface";

// ── LAYER 5: PRESENTATION SCHEMA ────────────────────────────────────────────

export function buildWorkspacePresentation(): PresentationDefinition {
  return {
    style: {
      classNames: {
        actionContainer: "!mt-6 !border-t-0 !pt-0",
        submitButton: [
          "w-full py-3.5 text-sm font-bold rounded-xl",
          "bg-gradient-to-r from-indigo-600 to-violet-600",
          "text-white shadow-lg shadow-indigo-500/30",
          "hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.01]",
          "active:scale-[0.99] transition-all duration-300",
          "disabled:opacity-40 disabled:pointer-events-none",
        ].join(" "),
      },
    },
  };
}

// ── LAYER 3: SURFACE SCHEMA ─────────────────────────────────────────────────

export function buildWorkspaceSurface(): SurfaceDefinition {
  return {
    ui: {
      target: "screen",
      density: "comfortable",
      shell: [
        {
          node: "surface",
          type: "card",
          className:
            "bg-surface text-foreground shadow-2xl rounded-2xl p-8 w-full border border-border/50",
          children: [{ node: "content", type: "form-standard" }],
        },
      ],
    },
  };
}
