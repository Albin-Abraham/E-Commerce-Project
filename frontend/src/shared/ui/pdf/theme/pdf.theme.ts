/**
 * PDF Theme Definition
 *
 * SOLID — Open/Closed: consumers extend via Partial<PdfTheme>, never mutate the default.
 * GoF   — Prototype: defaultPdfTheme is the prototype; deepMerge produces derived themes.
 */
import {
  type BorderScale,
  type FontSizeScale,
  type LineHeightScale,
  type OpacityScale,
  PDF_BORDER_WIDTH,
  PDF_FONT_SIZE,
  PDF_LINE_HEIGHT,
  PDF_OPACITY,
  PDF_RADIUS,
  PDF_SPACING,
  type RadiusScale,
  type SpacingScale,
} from "./pdf.tokens";

// ── Color palette ──────────────────────────────────────────────────────────

export interface PdfColorScale {
  primary: string;
  secondary: string;
  muted: string;
  border: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  danger: string;
  success: string;
  warning: string;
  info: string;
  white: string;
  black: string;
}

// ── Font face names ────────────────────────────────────────────────────────

export interface PdfFontScale {
  body: string;
  heading: string;
  mono: string;
}

// ── Full theme shape ───────────────────────────────────────────────────────

export interface PdfTheme {
  colors: PdfColorScale;
  fonts: PdfFontScale;
  spacing: Record<SpacingScale, number>;
  fontSize: Record<FontSizeScale, number>;
  lineHeight: Record<LineHeightScale, number>;
  borderWidth: Record<BorderScale, number>;
  radius: Record<RadiusScale, number>;
  opacity: Record<OpacityScale, number>;
}

// ── ZenOS default theme ────────────────────────────────────────────────────

export const defaultPdfTheme: PdfTheme = {
  colors: {
    primary: "#2563EB",
    secondary: "#7C3AED",
    muted: "#6B7280",
    border: "#E5E7EB",
    background: "#FFFFFF",
    surface: "#F9FAFB",
    text: "#111827",
    textMuted: "#6B7280",
    danger: "#EF4444",
    success: "#22C55E",
    warning: "#F59E0B",
    info: "#3B82F6",
    white: "#FFFFFF",
    black: "#000000",
  },
  fonts: { body: "Inter", heading: "Inter", mono: "Courier" },
  spacing: PDF_SPACING,
  fontSize: PDF_FONT_SIZE,
  lineHeight: PDF_LINE_HEIGHT,
  borderWidth: PDF_BORDER_WIDTH,
  radius: PDF_RADIUS,
  opacity: PDF_OPACITY,
};

// ── Deep merge utility (Prototype pattern) ─────────────────────────────────

export function mergePdfTheme(
  base: PdfTheme,
  overrides?: Partial<PdfTheme>
): PdfTheme {
  if (!overrides) return base;
  return {
    colors: { ...base.colors, ...(overrides.colors ?? {}) },
    fonts: { ...base.fonts, ...(overrides.fonts ?? {}) },
    spacing: { ...base.spacing, ...(overrides.spacing ?? {}) },
    fontSize: { ...base.fontSize, ...(overrides.fontSize ?? {}) },
    lineHeight: { ...base.lineHeight, ...(overrides.lineHeight ?? {}) },
    borderWidth: { ...base.borderWidth, ...(overrides.borderWidth ?? {}) },
    radius: { ...base.radius, ...(overrides.radius ?? {}) },
    opacity: { ...base.opacity, ...(overrides.opacity ?? {}) },
  };
}
