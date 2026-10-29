import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

/**
 * @file LayoutManagerContext.tsx
 * @description Phase 3 of Runtime Context refactor.
 *
 * The LayoutManager provides imperative control over layout nodes
 * (Tabs, Accordion, SplitPane, Tree) without prop drilling.
 *
 * ## Design Principles
 * - Each layout node (TabsField, AccordionField) registers itself on mount.
 * - External code (e.g., FormValidator jumping to an error tab) calls
 *   `layoutManager.tabs.setActiveTab(nodeId, tabId)` imperatively.
 * - The manager uses a ref-based registry — no re-renders unless state changes.
 *
 * ## Usage
 *
 * ### Inside a layout driver (TabsField):
 * ```tsx
 * const { tabs } = useLayoutManager();
 * const { activeTab, setActiveTab } = tabs.use(field.id, tabs[0]?.id ?? "");
 * ```
 *
 * ### Imperatively (e.g., from FormValidator on submit error):
 * ```ts
 * const { tabs } = useLayoutManager();
 * tabs.setActiveTab("settings_tabs_id", "security_tab_id");
 * ```
 */

// ── Tabs State ──────────────────────────────────────────────────────────────

interface TabsEntry {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

interface TabsManager {
  /** Register a new tabs node and get reactive state + setter. */
  use: (nodeId: string, initialTabId: string) => TabsEntry;
  /** Imperatively set the active tab of a registered Tabs node. */
  setActiveTab: (nodeId: string, tabId: string) => void;
  /** Get the current active tab ID for a node (non-reactive). */
  getActiveTab: (nodeId: string) => string | undefined;
}

// ── Accordion State ─────────────────────────────────────────────────────────

interface AccordionEntry {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

interface AccordionManager {
  /** Register a new accordion node and get reactive state + controls. */
  use: (nodeId: string, defaultOpen: boolean) => AccordionEntry;
  /** Imperatively open or close a registered accordion node. */
  setOpen: (nodeId: string, open: boolean) => void;
  /** Toggle an accordion node open/closed. */
  toggle: (nodeId: string) => void;
  /** Get the current open state for a node (non-reactive). */
  isOpen: (nodeId: string) => boolean;
}

// ── Context Value ───────────────────────────────────────────────────────────

export interface LayoutManagerContextValue {
  tabs: TabsManager;
  accordion: AccordionManager;
}

// ── Implementation ──────────────────────────────────────────────────────────

/**
 * A lightweight reactive store for a single layout node's state.
 * Uses a ref + external state subscription pattern to avoid
 * re-rendering the whole tree when one node changes.
 */
function useNodeState<T>(
  nodeId: string,
  initial: T,
  registryRef: React.MutableRefObject<
    Map<string, { state: T; setState: (v: T) => void }>
  >
) {
  const [state, setState] = useState<T>(() => {
    return registryRef.current.get(nodeId)?.state ?? initial;
  });

  // Register on first render
  if (!registryRef.current.has(nodeId)) {
    registryRef.current.set(nodeId, { state, setState });
  }

  // Keep the registry in sync with the current setter
  const entry = registryRef.current.get(nodeId)!;
  entry.setState = setState;
  entry.state = state;

  return [state, setState] as const;
}

// ── Context ─────────────────────────────────────────────────────────────────

const LayoutManagerContext = createContext<
  LayoutManagerContextValue | undefined
>(undefined);

/**
 * `LayoutManagerProvider` — wraps a form/surface subtree that contains
 * layout nodes (Tabs, Accordion, etc.).
 *
 * Typically placed at the same level as `FormOrchestratorProvider`.
 */
export const LayoutManagerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // Registry refs — store per-node state without triggering context re-renders
  const tabsRegistry = useRef<
    Map<string, { state: string; setState: (v: string) => void }>
  >(new Map());
  const accordionRegistry = useRef<
    Map<string, { state: boolean; setState: (v: boolean) => void }>
  >(new Map());

  // ── Tabs Manager ────────────────────────────────────────────────────────

  // We need a stable hook-based use() for Tabs. We use a separate component pattern.
  // The imperative methods operate on the registry directly.
  const tabsSetActiveTab = useCallback((nodeId: string, tabId: string) => {
    const entry = tabsRegistry.current.get(nodeId);
    if (entry) {
      entry.setState(tabId);
    } else {
      // Pre-register so when the node mounts it picks up the queued state
      tabsRegistry.current.set(nodeId, {
        state: tabId,
        setState: (v) => {
          const e = tabsRegistry.current.get(nodeId);
          if (e) e.state = v;
        },
      });
    }
  }, []);

  const tabsGetActiveTab = useCallback((nodeId: string) => {
    return tabsRegistry.current.get(nodeId)?.state;
  }, []);

  // ── Accordion Manager ────────────────────────────────────────────────────

  const accordionSetOpen = useCallback((nodeId: string, open: boolean) => {
    const entry = accordionRegistry.current.get(nodeId);
    if (entry) {
      entry.setState(open);
    } else {
      accordionRegistry.current.set(nodeId, {
        state: open,
        setState: (v) => {
          const e = accordionRegistry.current.get(nodeId);
          if (e) e.state = v;
        },
      });
    }
  }, []);

  const accordionToggle = useCallback((nodeId: string) => {
    const entry = accordionRegistry.current.get(nodeId);
    if (entry) {
      entry.setState(!entry.state);
    }
  }, []);

  const accordionIsOpen = useCallback((nodeId: string) => {
    return accordionRegistry.current.get(nodeId)?.state ?? false;
  }, []);

  // The `use()` hooks need to be stable factory functions that work inside
  // React components. We store them as stable callbacks.
  const tabsUseRef = useRef(
    (_nodeId: string, _initialTabId: string): TabsEntry => {
      // This is called inside a component, so useState works via useNodeState.
      // We provide this as a hook factory — see useLayoutNode* helpers below.
      throw new Error(
        "tabs.use() must be called via useTabsNode() hook, not directly."
      );
    }
  );

  const accordionUseRef = useRef(
    (_nodeId: string, _defaultOpen: boolean): AccordionEntry => {
      throw new Error(
        "accordion.use() must be called via useAccordionNode() hook, not directly."
      );
    }
  );

  const value: LayoutManagerContextValue = {
    tabs: {
      use: tabsUseRef.current,
      setActiveTab: tabsSetActiveTab,
      getActiveTab: tabsGetActiveTab,
    },
    accordion: {
      use: accordionUseRef.current,
      setOpen: accordionSetOpen,
      toggle: accordionToggle,
      isOpen: accordionIsOpen,
    },
  };

  return (
    <LayoutManagerContext.Provider value={value}>
      <TabsRegistryContext.Provider value={tabsRegistry}>
        <AccordionRegistryContext.Provider value={accordionRegistry}>
          {children}
        </AccordionRegistryContext.Provider>
      </TabsRegistryContext.Provider>
    </LayoutManagerContext.Provider>
  );
};

// ── Registry Contexts (internal) ─────────────────────────────────────────────

const TabsRegistryContext = createContext<
  React.MutableRefObject<
    Map<string, { state: string; setState: (v: string) => void }>
  >
>({ current: new Map() });

const AccordionRegistryContext = createContext<
  React.MutableRefObject<
    Map<string, { state: boolean; setState: (v: boolean) => void }>
  >
>({ current: new Map() });

// ── Public Hooks ─────────────────────────────────────────────────────────────

/**
 * Access the LayoutManager's imperative API.
 *
 * @example
 * // Jump to a tab from a submit-error handler:
 * const { tabs } = useLayoutManager();
 * tabs.setActiveTab("settings_node_id", "security_tab_id");
 */
export const useLayoutManager = (): LayoutManagerContextValue => {
  const ctx = useContext(LayoutManagerContext);
  if (!ctx) {
    // Graceful fallback when used outside LayoutManagerProvider
    return {
      tabs: {
        use: () => ({ activeTab: "", setActiveTab: () => {} }),
        setActiveTab: () => {},
        getActiveTab: () => undefined,
      },
      accordion: {
        use: () => ({ isOpen: false, setOpen: () => {}, toggle: () => {} }),
        setOpen: () => {},
        toggle: () => {},
        isOpen: () => false,
      },
    };
  }
  return ctx;
};

/**
 * `useTabsNode` — called inside a `TabsField` component.
 *
 * Registers the node with the LayoutManager and returns reactive state.
 * External code can then call `layoutManager.tabs.setActiveTab(nodeId, tabId)`
 * to imperatively control which tab is active.
 *
 * @example
 * const { activeTab, setActiveTab } = useTabsNode(field.id, tabs[0]?.id ?? "");
 */
export const useTabsNode = (
  nodeId: string,
  initialTabId: string
): TabsEntry => {
  const registryRef = useContext(TabsRegistryContext);
  const [activeTab, setActiveTabState] = useNodeState(
    nodeId,
    initialTabId,
    registryRef
  );

  const setActiveTab = useCallback(
    (tabId: string) => {
      setActiveTabState(tabId);
      const entry = registryRef.current.get(nodeId);
      if (entry) entry.state = tabId;
    },
    [nodeId, registryRef, setActiveTabState]
  );

  return { activeTab, setActiveTab };
};

/**
 * `useAccordionNode` — called inside an `AccordionField` component.
 *
 * Registers the node with the LayoutManager and returns reactive open/close state.
 * External code can call `layoutManager.accordion.setOpen(nodeId, true)` to
 * imperatively expand the accordion (e.g., to reveal a validation error).
 *
 * @example
 * const { isOpen, setOpen, toggle } = useAccordionNode(field.id, false);
 */
export const useAccordionNode = (
  nodeId: string,
  defaultOpen: boolean
): AccordionEntry => {
  const registryRef = useContext(AccordionRegistryContext);
  const [isOpen, setOpenState] = useNodeState(nodeId, defaultOpen, registryRef);

  const setOpen = useCallback(
    (open: boolean) => {
      setOpenState(open);
      const entry = registryRef.current.get(nodeId);
      if (entry) entry.state = open;
    },
    [nodeId, registryRef, setOpenState]
  );

  const toggle = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen, setOpen]);

  return { isOpen, setOpen, toggle };
};
