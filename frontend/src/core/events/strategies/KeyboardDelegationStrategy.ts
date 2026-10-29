import { useEventRegistry } from "@core/events/stores/eventRegistry.store";

import type { IEventStrategy } from "../interfaces/IEventStrategy";

/**
 * KeyboardDelegationStrategy
 * Concrete strategy for handling global keyboard shortcuts.
 */
export class KeyboardDelegationStrategy implements IEventStrategy {
  readonly type = "keydown";

  handle(event: Event): void {
    if (!(event instanceof KeyboardEvent)) return;

    const { shortcuts, activeScope } = useEventRegistry.getState();
    const keyCombo = this.getNormalizedKeyCombo(event);

    // Find all active shortcuts for this key that match the current scope
    const matches = Object.values(shortcuts).filter(
      (s) =>
        s.key === keyCombo &&
        s.enabled &&
        (!s.scope || s.scope === activeScope || s.scope === "global")
    );

    if (matches.length === 0) return;

    // Sort by priority (desc) and pick the winner
    const sorted = [...matches].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );
    const definition = sorted[0];

    if (definition) {
      const isModifierCombo = event.ctrlKey || event.metaKey || event.altKey;
      const isWhitelisted = event.key === "Escape" || isModifierCombo;

      // Focus Management: Prevent single-character shortcuts while typing in inputs,
      // but always allow modifier key combinations (e.g. Ctrl+K, Ctrl+Shift+D) and Escape
      if (this.isInputFocused() && !isWhitelisted) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      definition.command.execute(event);
    }
  }

  private getNormalizedKeyCombo(event: KeyboardEvent): string {
    const parts = [];
    if (event.ctrlKey) parts.push("ctrl");
    if (event.altKey) parts.push("alt");
    if (event.shiftKey) parts.push("shift");
    if (event.metaKey) parts.push("meta");

    parts.push(event.key.toLowerCase());
    return parts.join("+");
  }

  private isInputFocused(): boolean {
    const active = document.activeElement;
    if (!active) return false;

    const tag = active.tagName.toLowerCase();
    const isEditable = active.getAttribute("contenteditable") === "true";

    return (
      tag === "input" || tag === "textarea" || tag === "select" || isEditable
    );
  }
}
