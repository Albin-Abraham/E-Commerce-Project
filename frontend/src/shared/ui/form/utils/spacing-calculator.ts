/**
 * SPACING CALCULATOR
 *
 * Dynamically calculates optimal spacing based on form complexity metrics.
 *
 * Strategy:
 * - More fields → More spacing (breathing room)
 * - Deeper nesting → Less spacing (visual hierarchy)
 * - User density override → Respected
 */

export interface FormMetrics {
  totalFields: number;
  totalSections: number;
  maxNestingDepth: number;
  averageFieldsPerRow: number;
  hasRepeaters: boolean;
  density: "compact" | "comfortable" | "spacious";
}

export interface SpacingConfig {
  // Field spacing
  fieldVertical: string; // Between fields in a vertical (block/stack) section
  fieldHorizontal: string; // Between fields in a row (flex row / group)
  fieldGapX: string; // Exact column gap for grid sections (gap-x-[fluid token])
  fieldGapY: string; // Exact row gap for grid sections (gap-y-[fluid token])

  // Section spacing
  sectionVertical: string; // Between sections
  sectionPadding: string; // Inside section/card

  // Component spacing
  labelToInput: string; // Label → Input gap
  inputToHelp: string; // Input → Helper text gap
  inputToError: string; // Input → Error message gap
}

export class SpacingCalculator {
  /**
   * Calculate optimal spacing based on form complexity
   */
  static calculateSpacing(metrics: FormMetrics): SpacingConfig {
    const baseSpacing = this.getBaseSpacing(metrics.density);
    const fieldCountMultiplier = this.getFieldCountMultiplier(
      metrics.totalFields
    );
    const nestingMultiplier = this.getNestingMultiplier(
      metrics.maxNestingDepth
    );

    return {
      fieldVertical: this.scaleSpacing(
        baseSpacing.fieldVertical,
        fieldCountMultiplier,
        nestingMultiplier
      ),
      fieldHorizontal: this.scaleSpacing(
        baseSpacing.fieldHorizontal,
        fieldCountMultiplier,
        nestingMultiplier
      ),
      fieldGapX: this.scaleSpacing(
        baseSpacing.fieldGapX,
        fieldCountMultiplier,
        nestingMultiplier
      ),
      fieldGapY: this.scaleSpacing(
        baseSpacing.fieldGapY,
        fieldCountMultiplier,
        nestingMultiplier
      ),
      sectionVertical: this.scaleSpacing(
        baseSpacing.sectionVertical,
        fieldCountMultiplier,
        nestingMultiplier
      ),
      sectionPadding: this.scaleSpacing(
        baseSpacing.sectionPadding,
        fieldCountMultiplier,
        nestingMultiplier
      ),
      labelToInput: baseSpacing.labelToInput, // Keep constant for consistency
      inputToHelp: baseSpacing.inputToHelp, // Keep constant
      inputToError: baseSpacing.inputToError, // Keep constant
    };
  }

  /**
   * Get base spacing values for a given density.
   *
   * IMPORTANT: Uses concrete Tailwind numeric values (NOT CSS var() tokens)
   * so that scaleSpacing() can parse and scale them via the multiplier system.
   * The labelToInput / inputToHelp / inputToError helpers are kept as-is since
   * they are intentionally constant regardless of form complexity.
   */
  private static getBaseSpacing(
    density: "compact" | "comfortable" | "spacious"
  ) {
    switch (density) {
      case "compact":
        return {
          fieldVertical: "space-y-3",
          fieldHorizontal: "gap-3",
          fieldGapX: "gap-x-3",
          fieldGapY: "gap-y-3",
          sectionVertical: "space-y-4",
          sectionPadding: "p-4",
          labelToInput: "mb-1",
          inputToHelp: "mt-1",
          inputToError: "mt-1",
        };
      case "spacious":
        return {
          fieldVertical: "space-y-6",
          fieldHorizontal: "gap-4",
          fieldGapX: "gap-x-4",
          fieldGapY: "gap-y-6",
          sectionVertical: "space-y-8",
          sectionPadding: "p-6",
          labelToInput: "mb-2",
          inputToHelp: "mt-2",
          inputToError: "mt-2",
        };
      case "comfortable":
      default:
        return {
          fieldVertical: "space-y-4",
          fieldHorizontal: "gap-4",
          fieldGapX: "gap-x-4",
          fieldGapY: "gap-y-4",
          sectionVertical: "space-y-6",
          sectionPadding: "p-4",
          labelToInput: "mb-1.5",
          inputToHelp: "mt-1.5",
          inputToError: "mt-2",
        };
    }
  }

  /**
   * Calculate multiplier based on total field count
   * More fields → MORE spacing for breathing room
   */
  private static getFieldCountMultiplier(totalFields: number): number {
    if (totalFields <= 5) return 0.85; // Simple form, slightly tighter
    if (totalFields <= 20) return 1.0; // Standard
    if (totalFields <= 50) return 1.15; // Dense form, more breathing room
    return 1.3; // Enterprise form, maximum spacing
  }

  /**
   * Calculate multiplier based on nesting depth
   * Deeper nesting → LESS spacing for visual hierarchy
   */
  private static getNestingMultiplier(depth: number): number {
    if (depth <= 1) return 1.0; // Flat form
    if (depth <= 2) return 0.9; // One level of sections
    if (depth <= 3) return 0.8; // Two levels
    return 0.75; // Deep nesting, reduce to show hierarchy
  }

  /**
   * Scale a Tailwind spacing class by the combined multiplier.
   *
   * Parses the numeric part of classes like "space-y-4", "gap-4", "p-4",
   * applies the compounded multiplier, snaps to the nearest valid Tailwind
   * spacing value, and rewrites the class string.
   *
   * @example
   * scaleSpacing("space-y-4", 1.15, 0.9) → "space-y-4"  (4 × 1.035 → nearest = 4)
   * scaleSpacing("space-y-4", 1.3,  1.0) → "space-y-5"  (4 × 1.3 = 5.2 → nearest = 5)
   */
  private static scaleSpacing(
    baseClass: string,
    ...multipliers: number[]
  ): string {
    const finalMultiplier = multipliers.reduce((acc, m) => acc * m, 1);

    // Extract the numeric token and prefix
    const match = baseClass.match(/^([a-z-]+-)(\d+(?:\.\d+)?)$/);
    if (!match) return baseClass;

    const prefix = match[1]; // e.g., "space-y-" or "gap-"
    const baseValue = parseFloat(match[2]);
    const scaledValue = Math.round(baseValue * finalMultiplier * 10) / 10;

    // Snap to the nearest valid Tailwind spacing step
    const closestValue = this.findClosestSpacingValue(scaledValue);

    // Static Mapper to ensure Tailwind JIT safelists these exact expressions!
    const key = `${prefix}${closestValue}`;
    return SPACING_SAFETLIST[key] || `${prefix}${closestValue}`;
  }

  /**
   * Find the closest valid Tailwind spacing value
   */
  private static findClosestSpacingValue(target: number): number {
    // P3 FIX: Only snap to values that exist in Zenith's tokens.css spacing scale
    const validValues = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16];

    return validValues.reduce((prev, curr) =>
      Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
    );
  }

  /**
   * Get default spacing config (fallback)
   */
  static getDefaultSpacing(): SpacingConfig {
    return this.calculateSpacing({
      totalFields: 10,
      totalSections: 1,
      maxNestingDepth: 1,
      averageFieldsPerRow: 2,
      hasRepeaters: false,
      density: "comfortable",
    });
  }
}

// ── Tailwind Compile-Time Safelist Maps ──────────────────────────
// Tailwind cannot parse dynamically assembled strings like `space-y-${val}`.
// This static map ensures that all dynamically scaled classes actually compile.
// P3 FIX: Map dynamically scaled integers to Zenith space tokens
const SPACING_SAFETLIST: Record<string, string> = {
  // gap-
  "gap-0": "gap-0",
  "gap-1": "gap-[var(--space-1)]",
  "gap-2": "gap-[var(--space-2)]",
  "gap-3": "gap-[var(--space-3)]",
  "gap-4": "gap-[var(--space-4)]",
  "gap-5": "gap-[var(--space-5)]",
  "gap-6": "gap-[var(--space-6)]",
  "gap-8": "gap-[var(--space-8)]",
  "gap-10": "gap-[var(--space-10)]",
  "gap-12": "gap-[var(--space-12)]",
  "gap-16": "gap-[var(--space-16)]",
  // space-y-
  "space-y-0": "space-y-0",
  "space-y-1": "space-y-[var(--space-1)]",
  "space-y-2": "space-y-[var(--space-2)]",
  "space-y-3": "space-y-[var(--space-3)]",
  "space-y-4": "space-y-[var(--space-4)]",
  "space-y-5": "space-y-[var(--space-5)]",
  "space-y-6": "space-y-[var(--space-6)]",
  "space-y-8": "space-y-[var(--space-8)]",
  "space-y-10": "space-y-[var(--space-10)]",
  "space-y-12": "space-y-[var(--space-12)]",
  "space-y-16": "space-y-[var(--space-16)]",
  // gap-x- (grid column gap)
  "gap-x-0": "gap-x-0",
  "gap-x-1": "gap-x-[var(--space-1)]",
  "gap-x-2": "gap-x-[var(--space-2)]",
  "gap-x-3": "gap-x-[var(--space-3)]",
  "gap-x-4": "gap-x-[var(--space-4)]",
  "gap-x-5": "gap-x-[var(--space-5)]",
  "gap-x-6": "gap-x-[var(--space-6)]",
  "gap-x-8": "gap-x-[var(--space-8)]",
  "gap-x-10": "gap-x-[var(--space-10)]",
  "gap-x-12": "gap-x-[var(--space-12)]",
  "gap-x-16": "gap-x-[var(--space-16)]",
  // gap-y- (grid row gap)
  "gap-y-0": "gap-y-0",
  "gap-y-1": "gap-y-[var(--space-1)]",
  "gap-y-2": "gap-y-[var(--space-2)]",
  "gap-y-3": "gap-y-[var(--space-3)]",
  "gap-y-4": "gap-y-[var(--space-4)]",
  "gap-y-5": "gap-y-[var(--space-5)]",
  "gap-y-6": "gap-y-[var(--space-6)]",
  "gap-y-8": "gap-y-[var(--space-8)]",
  "gap-y-10": "gap-y-[var(--space-10)]",
  "gap-y-12": "gap-y-[var(--space-12)]",
  "gap-y-16": "gap-y-[var(--space-16)]",
  // p-
  "p-0": "p-0",
  "p-1": "p-[var(--space-1)]",
  "p-2": "p-[var(--space-2)]",
  "p-3": "p-[var(--space-3)]",
  "p-4": "p-[var(--space-4)]",
  "p-5": "p-[var(--space-5)]",
  "p-6": "p-[var(--space-6)]",
  "p-8": "p-[var(--space-8)]",
  "p-10": "p-[var(--space-10)]",
  "p-12": "p-[var(--space-12)]",
  "p-16": "p-[var(--space-16)]",
};
