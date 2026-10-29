/**
 * @file dropdown-anchor.ts
 * @description Pure utility for computing the fixed-position anchor of a floating
 * dropdown panel relative to a trigger element's DOMRect.
 *
 * Design constraints:
 * - Always computes `top` (never CSS `bottom`) to prevent Framer Motion from
 *   interpolating between two different axis properties when direction flips.
 * - Uses a two-pass heuristic: prefer opening downward; only flip upward when
 *   downward space is critically small AND upward has more room.
 */

export interface DropdownAnchorOptions {
  /** Max natural height of the panel before it scrolls. */
  panelMaxHeight?: number;
  /** Gap between trigger edge and panel edge in px. */
  margin?: number;
  /** Minimum usable panel height before the flip heuristic activates. */
  minHeight?: number;
}

export interface DropdownAnchor {
  /** CSS `top` value for the panel's outer positioning div (always set, never `bottom`). */
  top: number;
  /** Clamped maximum height for the panel. */
  maxHeight: number;
  /** True when the panel opens above the trigger instead of below. */
  openUpward: boolean;
  /** CSS `transform-origin` for scale animations (so panel grows from the trigger edge). */
  transformOrigin: "top center" | "bottom center";
}

/**
 * Computes all values needed to position a floating dropdown panel anchored
 * to a trigger element's bounding rect.
 *
 * @param rect     - DOMRect of the trigger element (from getBoundingClientRect).
 * @param options  - Sizing/spacing configuration.
 * @returns        - Stable anchor values safe to spread directly into inline styles.
 *
 * @example
 * const anchor = computeDropdownAnchor(triggerRef.current.getBoundingClientRect());
 * // style={{ position: "fixed", top: anchor.top, maxHeight: anchor.maxHeight }}
 */
export function computeDropdownAnchor(
  rect: DOMRect,
  options: DropdownAnchorOptions = {}
): DropdownAnchor {
  const { panelMaxHeight = 320, margin = 8, minHeight = 120 } = options;

  const spaceBelow = window.innerHeight - rect.bottom - margin;
  const spaceAbove = rect.top - margin;

  // Only flip upward when downward space is critically small AND upward is larger.
  const openUpward = spaceBelow < minHeight && spaceAbove > spaceBelow;

  const top = openUpward
    ? rect.top - Math.min(panelMaxHeight, spaceAbove) - margin
    : rect.bottom + margin;

  const maxHeight = openUpward
    ? Math.max(minHeight, Math.min(panelMaxHeight, spaceAbove))
    : Math.max(minHeight, Math.min(panelMaxHeight, spaceBelow));

  return {
    top,
    maxHeight,
    openUpward,
    transformOrigin: openUpward ? "bottom center" : "top center",
  };
}
