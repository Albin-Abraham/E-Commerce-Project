/**
 * PDF Schema Types
 *
 * SOLID — Interface Segregation: each node type has its own interface.
 *         Liskov: every PdfNode is substitutable in PdfNodeRenderer.
 * GoF   — Composite: PdfNode tree mirrors the Composite pattern.
 */
import type { PdfColorScale, PdfTheme } from "../theme/pdf.theme";
import type { Orientation, PageSize, SpacingScale } from "../theme/pdf.tokens";
import type { BoxNodeDefinition } from "../runtime/document.runtime.types";

// ── Semantic alignment aliases (mirrors ZenOS Flex props) ─────────────────

export type PdfAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type PdfJustify =
  | "start"
  | "center"
  | "end"
  | "between"
  | "around"
  | "evenly";
export type PdfTextAlign = "left" | "center" | "right" | "justify";
export type PdfTextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body"
  | "caption"
  | "label"
  | "overline";
export type PdfTextTransform = "uppercase" | "capitalize" | "none";
export type PdfBorderStyle = "solid" | "dashed" | "dotted";

// ── Common layout modifiers ────────────────────────────────────────────────

export interface PdfLayoutModifiers {
  break?: boolean; // Force page break before rendering this element
  wrap?: boolean; // Allow element to wrap/split across page boundaries
}

// ── Table column definition ────────────────────────────────────────────────

export interface PdfTableColumn {
  key: string;
  label: string;
  flex?: number; // proportional width (default 1)
  width?: number; // fixed pt width (overrides flex)
  align?: PdfTextAlign;
  format?: "text" | "currency" | "date" | "number" | "percent" | "boolean" | "link";
  bold?: boolean;
  color?: keyof PdfColorScale;
}

// ── Leaf nodes ─────────────────────────────────────────────────────────────

export interface PdfTextNode extends PdfLayoutModifiers {
  type: "text";
  value: string | number;
  variant?: PdfTextVariant;
  bold?: boolean;
  italic?: boolean;
  color?: keyof PdfColorScale;
  align?: PdfTextAlign;
  lineHeight?: "tight" | "normal" | "relaxed";
  transform?: PdfTextTransform;
  letterSpacing?: number;
  numberOfLines?: number;
  flex?: number;
}

export interface PdfImageNode extends PdfLayoutModifiers {
  type: "image";
  src: string;
  width?: number;
  height?: number;
  fit?: "contain" | "cover";
  radius?: number;
}

export interface PdfDividerNode extends PdfLayoutModifiers {
  type: "divider";
  color?: keyof PdfColorScale;
  thickness?: number;
  my?: SpacingScale;
}

export interface PdfSpacerNode extends PdfLayoutModifiers {
  type: "spacer";
  height: number;
  flex?: number;
}

export interface PdfBadgeNode extends PdfLayoutModifiers {
  type: "badge";
  label: string;
  color?: keyof PdfColorScale;
  bg?: keyof PdfColorScale;
}

export interface PdfTableNode extends PdfLayoutModifiers {
  type: "table";
  columns: PdfTableColumn[];
  rows: Record<string, any>[];
  striped?: boolean;
  bordered?: boolean;
}

export interface PdfPageBreakNode {
  type: "page-break";
}

// ── Branch nodes (Composite pattern) ─────────────────────────────────────

export interface PdfRowNode extends PdfLayoutModifiers {
  type: "row";
  children: PdfNode[];
  gap?: SpacingScale;
  align?: PdfAlign;
  justify?: PdfJustify;
  flex?: number;
}

export interface PdfColNode extends PdfLayoutModifiers {
  type: "col";
  children: PdfNode[];
  gap?: SpacingScale;
  align?: PdfAlign;
  flex?: number;
  span?: number; // used inside PdfGrid
}

export interface PdfGridNode extends PdfLayoutModifiers {
  type: "grid";
  columns: 2 | 3 | 4 | 6 | 12;
  children: PdfNode[];
  gap?: SpacingScale;
}

export interface PdfBoxNode extends BoxNodeDefinition {
  children: PdfNode[];
}

// ── Discriminated union ────────────────────────────────────────────────────

export type PdfNode =
  | PdfTextNode
  | PdfImageNode
  | PdfDividerNode
  | PdfSpacerNode
  | PdfBadgeNode
  | PdfTableNode
  | PdfPageBreakNode
  | PdfRowNode
  | PdfColNode
  | PdfGridNode
  | PdfBoxNode;

// ── Section & Page & Document ─────────────────────────────────────────────

export interface PdfSectionDefinition {
  id?: string;
  title?: string;
  header?: PdfNode[];
  footer?: PdfNode[];
  nodes: PdfNode[];
  bordered?: boolean;
  keepTogether?: boolean;
  breakBefore?: boolean;
  breakAfter?: boolean;
}

export interface PdfPageDefinition {
  size?: PageSize;
  orientation?: Orientation;
  margin?:
    | SpacingScale
    | Partial<{ top: number; right: number; bottom: number; left: number }>;
  header?: PdfNode[];
  footer?: PdfNode[];
  sections: PdfSectionDefinition[];
  headerHeight?: number;
  footerHeight?: number;
  headerBorder?: boolean;
  footerBorder?: boolean;
}

export interface PdfDefinition {
  id: string;
  filename?: string;
  meta?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
  };
  theme?: Partial<PdfTheme>;
  pages: PdfPageDefinition[];
}
