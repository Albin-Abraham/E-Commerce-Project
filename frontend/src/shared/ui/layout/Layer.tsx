import * as React from "react";

import { Slot } from "@radix-ui/react-slot";

import { tokens } from "@shared/theme";

import { cn } from "@libs/utils";

import {
  type ModifierProps,
  extractModifiers,
  getModifierClasses,
} from "./modifiers";

type ZLayer = keyof typeof tokens.zIndices;

const positionClasses = {
  static: "static",
  relative: "relative",
  absolute: "absolute",
  fixed: "fixed",
  sticky: "sticky",
} as const;

export interface LayerProps
  extends React.HTMLAttributes<HTMLDivElement>, ModifierProps {
  /** Semantic z-index level from the design token scale. */
  level?: ZLayer;
  /** CSS position. */
  position?: keyof typeof positionClasses;
  /** Shorthand for `absolute inset-0`. */
  inset?: boolean;
  /** Creates a new stacking context via `isolation: isolate`. */
  isolate?: boolean;
  /** Render as child (Radix Slot pattern). */
  asChild?: boolean;
}

/**
 * Layer: A z-index-aware positioning primitive.
 *
 * Wraps Box semantics with semantic z-index tokens and stacking context
 * management. Use this instead of hardcoded `z-[9999]` or `zIndex: 9999`.
 *
 * @example
 * // Semantic overlay
 * <Layer level="overlay" position="fixed" inset>
 *   <Modal />
 * </Layer>
 *
 * @example
 * // Stacking context isolate
 * <Layer level="modal" position="relative" isolate>
 *   <Dialog />
 * </Layer>
 *
 * @example
 * // Inline edit hover icon
 * <Layer level="overlap" position="absolute" className="right-3 top-1/2 -translate-y-1/2">
 *   <EditIcon />
 * </Layer>
 */
const Layer = React.forwardRef<HTMLDivElement, LayerProps>(
  (
    {
      className,
      level,
      position,
      inset = false,
      isolate = false,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "div";
    const { modifiers, rest } = extractModifiers(props);
    const modifierClasses = getModifierClasses(modifiers);

    const zIndex = level ? `z-[${tokens.zIndices[level]}]` : "";
    const pos = position ? positionClasses[position] : "";
    const insetClass = inset && position === "absolute" ? "inset-0" : "";
    const isolateClass = isolate ? "isolation-isolate" : "";

    return (
      <Comp
        ref={ref}
        className={cn(
          zIndex,
          pos,
          insetClass,
          isolateClass,
          modifierClasses,
          className
        )}
        {...rest}
      />
    );
  }
);
Layer.displayName = "Layer";

export { Layer };
