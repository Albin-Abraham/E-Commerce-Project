import { useEventRegistry } from "@core/events/stores/eventRegistry.store";

import type { IEventStrategy } from "../interfaces/IEventStrategy";

/**
 * MouseDelegationStrategy
 * Concrete strategy for handling delegated clicks based on CSS selectors.
 */
export class MouseDelegationStrategy implements IEventStrategy {
  readonly type = "click";

  handle(event: Event): void {
    if (!(event instanceof MouseEvent)) return;

    const { mouseActions } = useEventRegistry.getState();

    // Iterate through registered mouse actions
    for (const definition of Object.values(mouseActions)) {
      if (!definition.enabled) continue;

      const target = (event.target as HTMLElement).closest(definition.selector);

      if (target) {
        // Accessibility Check: Ensure delegated targets have appropriate roles
        this.ensureAccessibility(target as HTMLElement);

        definition.command.execute({ event, target });

        // Only trigger the first matching action (or allow bubbling if needed)
        break;
      }
    }
  }

  private ensureAccessibility(element: HTMLElement): void {
    // Only warn in development if architectural rules are violated
    if (process.env.NODE_ENV === "development") {
      const tag = element.tagName.toLowerCase();
      const isNativeInteractive = tag === "button" || tag === "a" || tag === "input" || tag === "select";

      if (!isNativeInteractive) {
        const role = element.getAttribute("role");
        const tabIndex = element.getAttribute("tabindex");

        if (!role) {
          console.warn(
            `[MouseStrategy] Accessibility Warning: Delegated non-native target missing 'role'. Suggest: role="button"`,
            element
          );
        }
        if (tabIndex === null) {
          console.warn(
            `[MouseStrategy] Accessibility Warning: Delegated target missing 'tabindex'. Suggest: tabindex="0"`,
            element
          );
        }
      }

      // Check for accessible name
      const hasAccessibleName =
        Boolean(element.getAttribute("aria-label")) ||
        Boolean(element.getAttribute("aria-labelledby")) ||
        Boolean(element.getAttribute("title")) ||
        Boolean(element.textContent?.trim());

      if (!hasAccessibleName) {
        console.warn(
          `[MouseStrategy] Accessibility Warning: Delegated target lacks an accessible name (no text content, aria-label, aria-labelledby, or title).`,
          element
        );
      }
    }
  }
}

