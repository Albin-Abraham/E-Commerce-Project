/**
 * PdfText — Typography primitive
 *
 * SOLID — Single Responsibility: only renders text.
 * GoF   — Flyweight: theme/font values shared via context, not per-instance.
 */
import React from "react";

import { Text } from "@react-pdf/renderer";

import { usePdfTheme } from "../core/PdfThemeContext";
import type {
  PdfTextAlign,
  PdfTextTransform,
  PdfTextVariant,
} from "../parser/pdf.schema.types";
import type { PdfColorScale } from "../theme/pdf.theme";

const VARIANT_SIZE_MAP: Record<
  PdfTextVariant,
  "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
> = {
  overline: "xs",
  label: "sm",
  caption: "sm",
  body: "md",
  h4: "lg",
  h3: "xl",
  h2: "2xl",
  h1: "3xl",
};

const HEADING_VARIANTS: Set<PdfTextVariant> = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "overline",
]);

interface PdfTextProps {
  variant?: PdfTextVariant;
  bold?: boolean;
  italic?: boolean;
  color?: keyof PdfColorScale;
  align?: PdfTextAlign;
  lineHeight?: "tight" | "normal" | "relaxed";
  transform?: PdfTextTransform;
  letterSpacing?: number;
  /**
   * Advisory only — @react-pdf has no line-clamp primitive and wraps text
   * automatically, so this is not forwarded to the renderer.
   */
  numberOfLines?: number;
  flex?: number;
  children: string | number;
}

export const PdfText: React.FC<PdfTextProps> = ({
  variant = "body",
  bold,
  italic,
  color = "text",
  align = "left",
  lineHeight = "normal",
  transform = "none",
  letterSpacing,
  flex,
  children,
}) => {
  const theme = usePdfTheme();
  const isHeading = HEADING_VARIANTS.has(variant);

  return (
    <Text
      style={{
        fontSize: theme.fontSize[VARIANT_SIZE_MAP[variant]],
        fontFamily: isHeading || bold ? theme.fonts.heading : theme.fonts.body,
        fontStyle: italic ? "italic" : "normal",
        color: theme.colors[color],
        textAlign: align,
        lineHeight: theme.lineHeight[lineHeight],
        textTransform: transform === "none" ? undefined : transform,
        letterSpacing:
          letterSpacing ?? (variant === "overline" ? 1.5 : undefined),
        flex: flex,
      }}
      fixed={false}
    >
      {String(children)}
    </Text>
  );
};
