import { useEffect, useRef } from "react";

import {
  createFocusTrap,
  focusFirstFocusable,
} from "@ui/form/utils/focus-trap";

interface UseFocusTrapOptions {
  /** When true, the focus trap is active. */
  enabled: boolean;
  /** CSS selector for the container element. Defaults to '[data-form-shell]'. */
  containerSelector?: string;
  /** Auto-focus first element when enabled changes to true. */
  autoFocus?: boolean;
}

/**
 * Traps Tab/Shift+Tab cycling within the form container.
 * Used for wizard modals and dialogs to prevent keyboard focus from escaping.
 */
export function useFocusTrap({
  enabled,
  containerSelector = "[data-form-shell]",
  autoFocus = true,
}: UseFocusTrapOptions) {
  const trapRef = useRef<ReturnType<typeof createFocusTrap> | null>(null);

  useEffect(() => {
    if (!enabled) {
      trapRef.current?.deactivate();
      return;
    }

    const trap = createFocusTrap(() =>
      document.querySelector<HTMLElement>(containerSelector)
    );
    trapRef.current = trap;
    trap.activate();

    return () => {
      trap.deactivate();
    };
  }, [enabled, containerSelector]);

  useEffect(() => {
    if (!enabled || !autoFocus) return;
    const el = document.querySelector<HTMLElement>(containerSelector);
    if (el) {
      focusFirstFocusable(el);
    }
  }, [enabled, autoFocus, containerSelector]);
}
