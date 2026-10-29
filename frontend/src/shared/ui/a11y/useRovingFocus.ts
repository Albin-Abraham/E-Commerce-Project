import { useCallback, useEffect, useRef, useState } from "react";
import { useEventRegistry } from "@core/events/stores/eventRegistry.store";

export type RovingOrientation = "horizontal" | "vertical" | "both";
export type RovingActivation = "automatic" | "manual";

export interface RovingItem {
  id: string;
  element: HTMLElement | null;
  disabled?: boolean;
}

export interface UseRovingFocusOptions {
  /** Orientation of arrow key navigation. Default: "horizontal" */
  orientation?: RovingOrientation;
  /** Whether navigation wraps around at the ends. Default: true */
  loop?: boolean;
  /** Text direction for RTL arrow flipping. Default: "ltr" */
  dir?: "ltr" | "rtl";
  /** Initial active item id */
  defaultActiveId?: string;
  /** Controlled active item id */
  activeId?: string;
  /** Callback fired when the active item changes */
  onActiveChange?: (id: string) => void;
  /** Callback fired when an item is selected/activated (e.g. Enter or Space in manual mode, or arrow key in automatic mode) */
  onSelect?: (id: string) => void;
  /** Activation mode: "automatic" immediately selects on focus, "manual" requires Enter/Space. Default: "automatic" */
  activation?: RovingActivation;
  /** Optional keyboard scope for @core/events registry integration */
  scope?: string;
}

export interface UseRovingFocusReturn {
  activeId: string | null;
  setActiveId: (id: string) => void;
  registerItem: (id: string, element: HTMLElement | null, disabled?: boolean) => void;
  unregisterItem: (id: string) => void;
  getContainerProps: () => {
    onKeyDown: (e: React.KeyboardEvent) => void;
    tabIndex: number;
  };
  getItemProps: (id: string, options?: { disabled?: boolean }) => {
    tabIndex: number;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onClick: (e: React.MouseEvent) => void;
    ref: (el: HTMLElement | null) => void;
  };
}

/**
 * useRovingFocus
 *
 * Implements the WAI-ARIA Roving Tabindex design pattern.
 * Coordinates 1D or 2D keyboard navigation (Arrows, Home, End),
 * managing dynamic tabindex="0" vs tabindex="-1" and programmatic focus transfer.
 */
export function useRovingFocus({
  orientation = "horizontal",
  loop = true,
  dir = "ltr",
  defaultActiveId,
  activeId: controlledActiveId,
  onActiveChange,
  onSelect,
  activation = "automatic",
  scope,
}: UseRovingFocusOptions = {}): UseRovingFocusReturn {
  const [internalActiveId, setInternalActiveId] = useState<string | null>(
    defaultActiveId ?? null
  );

  const activeId = controlledActiveId !== undefined ? controlledActiveId : internalActiveId;
  const itemsRef = useRef<Map<string, { element: HTMLElement | null; disabled?: boolean }>>(
    new Map()
  );

  const setActiveScope = useEventRegistry((s) => s.setActiveScope);

  useEffect(() => {
    if (scope) {
      setActiveScope(scope);
      return () => {
        setActiveScope("global");
      };
    }
  }, [scope, setActiveScope]);

  const updateActiveId = useCallback(
    (id: string, shouldSelect = false) => {
      if (controlledActiveId === undefined) {
        setInternalActiveId(id);
      }
      onActiveChange?.(id);
      if (shouldSelect) {
        onSelect?.(id);
      }

      // Focus the DOM node
      const item = itemsRef.current.get(id);
      if (item?.element && !item.disabled) {
        item.element.focus();
      }
    },
    [controlledActiveId, onActiveChange, onSelect]
  );

  const registerItem = useCallback(
    (id: string, element: HTMLElement | null, disabled?: boolean) => {
      itemsRef.current.set(id, { element, disabled });

      // If activeId is not set, set it to the first enabled item
      if (!activeId && !disabled && element) {
        if (controlledActiveId === undefined) {
          setInternalActiveId(id);
        }
      }
    },
    [activeId, controlledActiveId]
  );

  const unregisterItem = useCallback((id: string) => {
    itemsRef.current.delete(id);
  }, []);

  const getEnabledItems = useCallback(() => {
    const list: { id: string; element: HTMLElement }[] = [];
    itemsRef.current.forEach((val, id) => {
      if (!val.disabled && val.element) {
        list.push({ id, element: val.element });
      }
    });
    // Sort in DOM tree order if elements are attached
    list.sort((a, b) => {
      if (a.element.compareDocumentPosition) {
        const pos = a.element.compareDocumentPosition(b.element);
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      }
      return 0;
    });
    return list;
  }, []);

  const navigate = useCallback(
    (delta: number) => {
      const enabled = getEnabledItems();
      if (enabled.length === 0) return;

      const currentIndex = enabled.findIndex((item) => item.id === activeId);
      let targetIndex = -1;

      if (currentIndex === -1) {
        targetIndex = delta > 0 ? 0 : enabled.length - 1;
      } else {
        const next = currentIndex + delta;
        if (loop) {
          targetIndex = (next + enabled.length) % enabled.length;
        } else {
          targetIndex = Math.max(0, Math.min(next, enabled.length - 1));
        }
      }

      const target = enabled[targetIndex];
      if (target) {
        updateActiveId(target.id, activation === "automatic");
      }
    },
    [activeId, activation, getEnabledItems, loop, updateActiveId]
  );

  const navigateToEdge = useCallback(
    (edge: "first" | "last") => {
      const enabled = getEnabledItems();
      if (enabled.length === 0) return;
      const target = edge === "first" ? enabled[0] : enabled[enabled.length - 1];
      if (target) {
        updateActiveId(target.id, activation === "automatic");
      }
    },
    [activation, getEnabledItems, updateActiveId]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isRtl = dir === "rtl";
      const nextKey = orientation === "vertical" ? "ArrowDown" : isRtl ? "ArrowLeft" : "ArrowRight";
      const prevKey = orientation === "vertical" ? "ArrowUp" : isRtl ? "ArrowRight" : "ArrowLeft";

      if (orientation === "both") {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          navigate(1);
          return;
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          navigate(-1);
          return;
        }
      } else {
        if (e.key === nextKey) {
          e.preventDefault();
          navigate(1);
          return;
        }
        if (e.key === prevKey) {
          e.preventDefault();
          navigate(-1);
          return;
        }
      }

      if (e.key === "Home") {
        e.preventDefault();
        navigateToEdge("first");
        return;
      }

      if (e.key === "End") {
        e.preventDefault();
        navigateToEdge("last");
        return;
      }

      if ((e.key === "Enter" || e.key === " ") && activation === "manual") {
        if (activeId) {
          const item = itemsRef.current.get(activeId);
          if (item && !item.disabled) {
            e.preventDefault();
            onSelect?.(activeId);
          }
        }
      }
    },
    [activation, activeId, dir, navigate, navigateToEdge, onSelect, orientation]
  );

  const getContainerProps = useCallback(
    () => ({
      onKeyDown: handleKeyDown,
      tabIndex: -1,
    }),
    [handleKeyDown]
  );

  const getItemProps = useCallback(
    (id: string, options?: { disabled?: boolean }) => {
      const isSelected = activeId === id;
      const isDisabled = Boolean(options?.disabled);

      return {
        tabIndex: isSelected && !isDisabled ? 0 : -1,
        onKeyDown: handleKeyDown,
        onClick: (e: React.MouseEvent) => {
          if (isDisabled) {
            e.preventDefault();
            return;
          }
          updateActiveId(id, true);
        },
        ref: (el: HTMLElement | null) => {
          registerItem(id, el, isDisabled);
        },
      };
    },
    [activeId, handleKeyDown, registerItem, updateActiveId]
  );

  return {
    activeId,
    setActiveId: updateActiveId,
    registerItem,
    unregisterItem,
    getContainerProps,
    getItemProps,
  };
}
