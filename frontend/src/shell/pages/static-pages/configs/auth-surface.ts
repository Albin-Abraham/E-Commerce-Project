import React from "react";
import { motion } from "framer-motion";
import { FieldSkeleton } from "@ui/form/components/FieldSkeleton";
import type { ContainerDefinition, ShellNode } from "@ui/form/types/layout";
import type { PresentationDefinition } from "@ui/form/types/presentation";
import type { SurfaceDefinition } from "@ui/form/types/surface";

import { AuthBrandPanel } from "../components/auth-brand/AuthBrandPanel";
import { CompactBrandBanner } from "../components/auth-brand/CompactBrandBanner";
import type { AuthTranslator } from "./auth-logical";
import type { AuthModeToggleProps, AuthPersona } from "./auth-types";

// ── LAYER 5: PRESENTATION SCHEMA ────────────────────────────────────────────

export function buildAuthPresentation(persona: AuthPersona = "customer"): PresentationDefinition {
  if (persona === "staff") {
    return {
      style: {
        classNames: {
          root: "w-full max-w-6xl bg-surface border border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden ring-1 ring-slate-700/30",
          actionContainer: "flex-col w-full !gap-2 !mt-2 !pt-0.5 !border-t-0",
          submitButton:
            "inline-flex items-center justify-center font-bold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none w-full py-2.5 sm:py-3 text-sm rounded-xl bg-slate-800 hover:bg-slate-700 shadow-md shadow-slate-900/30 text-white",
        },
      },
    };
  }

  if (persona === "partner") {
    return {
      style: {
        classNames: {
          root: "w-full max-w-6xl bg-surface border border-emerald-500/30 shadow-premium rounded-3xl overflow-hidden ring-1 ring-emerald-500/20",
          actionContainer: "flex-col w-full !gap-2 !mt-2 !pt-0.5 !border-t-0",
          submitButton:
            "inline-flex items-center justify-center font-bold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none w-full py-2.5 sm:py-3 text-sm rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-md shadow-emerald-500/25 text-white",
        },
      },
    };
  }

  return {
    style: {
      classNames: {
        root: "w-full max-w-6xl bg-surface border border-indigo-500/25 shadow-premium rounded-3xl overflow-hidden ring-1 ring-indigo-500/15",
        actionContainer: "flex-col w-full !gap-2 !mt-2 !pt-0.5 !border-t-0",
        submitButton:
          "inline-flex items-center justify-center font-bold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none w-full py-2.5 sm:py-3 text-sm rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 hover:scale-[1.01] active:scale-[0.99] text-primary-foreground",
      },
    },
  };
}

// ── LAYER 3: SURFACE SCHEMA ─────────────────────────────────────────────────

export function buildAuthSurface(
  mode: "login" | "signup" | "forgot-password",
  toggleProps: AuthModeToggleProps,
  t?: AuthTranslator
): SurfaceDefinition {
  const signInLabel = t ? t("common.signInTab") : "Sign In";
  const signUpLabel = t ? t("common.signUpTab") : "Sign Up";
  const currentPersona = toggleProps.persona || "customer";

  const brandPanelComponent = () =>
    React.createElement(AuthBrandPanel, { persona: currentPersona });

  const compactBrandComponent = () =>
    React.createElement(CompactBrandBanner, { persona: currentPersona });

  const shell: ShellNode[] = [
    {
      node: "layout",
      type: "grid",
      config: { columns: 12 },
      className:
        currentPersona === "staff"
          ? "w-full max-w-6xl bg-slate-950/95 border border-slate-700/70 shadow-2xl rounded-3xl overflow-hidden flex-shrink-0 z-card z-card--glass ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-500"
          : currentPersona === "partner"
          ? "w-full max-w-6xl bg-surface/95 border border-emerald-500/40 shadow-2xl rounded-3xl overflow-hidden flex-shrink-0 z-card z-card--glass ring-1 ring-emerald-500/15 animate-in fade-in zoom-in-95 duration-500"
          : "w-full max-w-6xl bg-surface/95 border border-indigo-500/35 shadow-2xl rounded-3xl overflow-hidden flex-shrink-0 z-card z-card--glass ring-1 ring-indigo-500/15 animate-in fade-in zoom-in-95 duration-500",
      children: [
        // ── Left Column: Brand Experience (Strict 50% on lg: 1024px+) ──────────
        {
          node: "surface",
          type: "card",
          colSpan: { base: 12, lg: 6 },
          config: { elevation: "none" },
          className:
            "hidden lg:flex relative h-full min-h-[640px] overflow-hidden animate-slide-left motion-reduce:animate-none bg-surface-raised/40 border-r border-border/40",
          children: [
            {
              node: "content",
              type: "component",
              component: brandPanelComponent,
            },
          ],
        } as ShellNode,

        // ── Right Column: Clean Authentication Form (Strict 50% on lg: 1024px+) ─
        {
          node: "surface",
          type: "card",
          colSpan: { base: 12, lg: 6 },
          config: { elevation: "none" },
          className:
            "relative flex flex-col p-5 sm:p-8 lg:p-10 justify-center animate-slide-right motion-reduce:animate-none bg-surface overflow-y-auto overflow-x-hidden min-h-[640px]",
          children: [
            {
              node: "layout",
              type: "box",
              className: "w-full max-w-md mx-auto flex flex-col justify-center",
              children: [
                // Mobile/Tablet Compact Brand Banner (hidden on lg+)
                {
                  node: "content",
                  type: "component",
                  component: compactBrandComponent,
                },

                // Sub-Mode Switcher (Sign In vs Sign Up / Onboarding) — Hidden for Staff
                ...(toggleProps.mode !== "forgot-password" && currentPersona !== "staff"
                  ? [
                      {
                        node: "layout",
                        type: "box",
                        className: "w-full border-b border-border/60 mb-4 pb-1 max-w-sm mx-auto",
                        children: [
                          {
                            node: "content",
                            type: "segmented",
                            className: "w-full max-w-sm mx-auto",
                            options: [
                              { label: signInLabel, value: "login" },
                              {
                                label:
                                  currentPersona === "partner"
                                    ? "Vendor Onboarding"
                                    : signUpLabel,
                                value: "signup",
                              },
                            ],
                            value: toggleProps.mode,
                            onChange: (value: any) =>
                              toggleProps.onModeChange(
                                value as AuthModeToggleProps["mode"]
                              ),
                          },
                        ],
                      } as ShellNode,
                    ]
                  : []),

                // Form or Skeleton Loader during swap
                toggleProps.isSwapping
                  ? {
                      node: "content",
                      type: "component",
                      component: () =>
                        React.createElement(
                          motion.div,
                          {
                            className: "mt-4 w-full",
                            initial: { opacity: 0, y: 10 },
                            animate: { opacity: 1, y: 0 },
                            transition: { duration: 0.2 },
                          },
                          React.createElement(FieldSkeleton, {
                            type: "card",
                            rows: mode === "login" ? 4 : 2,
                          })
                        ),
                    }
                  : {
                      node: "content",
                      type: "form-standard",
                    },
              ],
            },
          ],
        },
      ],
    },
  ];

  const containers: ContainerDefinition[] = [
    {
      id: "auth-split",
      type: "split",
      config: {
        splitRatio: "50/50",
        leftContent: {
          type: "component",
          component: brandPanelComponent,
        },
        rightContent: {
          type: "section-ref",
          sectionId: mode === "login" ? "login-fields" : "signup-fields",
          className: "w-full max-w-md mx-auto flex-1 flex flex-col",
        },
      },
    },
  ];

  return {
    ui: {
      target: "screen",
      density: "compact",
      shell,
      containers,
    },
  };
}
