import { BaseDriver } from "./BaseDriver";

/**
 * StyleDriver: Specialized for verifying the Form Engine's Style Matrix.
 * Provides high-precision assertions for CSS classes, slot occupancy,
 * and style origin traces.
 */
export class StyleDriver extends BaseDriver {
  constructor(container: HTMLElement) {
    super(container);
  }

  /**
   * Verify that a specific slot on a field contains the expected class.
   * @param fieldId The ID of the field to check
   * @param slot The slot name (base, label, inputWrapper, input, etc.)
   * @param className The class to look for
   */
  public async expectSlotClass(
    fieldId: string,
    slot: string,
    className: string
  ) {
    await this.waitFor(() => {
      const selector = `[data-field-id="${fieldId}"]`;
      const ensemble = this.container.querySelector(selector);
      if (!ensemble) throw new Error(`Field ${fieldId} not found`);

      let element: Element | null = null;

      switch (slot) {
        case "base":
          element = ensemble;
          break;
        case "label":
          element =
            ensemble.querySelector(".form-field__label") ||
            ensemble.querySelector("label");
          break;
        case "inputWrapper":
          element = ensemble.querySelector('[data-unit="input-wrapper"]');
          break;
        case "input":
          element = ensemble.querySelector("input, select, textarea");
          break;
        case "description":
          element = ensemble.querySelector(".form-field__description");
          break;
        default:
          element = ensemble.querySelector(`.form-field__${slot}`);
      }

      if (!element)
        throw new Error(`Slot "${slot}" for field ${fieldId} not found`);

      const classes = element.className;
      if (!classes.includes(className)) {
        throw new Error(
          `Field ${fieldId} slot "${slot}" expected class "${className}". Found: "${classes}"`
        );
      }
    });
  }

  /**
   * Verify that a field does NOT have "Double Backgrounds" (Ghost Rectangles).
   * Checks for the problematic combination of hardcoded glass backgrounds and slot-based backgrounds.
   */
  public async expectSingularSurface(fieldId: string) {
    await this.waitFor(() => {
      const surface = this.container.querySelector(
        `[data-field-id="${fieldId}"] [data-unit="input-wrapper"]`
      );
      if (!surface) throw new Error(`Surface for ${fieldId} not found`);

      const classes = surface.className;

      // The fix removed bg-[var(--glass-bg)] from the outer surface container.
      // We check that this specific "ghost" variable is absent.
      if (classes.includes("bg-[var(--glass-bg)]")) {
        throw new Error(
          `Detected double surface on ${fieldId}: Wrapper still has hardcoded glass background variable.`
        );
      }

      // Ensure it has at least one of the valid background tokens from the slot-system
      const hasValidBg =
        classes.includes("bg-subtle/5") ||
        classes.includes("bg-surface") ||
        classes.includes("bg-subtle") ||
        classes.includes("bg-transparent");

      if (!hasValidBg) {
        throw new Error(
          `Field ${fieldId} is missing an authoritative slot background. Classes: ${classes}`
        );
      }
    });
  }

  /**
   * Verify a style trace inside the FormStyleDebugger tool.
   */
  public async expectStyleTrace(
    fieldId: string,
    source: string,
    containsClass: string
  ) {
    await this.waitFor(() => {
      // Find the trace container for the specific field
      const traceHeader = Array.from(
        this.container.querySelectorAll("span")
      ).find((el) => el.textContent?.includes(`Style Trace: ${fieldId}`));

      if (!traceHeader) throw new Error(`Style trace for ${fieldId} not found`);

      // Find the source block (e.g., "heuristic" or "explicit")
      // Debugger renders source name in uppercase
      const sourceSpan = Array.from(
        this.container.querySelectorAll("span")
      ).find((el) => el.textContent?.toUpperCase() === source.toUpperCase());

      if (!sourceSpan)
        throw new Error(
          `Source label "${source}" not found in trace for ${fieldId}`
        );

      const sourceBlock = sourceSpan.parentElement?.parentElement;

      if (!sourceBlock || !sourceBlock.textContent?.includes(containsClass)) {
        throw new Error(
          `Trace for ${fieldId} block [${source}] expected to contain "${containsClass}".`
        );
      }
    });
  }
}
