/**
 * PdfGrid — N-column grid layout
 *
 * SOLID — Single Responsibility: grid geometry only.
 *         Open/Closed: span system extends layout without modifying PdfGrid.
 * GoF   — Composite: renders PdfColNode children.
 *         Decorator: injects computed `width` and updates PdfLayoutProvider.
 *
 * Yoga-layout has no CSS Grid. We implement it with:
 *   colWidth = (contentWidth - totalGap) / columns
 *   child width = colWidth * span + gapPt * (span - 1)
 */
import React from "react";

import { View } from "@react-pdf/renderer";

import { PdfLayoutProvider, usePdfLayout } from "../core/PdfLayoutContext";
import { usePdfPage } from "../core/PdfPageContext";
import { usePdfTheme } from "../core/PdfThemeContext";
import type { SpacingScale } from "../theme/pdf.tokens";

interface PdfGridProps {
  columns: 2 | 3 | 4 | 6 | 12;
  gap?: SpacingScale;
  children: React.ReactNode;
}

export const PdfGrid: React.FC<PdfGridProps> = ({
  columns,
  gap = "md",
  children,
}) => {
  const theme = usePdfTheme();
  const page = usePdfPage();
  const layout = usePdfLayout();

  // Consume available width from layout context (resilient to nesting), fall back to page content width
  const currentAvailableWidth = layout
    ? layout.availableWidth
    : page.contentWidth;

  const gapPt = theme.spacing[gap];
  const totalGap = gapPt * (columns - 1);
  const colUnit = (currentAvailableWidth - totalGap) / columns;

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: gapPt }}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        const span: number = (child.props as any).span ?? 1;
        const clampedSpan = Math.min(span, columns);
        const childWidth = colUnit * clampedSpan + gapPt * (clampedSpan - 1);

        // Decorator: inject computed width, and wrap in layout provider for nested children sizing
        return (
          <PdfLayoutProvider availableWidth={childWidth}>
            {React.cloneElement(child, {
              style: {
                width: childWidth,
                ...((child.props as any).style ?? {}),
              },
            } as any)}
          </PdfLayoutProvider>
        );
      })}
    </View>
  );
};
