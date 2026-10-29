/**
 * ZenOS Document Runtime (ZDE v2.0) — API & AST Types
 *
 * Formal separation between:
 * 1. Reserved Document Runtime API ($*)
 * 2. Semantic Document AST (Section, Box, Table, Text)
 * 3. Document Design System (DDS) & Pagination Rules
 */
import type { PdfColorScale } from "../theme/pdf.theme";
import type { Orientation, PageSize, SpacingScale } from "../theme/pdf.tokens";

// ── 1. The Reserved Runtime API ($*) ─────────────────────────────────────────

export interface DocumentRuntimeContext {
  /** Authoritative document-level metadata (Server/Host owned) */
  $document: {
    id: string;
    type: string;
    title: string;
    generated_at: string;
    timezone?: string;
    record_count: number;
    locale: string;
    direction: "ltr" | "rtl";
    template?: {
      id: string;
      version: string;
    };
  };

  /** Authoritative platform metadata (Core platform owned) */
  $system: {
    product: "ZenOS";
    version: string;
    environment: "production" | "staging" | "development";
    engine_version: "2.0";
  };

  /** Physical page runtime state (Renderer owned) */
  $page?: {
    number: number;
    total: number;
    is_first: boolean;
    is_last: boolean;
    width: number;
    height: number;
    content_width: number;
    content_height: number;
  };

  /** Current layout characteristics & density */
  $layout?: {
    page_size: PageSize;
    orientation: Orientation;
    density: "compact" | "default" | "comfortable";
    content_width: number;
    content_height: number;
    gap?: SpacingScale;
  };

  /** Logical section runtime state */
  $section?: {
    id: string;
    index: number;
    name: string;
    page_start: number;
    page_end: number;
    is_first: boolean;
    is_last: boolean;
  };

  /** Box container layout runtime context */
  $box?: {
    id?: string;
    width?: number;
    height?: number;
    content_width?: number;
    content_height?: number;
    index?: number;
  };

  /** Content operations context */
  $content?: {
    empty: boolean;
    count: number;
    index: number;
    first: boolean;
    last: boolean;
  };

  /** Repetition iteration context */
  $repeat?: {
    index: number;
    number: number;
    first: boolean;
    last: boolean;
    count: number;
  };

  /** Table row & cell matrix context */
  $table?: {
    row_index: number;
    column_index: number;
    is_first_row: boolean;
    is_last_row: boolean;
    is_even: boolean;
  };
}

// ── 2. Pagination & Break Behavior Rules ─────────────────────────────────────

export interface DocumentPaginationRules {
  /** Force a page break before this element */
  break_before?: boolean;
  /** Force a page break after this element */
  break_after?: boolean;
  /** Prohibit element from splitting across physical pages */
  keep_together?: boolean;
  /** Ensure element stays on same page as the immediate next element */
  keep_with_next?: boolean;
}

// ── 3. Semantic Layout AST ───────────────────────────────────────────────────

export type DocumentLayoutDirection = "horizontal" | "vertical" | "grid";

export interface BoxNodeDefinition extends DocumentPaginationRules {
  type: "box";
  id?: string;
  variant?:
    | "document-header"
    | "brand"
    | "card"
    | "summary-panel"
    | "metric-box"
    | "bordered"
    | "surface"
    | "custom";
  layout?: DocumentLayoutDirection;
  gap?: SpacingScale;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  padding?: SpacingScale;
  margin_bottom?: SpacingScale;
  bg?: keyof PdfColorScale;
  border_color?: keyof PdfColorScale;
  radius?: "none" | "sm" | "md" | "lg" | "full";
  flex?: number;
  width?: number | string;
  children: any[];
}
