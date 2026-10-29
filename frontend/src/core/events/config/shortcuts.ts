import settingsData from "./settings.json";

/**
 * PlatformCommand
 *
 * Central registry of all actionable commands in the platform.
 */
export enum PlatformCommand {
  FocusSearch = "platform:focus-search",
  ToggleSidebar = "platform:toggle-sidebar",
  Logout = "platform:logout",
  GoHome = "platform:go-home",
  OpenBuilder = "platform:open-builder",
  ToggleFormDevTools = "platform:toggle-form-devtools",
}

export interface ShortcutConfig {
  id: string;
  key: string | string[];
  command: PlatformCommand;
  description: string;
}

export interface PlatformSettings {
  keybindings: ShortcutConfig[];
}

/**
 * GLOBAL_SHORTCUTS
 *
 * Industrial-grade centralized keybinding configuration loaded from settings.json.
 */
export const GLOBAL_SHORTCUTS: ShortcutConfig[] = (settingsData.keybindings || []) as ShortcutConfig[];

