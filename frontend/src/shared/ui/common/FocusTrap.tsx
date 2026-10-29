import React, { useEffect, useRef } from "react";
import { useEventRegistry } from "@core/events/stores/eventRegistry.store";

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  scope?: string;
  onEscape?: () => void;
}

/**
 * Standardized Focus Trap Component (Accessibility Layer 2)
 *
 * Captures keyboard Tab focus inside the portal container (e.g. Modals/Drawers),
 * preventing users from accidentally focusing elements behind the overlay.
 * Restores focus back to the triggering element upon unmounting and isolates event scopes.
 */
export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  scope,
  onEscape,
}) => {

  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // 1. Capture the element focused prior to mounting
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // 2. Select all standard focusable selectors
    const focusableSelectors = [
      "a[href]",
      "area[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "button:not([disabled])",
      "iframe",
      "object",
      "embed",
      "[contenteditable]",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    const getFocusableElements = (): HTMLElement[] => {
      if (!container) return [];
      return Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors)
      );
    };

    // 3. Focus the first element on mount
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // 4. Trap keydown events
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onEscape) {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
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
        // Tab + Shift: wrap around from first to last element
        if (activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        // Tab: wrap around from last to first element
        if (activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // 5. Manage Event Registry Scope
    let previousScope: string | undefined;
    if (scope) {
      previousScope = useEventRegistry.getState().activeScope;
      useEventRegistry.getState().setActiveScope(scope);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      // Restore Event Registry Scope
      if (scope && previousScope !== undefined) {
        if (useEventRegistry.getState().activeScope === scope) {
          useEventRegistry.getState().setActiveScope(previousScope);
        }
      }

      // 6. Restore focus on unmount
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [active, scope, onEscape]);


  return (
    <div ref={containerRef} style={{ display: "contents" }}>
      {children}
    </div>
  );
};
