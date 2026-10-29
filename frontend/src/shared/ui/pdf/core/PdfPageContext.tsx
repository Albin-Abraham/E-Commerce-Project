/**
 * PdfPageContext
 *
 * SOLID — Single Responsibility: owns only page geometry resolution.
 * GoF   — Strategy: page size/orientation strategy resolves dimensions.
 *         Flyweight: PAGE_SIZES is shared across all page instances.
 */
import React, { createContext, useContext, useMemo } from "react";

import type { PdfTheme } from "../theme/pdf.theme";
import {
  type Orientation,
  PDF_PAGE_SIZES,
  PDF_SPACING,
  type PageSize,
  type SpacingScale,
} from "../theme/pdf.tokens";
import { usePdfTheme } from "./PdfThemeContext";

// ── Page geometry interface ────────────────────────────────────────────────

export interface PdfPageGeometry {
  size: PageSize;
  orientation: Orientation;
  /** Full page width in pt */
  width: number;
  /** Full page height in pt */
  height: number;
  /** Width minus left/right margins — use this for all content sizing */
  contentWidth: number;
  /** Height minus top/bottom margins, header, footer */
  contentHeight: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  headerHeight: number;
  footerHeight: number;
}

// ── Margin resolver (Strategy pattern) ────────────────────────────────────

function resolveMargin(
  scale: SpacingScale | Partial<PdfPageGeometry["margin"]> | undefined,
  theme: PdfTheme
): PdfPageGeometry["margin"] {
  if (!scale) {
    const d = theme.spacing.md;
    return { top: d, right: d, bottom: d, left: d };
  }
  if (typeof scale === "string") {
    const d = theme.spacing[scale as SpacingScale] ?? PDF_SPACING.md;
    return { top: d, right: d, bottom: d, left: d };
  }
  const d = theme.spacing.md;
  return {
    top: scale.top ?? d,
    right: scale.right ?? d,
    bottom: scale.bottom ?? d,
    left: scale.left ?? d,
  };
}

// ── Context ────────────────────────────────────────────────────────────────

const PdfPageContext = createContext<PdfPageGeometry>({
  size: "A4",
  orientation: "portrait",
  width: 595,
  height: 842,
  contentWidth: 595 - 32,
  contentHeight: 842 - 32,
  margin: { top: 16, right: 16, bottom: 16, left: 16 },
  headerHeight: 0,
  footerHeight: 0,
});

export interface PdfPageProviderProps {
  size?: PageSize;
  orientation?: Orientation;
  margin?: SpacingScale | Partial<PdfPageGeometry["margin"]>;
  headerHeight?: number;
  footerHeight?: number;
  children: React.ReactNode;
}

export const PdfPageProvider: React.FC<PdfPageProviderProps> = ({
  size = "A4",
  orientation = "portrait",
  margin,
  headerHeight = 0,
  footerHeight = 0,
  children,
}) => {
  const theme = usePdfTheme();

  const geometry = useMemo<PdfPageGeometry>(() => {
    const [w, h] = PDF_PAGE_SIZES[size][orientation];
    const mg = resolveMargin(margin, theme);
    return {
      size,
      orientation,
      width: w,
      height: h,
      contentWidth: w - mg.left - mg.right,
      contentHeight: h - mg.top - mg.bottom - headerHeight - footerHeight,
      margin: mg,
      headerHeight,
      footerHeight,
    };
  }, [size, orientation, margin, headerHeight, footerHeight, theme]);

  return (
    <PdfPageContext.Provider value={geometry}>
      {children}
    </PdfPageContext.Provider>
  );
};

/** All layout primitives (Grid, Table) read from this to compute exact widths. */
export const usePdfPage = (): PdfPageGeometry => useContext(PdfPageContext);
