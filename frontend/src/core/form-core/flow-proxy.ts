/**
 * @file flow-proxy.ts
 * @description Handles wizard/multi-step navigation logic.
 *
 * ## Responsibility
 * `FlowProxy` answers one question: **"Given the current step and form values, what is the next step?"**
 *
 * It supports two navigation modes:
 * 1. **Static** — next step is a fixed string ID (`nextStep: "step-2"`).
 * 2. **Dynamic** — next step is computed by a function based on current values
 *    (`nextStep: (values) => values.type === "A" ? "step-a" : "step-b"`).
 * 3. **Sequential (default)** — follows the order of `rootSections` in the
 *    normalized form definition.
 *
 * ## Architecture
 * FlowProxy is a pure computation unit:
 * - No state mutations.
 * - No direct React dependency.
 * - Reads values lazily via a `getValues` callback (avoids stale closure over snapshot).
 *
 * ## Used By
 * - {@link FormRuntime} exposes it as `form.flow`.
 * - Wizard/stepper UI components call `form.flow.getNextStep(currentStepId)`.
 */
import type { NormalizedForm } from "./int-types";

export class FlowProxy {
  /**
   * @param definition - The normalized form definition. Used to read section metadata
   *   (e.g., `nextStep` property) and the ordered `rootSections` list.
   * @param valueProxy - Shared value accessor. Available for future computed-step logic
   *   that needs to read nested field values.
   * @param getValues  - Lazy callback that returns the latest form `ValuesState`.
   *   Using a callback avoids capturing a stale snapshot at construction time.
   */
  constructor(
    private definition: NormalizedForm,
    private getValues: () => any,
    private getVisibility?: () => Record<string, boolean>
  ) {}

  /**
   * Determines the ID of the next step/section to navigate to.
   *
   * **Resolution order:**
   * 1. `section.nextStep` is a **function** → call it with current values and return result.
   * 2. `section.nextStep` is a **string** → return it directly (static jump).
   * 3. Neither → fall back to sequential order via `rootSections`.
   * 4. Already on the last root section → return `null`.
   *
   * @param currentStepId - The ID of the section/step the user is currently on.
   * @returns The ID of the next step, or `null` if this is the last step.
   *
   * @example
   * // Static next step defined in schema:
   * // section: { id: "step-1", nextStep: "step-3" }
   * flow.getNextStep("step-1"); // → "step-3" (skips step-2)
   *
   * // Dynamic next step function in schema:
   * // section: { id: "step-1", nextStep: (values) => values.plan === "pro" ? "pro-details" : "basic-details" }
   * flow.getNextStep("step-1"); // → "pro-details" or "basic-details" based on current values
   *
   * // Sequential fallback (no nextStep defined):
   * // rootSections: ["step-1", "step-2", "step-3"]
   * flow.getNextStep("step-2"); // → "step-3"
   * flow.getNextStep("step-3"); // → null (last step)
   */
  public getNextStep(currentStepId: string): string | null {
    const currentSection = this.definition.sections[currentStepId];
    if (!currentSection) {
      return null; // Section not found — bail safely
    }

    const nextStepDef = currentSection.nextStep;
    let resolvedNext: string | null = null;

    // 1. Dynamic: nextStep is a function — delegate to schema-defined logic
    if (nextStepDef) {
      if (typeof nextStepDef === "function") {
        resolvedNext = nextStepDef(this.getValues());
      }
      // 2. Static: nextStep is a fixed string ID
      else if (typeof nextStepDef === "string") {
        resolvedNext = nextStepDef;
      }
    } else {
      // 3. Sequential fallback: find the current section's index in rootSections
      //    and return the next one in order.
      const rootSections = this.definition.rootSections;
      const currentIndex = rootSections.indexOf(currentStepId);

      if (currentIndex !== -1 && currentIndex < rootSections.length - 1) {
        resolvedNext = rootSections[currentIndex + 1];
      }
    }

    if (!resolvedNext) {
      return null;
    }

    // 4. Visibility Check, Submit-Landing Skipping
    // A review-only (submit landing) section is never a navigation TARGET —
    // the wizard submits from the previous step instead. Both hidden steps and
    // submit-landing steps are skipped, recursing to the next candidate.
    const visibility = this.getVisibility ? this.getVisibility() : {};
    if (visibility[resolvedNext] !== false && !this.isSubmitLanding(resolvedNext)) {
      return resolvedNext;
    }

    // Recursive resolution: skip the hidden/submit-landing step and find the
    // next step after it
    return this.getNextStep(resolvedNext);
  }

  /**
   * Returns `true` if the given section is a **submit landing** (review-only)
   * step — i.e. it carries `layout.reviewOnly`. Such sections represent the
   * final review surface a wizard submits from; they are never navigated to.
   */
  private isSubmitLanding(sectionId: string): boolean {
    return this.definition.sections[sectionId]?.layout?.reviewOnly === true;
  }

  /**
   * Returns `true` if the given step has no successor — i.e., it is the final step
   * in the current flow path.
   *
   * @remarks
   * This is a simple heuristic: it delegates to {@link getNextStep} and checks
   * whether the result is `null`. For linear flows this is exact. For complex
   * branching flows (where all branches converge), a more sophisticated "look-ahead"
   * calculation would be needed.
   *
   * @param currentStepId - The ID of the step to check.
   * @returns `true` if this is the last step; `false` if there is a next step.
   *
   * @example
   * flow.isLastStep("step-3"); // → true if step-3 has no nextStep and is last in rootSections
   * flow.isLastStep("step-1"); // → false
   */
  public isLastStep(currentStepId: string): boolean {
    return this.getNextStep(currentStepId) === null;
  }
}
