import React from "react";

import { tokens } from "@shared/theme";
import { cn } from "@ui/form/utils/form-styles";

import type { BottomActionSlotRendererProps } from "../types";

/**
 * Action Bar Slot Renderer.
 * Guarantees 48px touch ergonomics, responsive button arrangement, and safe insets.
 */
export function DetailBottomActions({
  children,
  className,
  sticky = false,
}: BottomActionSlotRendererProps) {
  const actionTokens = tokens.detail.actions;

  return (
    <div
      data-slot="bottom-action-slot"
      className={cn(
        actionTokens.base,
        sticky && actionTokens.sticky,
        className
      )}
    >
      {children}
    </div>
  );
}
