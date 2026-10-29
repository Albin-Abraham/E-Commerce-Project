import { useEffect } from "react";

import { useEventRegistry } from "@core/events/stores/eventRegistry.store";

interface MenuKeyboardOptions {
  isOpen: boolean;
  itemCount: number;
  onSelect: (index: number) => void;
  onExecute: (index: number) => void;
  scope: string;
}

/**
 * useMenuKeyboardControl
 *
 * Industrial-grade hook to abstract away the boilerplate of registering
 * keyboard shortcuts for contextual menus and dropdowns.
 */
export const useMenuKeyboardControl = ({
  isOpen,
  itemCount,
  onSelect,
  onExecute,
  scope,
}: MenuKeyboardOptions) => {
  const registerShortcut = useEventRegistry((s) => s.registerShortcut);
  const unregisterShortcut = useEventRegistry((s) => s.unregisterShortcut);
  const setActiveScope = useEventRegistry((s) => s.setActiveScope);

  useEffect(() => {
    if (!isOpen) {
      setActiveScope("global");
      return;
    }

    setActiveScope(scope);

    // Arrow Down -> Next Item
    registerShortcut(`${scope}-down`, {
      key: "arrowdown",
      description: "Next item",
      enabled: true,
      scope,
      command: {
        execute: () => onSelect(1), // Relative increment
      },
    });

    // Arrow Up -> Previous Item
    registerShortcut(`${scope}-up`, {
      key: "arrowup",
      description: "Previous item",
      enabled: true,
      scope,
      command: {
        execute: () => onSelect(-1), // Relative decrement
      },
    });

    // Enter -> Execute
    registerShortcut(`${scope}-enter`, {
      key: "enter",
      description: "Execute selection",
      enabled: true,
      scope,
      command: {
        execute: () => onExecute(-1), // Use current selection
      },
    });

    return () => {
      unregisterShortcut(`${scope}-down`);
      unregisterShortcut(`${scope}-up`);
      unregisterShortcut(`${scope}-enter`);
    };
  }, [
    isOpen,
    itemCount,
    scope,
    registerShortcut,
    unregisterShortcut,
    setActiveScope,
    onSelect,
    onExecute,
  ]);
};
