import type { CSSProperties } from "react";

/**
 * getStickyStyles
 *
 * Returns CSS properties for pinned (sticky) columns.
 * Shared by header and body cells to ensure consistent positioning.
 *
 * @param column - Column with getIsPinned() and getStart() methods
 * @param context - "header" or "cell" to differentiate styling
 */
interface PinnableColumn {
  getIsPinned: () => string | false;
  getStart: (side: "left" | "right") => number;
}

export function getStickyStyles(
  column: PinnableColumn,
  context: "header" | "cell" = "cell"
): CSSProperties {
  const isPinned = column.getIsPinned();
  if (!isPinned) return {};

  const base: CSSProperties = {
    position: "sticky",
    left: column.getStart("left"),
    boxShadow: "4px 0 10px -4px var(--color-shadow, rgba(0,0,0,0.08))",
  };

  if (context === "header") {
    return {
      ...base,
      zIndex: 25,
      backgroundColor: "var(--z-card-bg)",
      backdropFilter: "blur(8px)",
    };
  }

  return {
    ...base,
    zIndex: 10,
    backgroundColor: "var(--z-card-bg)",
  };
}
