import { useEffect } from "react";

import { commandBus } from "@core/events/CommandBus";
import { PlatformCommand } from "@core/events/config/shortcuts";

/**
 * Registry of Type Contracts for all core Navigation Commands
 */
export interface NavigationCommands {
  [PlatformCommand.GoHome]: { replace?: boolean } | undefined;
  [PlatformCommand.OpenBuilder]: { templateId?: string } | undefined;
  [PlatformCommand.Logout]: undefined;
  [PlatformCommand.ToggleSidebar]: undefined;
  [PlatformCommand.FocusSearch]: undefined;
}

/**
 * useCommandBus
 *
 * High-fidelity custom hook that binds a set of typed command handlers
 * to the global commandBus. Guarantees compile-time type safety for command payloads
 * and handles clean unsubscription on component unmount.
 */
export function useCommandBus<T extends Record<string, any>>(handlers: {
  [K in keyof T]: (payload: T[K]) => void;
}) {
  useEffect(() => {
    const unsubs = Object.entries(handlers).map(([commandId, handler]) => {
      // Map string enum values or string keys to the CommandBus listeners
      return commandBus.on(commandId, handler as any);
    });

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [handlers]);
}
