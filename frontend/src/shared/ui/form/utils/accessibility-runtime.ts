/**
 * @file accessibility-runtime.ts
 * @description Runtime accessibility enforcement for the form system.
 */
export {
  FIELD_ROLES,
  buildAriaAttributes,
  auditField,
  enhanceFieldProps,
} from "@form-core/utils/accessibility";

/**
 * Creates a live region announcement for screen readers.
 * Use for validation summary, submit confirmation, etc.
 */
export function createAnnouncement(
  message: string,
  priority: "polite" | "assertive" = "polite"
) {
  if (typeof document === "undefined") return;

  let announcer = document.getElementById("form-announcer");
  if (!announcer) {
    announcer = document.createElement("div");
    announcer.id = "form-announcer";
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only"; // screen-reader-only
    document.body.appendChild(announcer);
  } else {
    announcer.setAttribute("aria-live", priority);
  }

  // Clear first to trigger re-announcement if same text
  announcer.textContent = "";
  requestAnimationFrame(() => {
    announcer!.textContent = message;
  });
}

/**
 * Focus management: moves focus to the first invalid field.
 */
export function focusFirstInvalidField() {
  if (typeof document === "undefined") return;

  const invalidField = document.querySelector<HTMLElement>(
    '[data-field-id][aria-invalid="true"]'
  );

  if (invalidField) {
    invalidField.scrollIntoView({ behavior: "smooth", block: "center" });
    const input = invalidField.querySelector<HTMLElement>(
      'input, select, textarea, [tabindex="0"], [role="textbox"]'
    );
    input?.focus({ preventScroll: true });
  }
}
