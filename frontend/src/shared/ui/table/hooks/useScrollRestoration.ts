import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * useScrollRestoration
 *
 * Saves and restores scroll position via sessionStorage.
 * Keyed by table ID + route path so multiple tables on different pages
 * have independent scroll memory.
 *
 * Yafei pattern: when user navigates list → detail → back to list,
 * the list scrolls back to where they were.
 */

const STORAGE_PREFIX = "zenith:scroll:";
const DEBOUNCE_MS = 150;

function getStorageKey(tableId: string): string {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  return `${STORAGE_PREFIX}${tableId}:${path}`;
}

export interface UseScrollRestorationOptions {
  /** Table instance ID (from meta.id) */
  tableId: string;
  /** Scroller element ref */
  scrollerRef: RefObject<HTMLDivElement | null>;
  /** Enable/disable restoration — default: true */
  enabled?: boolean;
}

export function useScrollRestoration({
  tableId,
  scrollerRef,
  enabled = true,
}: UseScrollRestorationOptions) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRestoredRef = useRef(false);

  // Save scroll position (debounced)
  const saveScrollPosition = useCallback(() => {
    if (!enabled || !scrollerRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const key = getStorageKey(tableId);
      try {
        sessionStorage.setItem(key, String(el.scrollTop));
      } catch {
        // sessionStorage may be full or unavailable — silently ignore
      }
    }, DEBOUNCE_MS);
  }, [enabled, tableId, scrollerRef]);

  // Restore scroll position on mount
  useEffect(() => {
    if (!enabled || !scrollerRef.current || hasRestoredRef.current) return;

    const key = getStorageKey(tableId);
    try {
      const saved = sessionStorage.getItem(key);
      if (saved !== null) {
        const scrollTop = parseInt(saved, 10);
        if (!isNaN(scrollTop) && scrollTop > 0) {
          // Use requestAnimationFrame to ensure the scroller is rendered
          requestAnimationFrame(() => {
            scrollerRef.current?.scrollTo({
              top: scrollTop,
              behavior: "instant",
            });
          });
        }
      }
    } catch {
      // sessionStorage may be unavailable — silently ignore
    }

    hasRestoredRef.current = true;
  }, [enabled, tableId, scrollerRef]);

  // Attach scroll listener
  useEffect(() => {
    if (!enabled) return;
    const el = scrollerRef.current;
    if (!el) return;

    el.addEventListener("scroll", saveScrollPosition, { passive: true });
    return () => {
      el.removeEventListener("scroll", saveScrollPosition);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [enabled, scrollerRef, saveScrollPosition]);

  // Clear saved position (e.g., after filter change or explicit reset)
  const clearSavedPosition = useCallback(() => {
    const key = getStorageKey(tableId);
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [tableId]);

  return { clearSavedPosition };
}
