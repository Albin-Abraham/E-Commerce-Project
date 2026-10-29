// --- Primitive Renderer ---
// Replaces buildBoxModelClasses() with React elements using Box/Flex/Grid primitives.
// Kept buildBoxModelClasses() as @deprecated fallback for backward compat.
import React from "react";

import { Box } from "@ui/layout/Box";
import { Flex } from "@ui/layout/Flex";
import { Grid } from "@ui/layout/Grid";

import type { FormField } from "../fields";
import type {
  GridLayoutConfig,
  RuntimeLayoutConfig,
  SectionLayoutConfig,
} from "../types/layout";
import { getFieldSpan, getGridClassName } from "./row-layout";

/**
 * UTILITY: Layout Generator
 * Replaces React Layout Components with pure functional class generation.
 */

export interface LayoutContext {
  isMobile?: boolean;
}

export type CSSDisplay = "block" | "inline-block" | "inline" | "flex" | "grid";

export interface BoxModelProperties {
  type?: string;
  display?: CSSDisplay;
  padding?: string;
  margin?: string;
  width?: string;
  height?: string;
  direction?: "row" | "col" | "row-reverse" | "column-reverse";
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly";
  alignItems?: "start" | "end" | "center" | "baseline" | "stretch";
  gap?: string | number;
  background?: string;
  border?: string;
  shadow?: string;
  columns?: number;
}

/**
 * Universal Utility function to generate structured Box Model
 * CSS from a canonical configuration object.
 *
 * @deprecated Use `renderBoxModel()` instead, which returns React elements
 * using Box/Flex/Grid primitives. Keep only for semantic elements (`<nav>`,
 * `<form>`) where the wrapper element must be controlled by the caller.
 *
 * @example
 * renderBoxModel({ display: "flex", direction: "col", gap: "4" }, children)
 */
export function buildBoxModelClasses(props: BoxModelProperties = {}): string {
  const classes: string[] = [];

  // 1. Display Strategy
  if (props.display) classes.push(props.display);

  // 2. Flex/Grid Dynamics
  if (props.display === "flex") {
    const FLEX_DIRECTION_MAP: Record<string, string> = {
      row: "flex-row",
      col: "flex-col",
      "row-reverse": "flex-row-reverse",
      "col-reverse": "flex-col-reverse",
    };
    const JUSTIFY_MAP: Record<string, string> = {
      start: "justify-start",
      end: "justify-end",
      center: "justify-center",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    };
    const ITEMS_MAP: Record<string, string> = {
      start: "items-start",
      end: "items-end",
      center: "items-center",
      baseline: "items-baseline",
      stretch: "items-stretch",
    };

    if (props.direction && FLEX_DIRECTION_MAP[props.direction])
      classes.push(FLEX_DIRECTION_MAP[props.direction]);
    if (props.justify && JUSTIFY_MAP[props.justify])
      classes.push(JUSTIFY_MAP[props.justify]);
    if (props.alignItems && ITEMS_MAP[props.alignItems])
      classes.push(ITEMS_MAP[props.alignItems]);
  }

  if (props.display === "grid") {
    const GRID_COLS_MAP: Record<number, string> = {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
      7: "grid-cols-7",
      8: "grid-cols-8",
      9: "grid-cols-9",
      10: "grid-cols-10",
      11: "grid-cols-11",
      12: "grid-cols-12",
    };
    if (props.columns && GRID_COLS_MAP[props.columns]) {
      classes.push(GRID_COLS_MAP[props.columns]);
    } else {
      classes.push("grid-cols-12");
    }
  }

  // Common Gap (Flex & Grid)
  if (props.gap) {
    const gapStr = String(props.gap);
    const gapValue = gapStr.replace("gap-", "");
    const mapped = GAP_MAP[gapValue];
    if (mapped) {
      classes.push(mapped);
    } else if (
      gapValue.match(/^\[\w+--\w+\]$/) ||
      gapValue.startsWith("[var(")
    ) {
      classes.push(`gap-${gapValue}`);
    }
    // Unrecognized literal gaps (1-12) are already covered by GAP_MAP.
    // Dynamic raw numbers (higher than 12) are intentionally skipped to avoid JIT purge issues.
  }

  // 3. Dimensional Sizing
  if (props.width) classes.push(props.width);
  if (props.height) classes.push(props.height);

  // 4. Box Model (Spacing)
  if (props.padding) classes.push(props.padding);
  if (props.margin) classes.push(props.margin);

  // 5. Visual Overrides
  if (props.background) classes.push(props.background);
  if (props.border) classes.push(props.border);
  if (props.shadow) classes.push(props.shadow);

  return classes.filter(Boolean).join(" ");
}

/**
 * Returns the container classes for a specific layout configuration.
 * Adapts legacy SectionLayoutConfig to BoxModel parser.
 */
export function getLayoutContainerClasses(
  layout: SectionLayoutConfig = { type: "grid", columns: 12 }
): string {
  const config = parseLayoutConfig(layout);
  return buildBoxModelClasses(config);
}

/**
 * Modern Parser: Converts various layout schemas into a standard BoxModelProperties object.
 */
export function parseLayoutConfig(
  layout: RuntimeLayoutConfig = { type: "grid" as const, columns: 12 }
): BoxModelProperties {
  const type = layout.type;

  if (type === "grid") {
    const grid = layout as GridLayoutConfig;
    return {
      type: "grid",
      display: "grid",
      columns: grid.columns || 12,
      gap: grid.gap,
    };
  }

  if (type === "flex") {
    const flex = layout as any;
    return {
      type: "flex",
      display: "flex",
      direction: flex.direction || "row",
      justify: flex.justify,
      alignItems: flex.align,
      gap: flex.gap || 2,
    };
  }

  if (
    type === "card" ||
    type === "container" ||
    type === "fieldset" ||
    type === "group" ||
    type === "section"
  ) {
    return {
      type,
      display: "grid",
      columns: 12,
      gap: (layout as any).gap,
    };
  }

  return { type: "block", display: "block" };
}

/**
 * Returns the wrapper classes for an individual item (field) within a layout.
 */
export function getLayoutItemClasses(
  field: FormField,
  parentLayout: SectionLayoutConfig | RuntimeLayoutConfig
): string {
  const layout = field.layout as any;
  const classes: string[] = [];

  // 1. Grid-based col-spans apply to grid, card, AND container parent layouts
  const parentType = parentLayout.type as string;
  if (
    parentType === "grid" ||
    parentType === "card" ||
    parentType === "container" ||
    parentType === "accordion" ||
    parentType === "fieldset" ||
    parentType === "group" ||
    parentType === "section"
  ) {
    const parentColumns = (parentLayout as any).columns || 12;
    const rawSpan = getFieldSpan(field);

    // SCALE SPAN: If parent is not a 12-column grid, scale the 12-point span
    // to the parent's actual column count.
    const normalizedSpan =
      parentColumns === 12
        ? rawSpan
        : Math.max(1, Math.round((rawSpan / 12) * parentColumns));

    classes.push(getGridClassName(normalizedSpan, parentColumns));

    const ROW_SPAN_MAP: Record<string, string> = {
      1: "row-span-1",
      2: "row-span-2",
      3: "row-span-3",
      4: "row-span-4",
      5: "row-span-5",
      6: "row-span-6",
      full: "row-span-full",
    };
    const ROW_START_MAP: Record<string, string> = {
      1: "row-start-1",
      2: "row-start-2",
      3: "row-start-3",
      4: "row-start-4",
      5: "row-start-5",
      6: "row-start-6",
      7: "row-start-7",
      auto: "row-start-auto",
    };
    const COL_START_MAP: Record<string, string> = {
      1: "col-start-1",
      2: "col-start-2",
      3: "col-start-3",
      4: "col-start-4",
      5: "col-start-5",
      6: "col-start-6",
      7: "col-start-7",
      8: "col-start-8",
      9: "col-start-9",
      10: "col-start-10",
      11: "col-start-11",
      12: "col-start-12",
      13: "col-start-13",
      auto: "col-start-auto",
    };

    if (layout?.rowSpan && ROW_SPAN_MAP[layout.rowSpan])
      classes.push(ROW_SPAN_MAP[layout.rowSpan]);
    if (layout?.rowStart && ROW_START_MAP[layout.rowStart])
      classes.push(ROW_START_MAP[layout.rowStart]);
    if (layout?.colStart && COL_START_MAP[layout.colStart])
      classes.push(COL_START_MAP[layout.colStart]);
  }

  const ORDER_MAP: Record<string, string> = {
    1: "order-1",
    2: "order-2",
    3: "order-3",
    4: "order-4",
    5: "order-5",
    6: "order-6",
    7: "order-7",
    8: "order-8",
    9: "order-9",
    10: "order-10",
    11: "order-11",
    12: "order-12",
    first: "order-first",
    last: "order-last",
    none: "order-none",
  };
  const SELF_MAP: Record<string, string> = {
    auto: "self-auto",
    start: "self-start",
    end: "self-end",
    center: "self-center",
    stretch: "self-stretch",
    baseline: "self-baseline",
  };
  const JUSTIFY_SELF_MAP: Record<string, string> = {
    auto: "justify-self-auto",
    start: "justify-self-start",
    end: "justify-self-end",
    center: "justify-self-center",
    stretch: "justify-self-stretch",
  };

  // 2. Advanced Orchestration Handles (Universal)
  if (layout?.order !== undefined && ORDER_MAP[layout.order])
    classes.push(ORDER_MAP[layout.order]);
  if (layout?.alignSelf && SELF_MAP[layout.alignSelf])
    classes.push(SELF_MAP[layout.alignSelf]);
  if (layout?.justifySelf && JUSTIFY_SELF_MAP[layout.justifySelf])
    classes.push(JUSTIFY_SELF_MAP[layout.justifySelf]);

  // 3. Spacing Authority: Move margins/padding to the structural wrapper
  const spacing = getSpacingClasses(field);
  if (spacing.margin) classes.push(spacing.margin);
  if (spacing.padding) classes.push(spacing.padding);

  return classes.filter(Boolean).join(" ");
}

/**
 * Maps semantic spacing identifiers to Tailwind spacing classes.
 */
function getSpacingMapper(
  value?: string,
  type: "m" | "p" | "mt" | "mb" | "gap" = "m"
): string {
  if (!value) return "";
  if (value.includes("-")) return value;

  const key =
    value === "small"
      ? "sm"
      : value === "medium"
        ? "md"
        : value === "large"
          ? "lg"
          : value;

  if (type === "m") {
    const map: Record<string, string> = {
      none: "m-0",
      xs: "m-[var(--space-1)]",
      sm: "m-[var(--space-2)]",
      md: "m-[var(--space-4)]",
      lg: "m-[var(--space-8)]",
      xl: "m-[var(--space-12)]",
      xxl: "m-[var(--space-16)]",
    };
    return map[key] || map.md;
  }
  if (type === "p") {
    const map: Record<string, string> = {
      none: "p-0",
      xs: "p-[var(--space-1)]",
      sm: "p-[var(--space-2)]",
      md: "p-[var(--space-4)]",
      lg: "p-[var(--space-8)]",
      xl: "p-[var(--space-12)]",
      xxl: "p-[var(--space-16)]",
    };
    return map[key] || map.md;
  }
  if (type === "mt") {
    const map: Record<string, string> = {
      none: "mt-0",
      xs: "mt-[var(--space-1)]",
      sm: "mt-[var(--space-2)]",
      md: "mt-[var(--space-4)]",
      lg: "mt-[var(--space-8)]",
      xl: "mt-[var(--space-12)]",
      xxl: "mt-[var(--space-16)]",
    };
    return map[key] || map.md;
  }
  if (type === "mb") {
    const map: Record<string, string> = {
      none: "mb-0",
      xs: "mb-[var(--space-1)]",
      sm: "mb-[var(--space-2)]",
      md: "mb-[var(--space-4)]",
      lg: "mb-[var(--space-8)]",
      xl: "mb-[var(--space-12)]",
      xxl: "mb-[var(--space-16)]",
    };
    return map[key] || map.md;
  }
  if (type === "gap") {
    const map: Record<string, string> = {
      none: "gap-0",
      xs: "gap-[var(--space-1)]",
      sm: "gap-[var(--space-2)]",
      md: "gap-[var(--space-4)]",
      lg: "gap-[var(--space-8)]",
      xl: "gap-[var(--space-12)]",
      xxl: "gap-[var(--space-16)]",
    };
    return map[key] || map.md;
  }

  return "";
}

function getSpacingClasses(field: FormField) {
  const marginTop = field.properties?.marginTop;
  const marginBottom = field.properties?.marginBottom;
  const padding = field.properties?.padding;

  return {
    margin: [
      getSpacingMapper(marginTop, "mt"),
      getSpacingMapper(marginBottom, "mb"),
    ]
      .filter(Boolean)
      .join(" "),
    padding: getSpacingMapper(padding, "p"),
  };
}

// --- Grid Implementation ---

// --- Static Maps for Tailwind Safelist ---

const GAP_MAP: Record<string, string> = {
  "0": "gap-0",
  "1": "gap-1",
  "2": "gap-2",
  "3": "gap-3",
  "4": "gap-4",
  "5": "gap-5",
  "6": "gap-6",
  "8": "gap-8",
  "10": "gap-10",
  "12": "gap-12",
  sm: "gap-[var(--space-sm)]",
  md: "gap-[var(--space-md)]",
  lg: "gap-[var(--space-lg)]",
  xl: "gap-[var(--space-xl)]",
};

// --- Grid Implementation ---

export { getFieldSpan, getGridClassName };

/** Map numeric/symbolic gap values to Flex/Grid gap scale. */
function mapGapToScale(
  gap: string | number | undefined
): "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" {
  if (gap === undefined || gap === 0 || gap === "0") return "none";
  if (typeof gap === "string") {
    const match = gap.match(
      /(?:gap|space-y|space-x)(?:-|(?:-\[var\(--space-))(\d+(?:\.\d+)?)/
    );
    if (match) {
      const num = parseFloat(match[1]);
      if (num <= 1.5) return "xs";
      if (num <= 3) return "sm";
      if (num <= 5) return "md";
      if (num <= 8) return "lg";
      if (num <= 12) return "xl";
      return "2xl";
    }
  }
  if (typeof gap === "number") {
    if (gap <= 1) return "xs";
    if (gap <= 2) return "sm";
    if (gap <= 4) return "md";
    if (gap <= 6) return "lg";
    if (gap <= 8) return "xl";
    return "2xl";
  }
  const str = String(gap).toLowerCase();
  if (str === "sm" || str === "small") return "sm";
  if (str === "md" || str === "medium") return "md";
  if (str === "lg" || str === "large") return "lg";
  if (str === "xl") return "xl";
  if (str === "2xl") return "2xl";
  return "md";
}

/**
 * Render a layout using primitives instead of raw Tailwind class strings.
 *
 * @example
 * renderBoxModel({ display: "flex", direction: "col", gap: "4" }, children)
 * // → <Flex direction="col" gap="md">{children}</Flex>
 */
export function renderBoxModel(
  props: BoxModelProperties,
  children: React.ReactNode,
  className?: string
): React.ReactNode {
  const display = props.display || "block";

  if (display === "flex") {
    return (
      <Flex
        direction={props.direction === "col" ? "col" : "row"}
        gap={mapGapToScale(props.gap)}
        align={props.alignItems}
        justify={props.justify}
        className={className}
      >
        {children}
      </Flex>
    );
  }

  if (display === "grid") {
    return (
      <Grid
        columns={
          (props.columns || 12) as
            | 1
            | 2
            | 3
            | 4
            | 5
            | 6
            | 7
            | 8
            | 9
            | 10
            | 11
            | 12
        }
        gap={mapGapToScale(props.gap)}
        align={props.alignItems}
        justify={props.justify}
        className={className}
      >
        {children}
      </Grid>
    );
  }

  return <Box className={className}>{children}</Box>;
}
