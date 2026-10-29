import { PlatformUrlAdapters } from "@core/router/adapters/PlatformUrlAdapters";
import type { TableUrlPort } from "../TableUrlPort";

/**
 * TableUrlAdapters
 *
 * Concrete implementations of TableUrlPort backed by PlatformUrlAdapters.
 * Unifies the URL layer between ZenithTable and MDAP Form engines.
 *
 * The table depends only on TableUrlPort (PlatformUrlPort) — never on react-router directly.
 */
export const TableUrlAdapters = Object.freeze({
  /**
   * useReactRouter — React Router v6 adapter (reactive, re-runs on URL change)
   * Ref-stabilized to prevent infinite re-render loops while preserving unencoded colons (`:`).
   */
  useReactRouter(replace = true): TableUrlPort {
    return PlatformUrlAdapters.useReactRouter({
      isGlobal: true,
      replace,
      debounceMs: 0, // ZenithTable already debounces outbound writes in useTableUrlWriter
    });
  },

  /**
   * useNative — Native window.location adapter (no react-router dependency)
   */
  useNative(replace = true): TableUrlPort {
    return PlatformUrlAdapters.useNative({
      replace,
      debounceMs: 0,
    });
  },

  /**
   * createMock — In-memory adapter for unit tests.
   * No browser dependency — works in jsdom or node.
   */
  createMock(
    initial: Record<string, string | string[]> = {}
  ): TableUrlPort & { _store: Map<string, string[]> } {
    return PlatformUrlAdapters.createMock(initial);
  },
});
