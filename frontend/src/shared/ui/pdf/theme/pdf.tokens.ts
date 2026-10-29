/**
 * PDF Design Tokens
 *
 * All values are in PDF points (pt).
 * 1pt = 1/72 inch. A4 = 595 × 842 pt.
 *
 * SOLID — Single Responsibility: this file owns ONLY numeric constants.
 * GoF   — Flyweight: shared immutable token objects, never duplicated.
 */

export const PDF_SPACING = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
} as const;

export const PDF_FONT_SIZE = {
  xs: 8,
  sm: 9,
  md: 10,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 28,
  "4xl": 36,
} as const;

export const PDF_LINE_HEIGHT = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.8,
} as const;

export const PDF_BORDER_WIDTH = {
  none: 0,
  thin: 0.5,
  base: 1,
  thick: 2,
} as const;

export const PDF_RADIUS = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  full: 999,
} as const;

export const PDF_OPACITY = {
  full: 1,
  muted: 0.6,
  disabled: 0.3,
} as const;

/** Page dimensions in pt */
export const PDF_PAGE_SIZES = {
  A4: { portrait: [595, 842] as const, landscape: [842, 595] as const },
  Letter: { portrait: [612, 792] as const, landscape: [792, 612] as const },
  Legal: { portrait: [612, 1008] as const, landscape: [1008, 612] as const },
} as const;

// ── TypeScript scale types ─────────────────────────────────────────────────
export type SpacingScale = keyof typeof PDF_SPACING;
export type FontSizeScale = keyof typeof PDF_FONT_SIZE;
export type LineHeightScale = keyof typeof PDF_LINE_HEIGHT;
export type BorderScale = keyof typeof PDF_BORDER_WIDTH;
export type RadiusScale = keyof typeof PDF_RADIUS;
export type OpacityScale = keyof typeof PDF_OPACITY;
export type PageSize = keyof typeof PDF_PAGE_SIZES;
export type Orientation = "portrait" | "landscape";
