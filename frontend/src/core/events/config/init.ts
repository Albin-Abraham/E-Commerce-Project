import { commandBus } from "../CommandBus";
import { useEventRegistry } from "../stores/eventRegistry.store";
import { GLOBAL_SHORTCUTS } from "./shortcuts";

/**
 * Initialize Global Events
 *
 * Sets up the initial state of the EventRegistry by mapping
 * shortcuts to the CommandBus.
 */
export const initGlobalEvents = () => {
  const registry = useEventRegistry.getState();

  GLOBAL_SHORTCUTS.forEach((config) => {
    const keys = Array.isArray(config.key) ? config.key : [config.key];

    keys.forEach((key, keyIndex) => {
      registry.registerShortcut(`${config.id}-${keyIndex}`, {
        key: key,
        description: config.description,
        enabled: true,
        priority: 0, // Base priority
        scope: "global",
        command: {
          execute: (data) => {
            commandBus.emit(config.command, data);
          },
        },
      });
    });
  });
};
