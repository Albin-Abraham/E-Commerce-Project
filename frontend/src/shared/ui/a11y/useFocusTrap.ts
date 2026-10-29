import { useEffect, useRef } from "react";
import { useEventRegistry } from "@core/events/stores/eventRegistry.store";

export interface UseFocusTrapOptions {
  active?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  scope?: string;
  onEscape?: () => void;
}

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "area[href]",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable='true']",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * useFocusTrap
 *
 * Captures keyboard Tab focus inside a container element, preventing focus leaks
 * behind overlay dialogs. Automatically integrates with the Core Event Registry scope.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  containerRef: React.RefObject<T | null>,
  options: UseFocusTrapOptions = {}
) {
  const {
    active = true,
    autoFocus = true,
    restoreFocus = true,
    scope,
    onEscape,
  } = options;

  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return;

    // 1. Capture previously focused element
    if (restoreFocus && document.activeElement instanceof HTMLElement) {
      previouslyFocusedElement.current = document.activeElement;
    }

    const container = containerRef.current;
    if (!container) return;

    // 2. Query focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      if (!container) return [];
      return Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    };

    // 3. Auto-focus initial element
    if (autoFocus) {
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        // Focus first element if not already inside container
        if (!container.contains(document.activeElement)) {
          focusable[0].focus();
        }
      } else {
        // Fallback: make container focusable and focus it
        if (!container.hasAttribute("tabindex")) {
          container.setAttribute("tabindex", "-1");
        }
        container.focus();
      }
    }

    // 4. Trap Tab and Escape keys
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onEscapeRef.current) {
        event.preventDefault();
        event.stopPropagation();
        onEscapeRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const elements = getFocusableElements();
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        if (activeElement === firstElement || !container.contains(activeElement)) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        if (activeElement === lastElement || !container.contains(activeElement)) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // 5. Core Event Registry Scope Management
    let previousScope: string | undefined;
    if (scope) {
      previousScope = useEventRegistry.getState().activeScope;
      useEventRegistry.getState().setActiveScope(scope);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      // Restore Event Registry Scope
      if (scope && previousScope !== undefined) {
        const currentScope = useEventRegistry.getState().activeScope;
        if (currentScope === scope) {
          useEventRegistry.getState().setActiveScope(previousScope);
        }
      }

      // Restore DOM focus
      if (restoreFocus && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [active, autoFocus, restoreFocus, scope, containerRef]);
}
