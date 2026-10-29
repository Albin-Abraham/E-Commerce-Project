/**
 * @file focus-trap.ts
 * @description Keyboard focus trap and tab-order management for wizards/modals.
 */

/** Returns all focusable elements within a container. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ];
  return Array.from(
    container.querySelectorAll<HTMLElement>(selectors.join(", "))
  ).filter((el) => el.offsetParent !== null);
}

export interface FocusTrap {
  activate: () => void;
  deactivate: () => void;
  isActive: () => boolean;
}

/**
 * Creates a focus trap that keeps Tab/Shift+Tab cycling within a container.
 * Returns control functions — activate, deactivate, and isActive.
 */
export function createFocusTrap(
  container: () => HTMLElement | null
): FocusTrap {
  let active = false;

  function handleKeyDown(e: KeyboardEvent) {
    if (!active) return;
    if (e.key !== "Tab") return;

    const el = container();
    if (!el) return;

    const focusable = getFocusableElements(el);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  return {
    activate() {
      if (active) return;
      active = true;
      document.addEventListener("keydown", handleKeyDown);

      const el = container();
      if (el) {
        const focusable = getFocusableElements(el);
        if (focusable.length > 0 && !el.contains(document.activeElement)) {
          focusable[0].focus();
        }
      }
    },
    deactivate() {
      if (!active) return;
      active = false;
      document.removeEventListener("keydown", handleKeyDown);
    },
    isActive() {
      return active;
    },
  };
}

/**
 * Moves focus to the first focusable element within a container.
 * Used when navigating to a new wizard step.
 */
export function focusFirstFocusable(container: HTMLElement): boolean {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[0].focus();
    return true;
  }
  return false;
}

/**
 * Returns the tab order of elements within a container.
 * Useful for debugging keyboard navigation.
 */
export function getTabOrder(
  container: HTMLElement
): Array<{ element: HTMLElement; tabIndex: number; label: string }> {
  return getFocusableElements(container).map((el) => ({
    element: el,
    tabIndex:
      el.getAttribute("tabindex") !== null
        ? parseInt(el.getAttribute("tabindex")!, 10)
        : 0,
    label:
      el.getAttribute("aria-label") ||
      el.textContent?.trim() ||
      el.tagName.toLowerCase(),
  }));
}
