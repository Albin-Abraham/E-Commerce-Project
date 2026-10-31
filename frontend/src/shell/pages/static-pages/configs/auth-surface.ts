import React from "react";
import { motion } from "framer-motion";
import { FieldSkeleton } from "@ui/form/components/FieldSkeleton";
import type { ContainerDefinition, ShellNode } from "@ui/form/types/layout";
import type { PresentationDefinition } from "@ui/form/types/presentation";
import type { SurfaceDefinition } from "@ui/form/types/surface";

import { AuthBrandPanel } from "../components/AuthBrandPanel";
import type { AuthTranslator } from "./auth-logical";
import type { AuthModeToggleProps } from "./auth-types";

// ── LAYER 5: PRESENTATION SCHEMA ────────────────────────────────────────────

export function buildAuthPresentation(): PresentationDefinition {
  return {
    style: {
      classNames: {
        root: "w-full max-w-6xl bg-surface border border-border/40 shadow-premium rounded-3xl overflow-hidden",
        actionContainer: "flex-col w-full !gap-2 !mt-2 !pt-0.5 !border-t-0",
        submitButton:
          "inline-flex items-center justify-center font-bold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none w-full py-2 sm:py-2.5 text-sm rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 hover:scale-[1.01] active:scale-[0.99] text-primary-foreground",
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

  const shell: ShellNode[] = [
    {
      node: "layout",
      type: "grid",
      config: { columns: 12 },
      className:
        "w-full max-w-6xl bg-surface border border-border/50 shadow-premium rounded-3xl overflow-hidden flex-shrink-0 z-card z-card--glass animate-in fade-in zoom-in-95 duration-700",
      children: [
        {
          node: "surface",
          type: "card",
          colSpan: toggleProps.mode === "signup"
            ? { base: 12, lg: 4 }
            : { base: 12, md: 6 },
          config: { elevation: "none" },
          className: toggleProps.mode === "signup"
            ? "hidden lg:block relative h-full min-h-[460px] overflow-hidden animate-slide-left motion-reduce:animate-none bg-surface-raised/40"
            : "hidden md:block relative h-full min-h-[460px] overflow-hidden animate-slide-left motion-reduce:animate-none bg-surface-raised/40",
          children: [
            {
              node: "content",
              type: "component",
              component: AuthBrandPanel,
            },
          ],
        } as ShellNode,
        {
          node: "surface",
          type: "card",
          colSpan: toggleProps.mode === "signup"
            ? { base: 12, lg: 8 }
            : { base: 12, md: 6 },
          config: { elevation: "none" },
          className:
            "relative flex flex-col p-3.5 sm:p-4 lg:p-5 justify-center animate-slide-right motion-reduce:animate-none bg-surface overflow-y-auto overflow-x-hidden",
          children: [
            {
              node: "layout",
              type: "box",
              className: `w-full ${toggleProps.mode === "signup" ? "max-w-2xl" : "max-w-sm"} mx-auto flex flex-col justify-center`,
              children: [
                ...(toggleProps.mode !== "forgot-password"
                  ? [
                      {
                        node: "layout",
                        type: "box",
                        className: `w-full border-b border-border/60 mb-1.5 pb-1 max-w-sm mx-auto`,
                        children: [
                          {
                            node: "content",
                            type: "segmented",
                            className: "w-full max-w-sm mx-auto",
                            options: [
                              { label: signInLabel, value: "login" },
                              { label: signUpLabel, value: "signup" },
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
                toggleProps.isSwapping
                  ? {
                      node: "content",
                      type: "component",
                      component: () => React.createElement(
                        motion.div,
                        { 
                          className: "mt-4 w-full",
                          initial: { opacity: 0, y: 10 },
                          animate: { opacity: 1, y: 0 },
                          transition: { duration: 0.3 }
                        },
                        React.createElement(FieldSkeleton, { type: "card", rows: mode === "login" ? 4 : 2 })
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
        topContent: {
          type: "segmented",
          options: [
            { label: signInLabel, value: "login" },
            { label: signUpLabel, value: "signup" },
          ],
          value: toggleProps.mode,
          onChange: (value: any) =>
            toggleProps.onModeChange(value as AuthModeToggleProps["mode"]),
        },
        leftContent: {
          type: "component",
          component: AuthBrandPanel,
        },
        rightContent: {
          type: "section-ref",
          sectionId: mode === "login" ? "login-fields" : "signup-fields",
          className: "w-full max-w-[360px] mx-auto flex-1 flex flex-col",
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
