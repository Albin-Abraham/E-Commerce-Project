/**
 * PdfRow — Horizontal flex layout primitive
 * PdfCol — Vertical stack layout primitive
 *
 * SOLID — Single Responsibility: layout only, no content logic.
 * GoF   — Bridge: separates layout abstraction (Row/Col) from yoga-layout impl.
 *         Composite: both accept PdfNode[] as children.
 *
 * NOTE: Align/justify props use ZenOS semantic names ("start", "between")
 *       and are mapped to yoga-layout strings internally — consumers
 *       never touch yoga strings.
 */
import React from "react";

import { View } from "@react-pdf/renderer";

import { usePdfTheme } from "../core/PdfThemeContext";
import type { PdfAlign, PdfJustify } from "../parser/pdf.schema.types";
import type { SpacingScale } from "../theme/pdf.tokens";

// ── Semantic → yoga-layout maps ────────────────────────────────────────────

const ALIGN_MAP: Record<PdfAlign, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
};

const JUSTIFY_MAP: Record<PdfJustify, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
};

// ── PdfRow ─────────────────────────────────────────────────────────────────

interface PdfRowProps {
  gap?: SpacingScale;
  align?: PdfAlign;
  justify?: PdfJustify;
  wrap?: boolean;
  flex?: number;
  children: React.ReactNode;
}

export const PdfRow: React.FC<PdfRowProps> = ({
  gap = "none",
  align = "start",
  justify = "start",
  wrap = false,
  flex,
  children,
}) => {
  const theme = usePdfTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        width: "100%",
        gap: theme.spacing[gap],
        alignItems: ALIGN_MAP[align] as any,
        justifyContent: JUSTIFY_MAP[justify] as any,
        flexWrap: wrap ? "wrap" : "nowrap",
        flex,
      }}
    >
      {children}
    </View>
  );
};

// ── PdfCol ─────────────────────────────────────────────────────────────────

interface PdfColProps {
  gap?: SpacingScale;
  align?: PdfAlign;
  flex?: number;
  span?: number; // grid column span (used by PdfGrid)
  width?: number; // explicit pt width (injected by PdfGrid)
  children: React.ReactNode;
}

export const PdfCol: React.FC<PdfColProps> = ({
  gap = "none",
  align = "start",
  flex,
  width,
  children,
}) => {
  const theme = usePdfTheme();
  return (
    <View
      style={{
        flexDirection: "column",
        gap: theme.spacing[gap],
        alignItems: ALIGN_MAP[align] as any,
        flex,
        width,
      }}
    >
      {children}
    </View>
  );
};
