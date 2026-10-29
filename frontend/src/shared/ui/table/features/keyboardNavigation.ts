/**
 * KeyboardNavigationFeature
 *
 * TableFeature adapter that bridges the existing core infrastructure:
 *   - useGridKeyboardNavigation  → full WAI-ARIA grid cell navigation
 *   - KeyboardDelegationStrategy → routes arrow/page keys through
 *                                   the platform-wide scope system
 *   - eventRegistry.store        → registers scoped shortcuts so keys
 *                                   only fire when this table has focus
 *
 * ## No DOM queries in the hot-path
 *
 * The original naïve implementation called `querySelectorAll` inside
 * `focusFirst`/`focusLast`. This feature delegates to the hook's
 * `getCachedRows()` accessor instead — O(1) array reads from the
 * `MutationObserver`-backed cache that `useGridKeyboardNavigation` maintains.
 *
 * ## Scope bridge
 *
 * When a custom view (board, calendar) is active, `ZenithTableBody` is
 * not rendered — so `useGridKeyboardNavigation` never registers its scope.
 * This feature fills that gap: it registers the scope in `setup()` so the
 * platform `KeyboardDelegationStrategy` still activates/deactivates correctly
 * regardless of which view is visible.
 */

import { useEventRegistry } from "@core/events/stores/eventRegistry.store";
import type { TableFeature } from "../types";

// Must stay in sync with GRID_MOVE_KEYS in useGridKeyboardNavigation.ts
const GRID_MOVE_KEYS: { id: string; key: string }[] = [
  { id: "right", key: "arrowright" },
  { id: "left", key: "arrowleft" },
  { id: "down", key: "arrowdown" },
  { id: "up", key: "arrowup" },
  { id: "home", key: "home" },
  { id: "end", key: "end" },
  { id: "ctrl-home", key: "ctrl+home" },
  { id: "ctrl-end", key: "ctrl+end" },
  { id: "page-down", key: "pagedown" },
  { id: "page-up", key: "pageup" },
];

export interface KeyboardNavigationOptions {
  /**
   * Event-core scope for this table's shortcuts.
   * Defaults to `table:<tableId>` — matches the scope ZenithTableBody
   * passes to useGridKeyboardNavigation.
   */
  scope?: string;
  /** Default: true */
  enabled?: boolean;
}

export interface KeyboardNavigationApi {
  /**
   * Focus the first visible row.
   * Uses the MutationObserver cache from useGridKeyboardNavigation — O(1).
   */
  focusFirst: () => void;
  /**
   * Focus the last visible row.
   * Uses the MutationObserver cache from useGridKeyboardNavigation — O(1).
   */
  focusLast: () => void;
  /** The resolved scope string for this feature instance. */
  readonly scope: string;
  /**
   * Called by ZenithTableBody after useGridKeyboardNavigation mounts.
   * Injects the hook's focusCell and getCachedRows so focusFirst/focusLast
   * use the shared cache instead of their own DOM queries.
   */
  _registerNavigator: (nav: {
    focusCell: (row: number, col: number) => void;
    getCachedRows: () => HTMLElement[];
  }) => void;
}

export function KeyboardNavigationFeature(
  options?: KeyboardNavigationOptions
): TableFeature<any, KeyboardNavigationApi> {
  let resolvedScope = "";

  // Navigator bridge injected by ZenithTableBody after the hook mounts.
  // Falls back to a DOM query ONLY if the Body never registers
  // (e.g. pure custom view with no table rendered at all).
  let navigatorRef: {
    focusCell: (row: number, col: number) => void;
    getCachedRows: () => HTMLElement[];
  } | null = null;

  // Fallback container ref for non-table views
  let containerEl: HTMLElement | null = null;

  const api: KeyboardNavigationApi = {
    get scope() {
      return resolvedScope;
    },

    _registerNavigator(nav) {
      navigatorRef = nav;
    },

    focusFirst() {
      if (navigatorRef) {
        // O(1) — reads from MutationObserver cache
        const rows = navigatorRef.getCachedRows();
        if (rows.length > 0) {
          navigatorRef.focusCell(0, 0);
        }
      } else {
        // Fallback for pure custom views (board/calendar) — one-shot query
        // is acceptable here since focusFirst is only called imperatively,
        // not on every keydown.
        const firstRow = containerEl?.querySelector<HTMLElement>(
          "[data-table-row], [data-zenith-navigable='true']"
        );
        firstRow?.focus();
      }
    },

    focusLast() {
      if (navigatorRef) {
        // O(1) — reads from MutationObserver cache
        const rows = navigatorRef.getCachedRows();
        if (rows.length > 0) {
          navigatorRef.focusCell(rows.length - 1, 0);
        }
      } else {
        // Fallback — querySelectorAll once per user action (not hot-path)
        const allRows = containerEl?.querySelectorAll<HTMLElement>(
          "[data-table-row], [data-zenith-navigable='true']"
        );
        if (allRows?.length) {
          allRows[allRows.length - 1].focus();
        }
      }
    },
  };

  return {
    name: "keyboardNavigation",
    api,

    setup: ({ tableId, domRefs }) => {
      const enabled = options?.enabled ?? true;
      if (!enabled) return;

      containerEl = domRefs.containerRef.current;
      resolvedScope = options?.scope ?? `table:${tableId}`;

      const { registerShortcut, unregisterShortcut, setActiveScope } =
        useEventRegistry.getState();

      // Register scoped shortcut placeholders so KeyboardDelegationStrategy
      // knows this scope exists and keeps the scope active. Actual movement
      // is handled by ZenithTableBody's useGridKeyboardNavigation handler —
      // stopPropagation prevents double-firing.
      const shortcutIds = GRID_MOVE_KEYS.map(({ id, key }) => {
        const shortcutId = `${resolvedScope}:grid:${id}`;
        registerShortcut(shortcutId, {
          key,
          description: `Table grid nav: ${id}`,
          enabled: true,
          priority: 50,
          scope: resolvedScope,
          command: {
            execute: () => {
              // No-op: movement is owned by useGridKeyboardNavigation in Body.
              // This entry exists only to hold the scope in the registry.
            },
          },
        });
        return shortcutId;
      });

      // Scope activation — mirrors useGridKeyboardNavigation focusin/focusout
      // so the scope works even when Body is not rendered (board/calendar views).
      let previousScope = "global";

      const onFocusIn = () => {
        const current = useEventRegistry.getState().activeScope;
        if (current !== resolvedScope) previousScope = current;
        setActiveScope(resolvedScope);
      };

      const onFocusOut = (event: FocusEvent) => {
        if (containerEl?.contains(event.relatedTarget as Node | null)) return;
        setActiveScope(previousScope);
      };

      containerEl?.addEventListener("focusin", onFocusIn);
      containerEl?.addEventListener("focusout", onFocusOut);

      return () => {
        shortcutIds.forEach((id) => unregisterShortcut(id));
        containerEl?.removeEventListener("focusin", onFocusIn);
        containerEl?.removeEventListener("focusout", onFocusOut);
        if (useEventRegistry.getState().activeScope === resolvedScope) {
          setActiveScope(previousScope);
        }
        navigatorRef = null;
        containerEl = null;
      };
    },
  };
}
