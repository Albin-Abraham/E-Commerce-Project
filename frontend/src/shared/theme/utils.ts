import { tokens } from "./tokens";

/**
 * Zenith Breakpoint Engine
 *
 * Provides programmatic access to media queries and container logic.
 */
export const mq = {
  /** Min-width query: up('md') => '@media (min-width: 768px)' */
  up: (key: keyof typeof tokens.breakpoints) =>
    `@media (min-width: ${tokens.breakpoints[key]})`,

  /** Max-width query: down('md') => '@media (max-width: 767.98px)' */
  down: (key: keyof typeof tokens.breakpoints) => {
    const val = parseInt(tokens.breakpoints[key]) - 0.02;
    return `@media (max-width: ${val}px)`;
  },

  /** Range query: between('sm', 'md') */
  between: (
    start: keyof typeof tokens.breakpoints,
    end: keyof typeof tokens.breakpoints
  ) =>
    `@media (min-width: ${tokens.breakpoints[start]}) and (max-width: ${parseInt(tokens.breakpoints[end]) - 0.02}px)`,
};

/**
 * Container Query Helper
 *
 * Generates an arbitrary container query for Tailwind or CSS-in-JS.
 */
export const cq = (minWidth: number | string) =>
  `@container (min-width: ${typeof minWidth === "number" ? `${minWidth}px` : minWidth})`;

/**
 * Zenith Style Utility Engine
 *
 * Logic-based scripts for dynamic styling injection.
 */

/**
 * Fluid Scaling Utility (Clamp)
 *
 * Generates a CSS clamp() function based on a range.
 * Formula: clamp(min, preferred, max)
 */
export function fluid(
  minPx: number,
  maxPx: number,
  minVw = 640,
  maxVw = 1280
): string {
  const minRem = minPx / 16;
  const maxRem = maxPx / 16;

  const slope = (maxPx - minPx) / (maxVw - minVw);
  const yIntersection = -minVw * slope + minPx;

  const preferred = `${(yIntersection / 16).toFixed(4)}rem + ${(slope * 100).toFixed(4)}vw`;

  return `text-[clamp(${minRem}rem,${preferred},${maxRem}rem)]`;
}

/**
 * Color Alpha Injection
 *
 * Injects opacity into a CSS variable color.
 * Works with Tailwind's color/opacity syntax.
 */
export function alpha(colorVar: string, opacity: number): string {
  // Removes the var() wrapper if present to use with Tailwind's opacity modifier
  const cleanVar = colorVar.replace(/var\((--.*?)\)/, "$1");
  return `text-${cleanVar}/${opacity}`;
}

/**
 * Responsive Value Logic
 *
 * A functional approach to choosing values based on state or context.
 */
export function adaptive<T>(
  context: string,
  values: Record<string, T>,
  fallback: T
): T {
  return values[context] || fallback;
}
