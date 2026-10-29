import { create } from "zustand";

import type { ICommand } from "../interfaces/ICommand";

export interface ShortcutDefinition {
  key: string;
  command: ICommand<any, any>;
  description: string;
  enabled: boolean;
  priority?: number; // Higher number = higher priority
  scope?: string;
}

export interface MouseActionDefinition {
  selector: string;
  command: ICommand<any, any>;
  description: string;
  enabled: boolean;
}

interface EventRegistryState {
  shortcuts: Record<string, ShortcutDefinition>;
  mouseActions: Record<string, MouseActionDefinition>;
  activeScope: string;

  registerShortcut: (id: string, definition: ShortcutDefinition) => void;
  unregisterShortcut: (id: string) => void;
  toggleShortcut: (id: string, enabled: boolean) => void;
  setActiveScope: (scope: string) => void;

  registerMouseAction: (id: string, definition: MouseActionDefinition) => void;
  unregisterMouseAction: (id: string) => void;
}

/**
 * Zustand Store for Global Event Registry
 * Managed as Infrastructure layer to track active delegation rules.
 */
export const useEventRegistry = create<EventRegistryState>((set) => ({
  shortcuts: {},
  mouseActions: {},
  activeScope: "global",

  setActiveScope: (scope) => set({ activeScope: scope }),

  registerShortcut: (id, definition) =>
    set((state) => ({
      shortcuts: { ...state.shortcuts, [id]: definition },
    })),

  unregisterShortcut: (id) =>
    set((state) => {
      const { [id]: _, ...remaining } = state.shortcuts;
      return { shortcuts: remaining };
    }),

  toggleShortcut: (id, enabled) =>
    set((state) => ({
      shortcuts: {
        ...state.shortcuts,
        [id]: state.shortcuts[id]
          ? { ...state.shortcuts[id], enabled }
          : state.shortcuts[id],
      },
    })),

  registerMouseAction: (id, definition) =>
    set((state) => ({
      mouseActions: { ...state.mouseActions, [id]: definition },
    })),

  unregisterMouseAction: (id) =>
    set((state) => {
      const { [id]: _, ...remaining } = state.mouseActions;
      return { mouseActions: remaining };
    }),
}));
