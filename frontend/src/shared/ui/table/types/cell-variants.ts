import type { ReactNode } from "react";

/**
 * Visual cell archetype supported out of the box by ZenithTable
 */
export type CellVariant =
  | "default"     // Standard typography with semantic truncation
  | "numeric"     // Right-aligned, font-mono tabular figures with currency/percentage formatting
  | "badge"       // Status pill / chip with semantic intent (success, warning, error, info)
  | "status-dot"  // Pulsing/solid LED dot indicator with label
  | "identity"    // Dual-line avatar/icon + primary title + secondary muted subtitle
  | "code"        // Monospace highlighted pill (e.g. SKUs, API keys, codes)
  | "copyable"    // Displays value with hover copy button and toast feedback
  | "progress"    // Inline progress bar or capacity gauge with percentage
  | "truncate"    // Multi-line or single-line clamping with hover tooltip
  | "action";     // Action button matrix

export type CellIntent =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type CellAlign = "left" | "center" | "right";

export type CellDensity = "compact" | "normal" | "comfortable";

/**
 * Vertical border styling applied to table cells and columns
 */
export type CellBorder =
  | "none"         // No vertical border
  | "right"        // Subtle 1px vertical right border
  | "left"         // Subtle 1px vertical left border
  | "both"         // Left and right vertical borders
  | "prominent"    // High-contrast 2px vertical partition divider
  | "dashed"       // Dashed vertical divider for draft / tentative metrics
  | "sticky-edge"; // Glowing drop-shadow gradient along pinned column boundaries

export interface CellNumericFormat {
  format?: "currency" | "percent" | "number" | "compact";
  currency?: string; // e.g. "USD", "EUR", "AED"
  decimals?: number;
  showSign?: boolean; // e.g. "+12.4%" vs "-4.2%"
}

export interface CellBadgeConfig {
  label?: string;
  intent: CellIntent;
  icon?: ReactNode;
}
