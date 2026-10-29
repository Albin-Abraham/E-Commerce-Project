import type { FormField } from "../fields";
import { getFieldCategory } from "../fields";
import { groupFieldsIntoRows } from "./row-layout";
import type { FormMetrics } from "./spacing-calculator";

/**
 * FORM METRICS ANALYZER
 *
 * Analyzes form structure to extract complexity metrics for spacing calculation.
 *
 * ## Performance (1C fix)
 * Previously made 5 separate recursive tree traversals (countInputFields,
 * countSections, getMaxDepth, calculateAvgFieldsPerRow, hasRepeaters).
 * Now a single `_analyzePass()` accumulates all metrics in ONE walk.
 */

interface MetricsAccumulator {
  inputFields: number;
  sections: number;
  depth: number;
  hasRepeaters: boolean;
  topLevelInputs: FormField[]; // for row-grouping (only top-level inputs needed)
}

export class FormMetricsAnalyzer {
  /**
   * Analyze form structure and extract metrics in a single recursive pass.
   */
  static analyze(
    fields: FormField[],
    density: "compact" | "comfortable" | "spacious" = "comfortable"
  ): FormMetrics {
    const acc: MetricsAccumulator = {
      inputFields: 0,
      sections: 0,
      depth: 0,
      hasRepeaters: false,
      topLevelInputs: [],
    };

    this._analyzePass(fields, acc, 0, true);

    return {
      totalFields: acc.inputFields,
      totalSections: acc.sections,
      maxNestingDepth: acc.depth,
      averageFieldsPerRow: this._avgFieldsPerRow(acc.topLevelInputs),
      hasRepeaters: acc.hasRepeaters,
      density,
    };
  }

  /**
   * Single recursive traversal that collects all needed metrics.
   * @param fields       - Fields to traverse at this level.
   * @param acc          - Mutable accumulator shared across the whole tree.
   * @param currentDepth - Depth of this recursion level.
   * @param isTopLevel   - Only collect top-level inputs for row grouping.
   */
  private static _analyzePass(
    fields: FormField[],
    acc: MetricsAccumulator,
    currentDepth: number,
    isTopLevel: boolean
  ): void {
    acc.depth = Math.max(acc.depth, currentDepth);

    for (const field of fields) {
      const category = getFieldCategory(field.type);

      if (category === "input") {
        acc.inputFields++;
        if (isTopLevel) acc.topLevelInputs.push(field);
      } else if (field.type === "repeater") {
        acc.hasRepeaters = true;
        // Repeater template children are NOT runtime inputs — don't count them
      } else if (category === "structure") {
        acc.sections++;
        if (field.fields && field.fields.length > 0) {
          this._analyzePass(field.fields, acc, currentDepth + 1, false);
        }
      }
    }
  }

  /** Average fields per row, using the top-level input fields only. */
  private static _avgFieldsPerRow(inputFields: FormField[]): number {
    if (inputFields.length === 0) return 0;
    try {
      const rows = groupFieldsIntoRows(inputFields);
      if (rows.length === 0) return 1;
      const total = rows.reduce((sum, row) => sum + row.fields.length, 0);
      return Math.round((total / rows.length) * 10) / 10;
    } catch {
      return 1;
    }
  }

  /**
   * Get a complexity score (0-100) based on metrics.
   */
  static getComplexityScore(metrics: FormMetrics): number {
    let score = 0;

    if (metrics.totalFields <= 5) score += 10;
    else if (metrics.totalFields <= 20) score += 20;
    else if (metrics.totalFields <= 50) score += 30;
    else score += 40;

    score += Math.min(metrics.maxNestingDepth * 10, 30);
    score += Math.min(metrics.totalSections * 5, 20);
    if (metrics.hasRepeaters) score += 10;

    return Math.min(score, 100);
  }
}
