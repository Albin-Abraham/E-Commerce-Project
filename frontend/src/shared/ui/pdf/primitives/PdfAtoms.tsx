/**
 * Remaining UI Primitives: Divider · Badge · Spacer
 *
 * GoF — Flyweight: all read theme from context, zero raw values.
 */
import React from "react";

import { Text, View } from "@react-pdf/renderer";

import { usePdfTheme } from "../core/PdfThemeContext";
import type { SpacingScale } from "../theme/pdf.tokens";
import type { PdfColorScale } from "../theme/pdf.theme";

// ── PdfDivider ─────────────────────────────────────────────────────────────

interface PdfDividerProps {
  color?: keyof PdfColorScale;
  thickness?: number;
  my?: SpacingScale;
}

export const PdfDivider: React.FC<PdfDividerProps> = ({
  color = "border",
  thickness,
  my = "sm",
}) => {
  const theme = usePdfTheme();
  return (
    <View
      style={{
        borderBottomWidth: thickness ?? theme.borderWidth.thin,
        borderColor: theme.colors[color],
        marginVertical: theme.spacing[my],
      }}
    />
  );
};

// ── PdfBadge ───────────────────────────────────────────────────────────────

interface PdfBadgeProps {
  label: string;
  color?: keyof PdfColorScale;
  bg?: keyof PdfColorScale;
}

export const PdfBadge: React.FC<PdfBadgeProps> = ({
  label,
  color = "text",
  bg = "surface",
}) => {
  const theme = usePdfTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors[bg],
        borderRadius: theme.radius.sm,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        alignSelf: "flex-start",
        borderWidth: theme.borderWidth.thin,
        borderColor: theme.colors.border,
      }}
    >
      <Text
        style={{
          fontSize: theme.fontSize.xs,
          fontFamily: theme.fonts.body,
          color: theme.colors[color],
        }}
      >
        {label}
      </Text>
    </View>
  );
};

// ── PdfSpacer ──────────────────────────────────────────────────────────────

interface PdfSpacerProps {
  height?: number;
  flex?: number;
}

export const PdfSpacer: React.FC<PdfSpacerProps> = ({ height, flex }) => (
  <View style={{ height, flex }} />
);
