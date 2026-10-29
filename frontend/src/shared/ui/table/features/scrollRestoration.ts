import type { TableFeature } from "../types";

export interface ScrollRestorationFeatureOptions {
  /** Custom storage key identifier (defaults to tableId) */
  key?: string;
  /** Debounce delay in ms before storing scroll position (default: 150ms) */
  debounceMs?: number;
}

export interface ScrollRestorationApi {
  scrollToTop: (behavior?: ScrollBehavior) => void;
  restoreNow: () => void;
}

export function ScrollRestorationFeature(
  options?: ScrollRestorationFeatureOptions
): TableFeature<any, ScrollRestorationApi> {
  let removeListener: (() => void) | null = null;
  let currentScroller: HTMLDivElement | null = null;
  let currentKey = "";

  const api: ScrollRestorationApi = {
    scrollToTop: (behavior = "smooth") => {
      currentScroller?.scrollTo({ top: 0, behavior });
    },
    restoreNow: () => {
      if (!currentScroller || !currentKey) return;
      try {
        const saved = sessionStorage.getItem(currentKey);
        if (saved) {
          currentScroller.scrollTo({ top: Number(saved), behavior: "instant" });
        }
      } catch {
        // Silently ignore sessionStorage access failure
      }
    },
  };

  return {
    name: "scrollRestoration",
    api,
    setup: ({ tableId, domRefs, viewMode }) => {
      const el = domRefs.scrollerRef.current;
      if (!el) return;

      currentScroller = el;
      const path = typeof window !== "undefined" ? window.location.pathname : "/";
      const storageKey = `zenith:scroll:${options?.key || tableId}:${viewMode}:${path}`;
      currentKey = storageKey;

      // Restore scroll on mount / view switch
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          requestAnimationFrame(() => {
            el.scrollTo({ top: Number(saved), behavior: "instant" });
          });
        }
      } catch {
        // sessionStorage unavailable in sandboxed iframes
      }

      // Save scroll on listener (debounced)
      let timer: ReturnType<typeof setTimeout> | null = null;
      const onScroll = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            sessionStorage.setItem(storageKey, String(el.scrollTop));
          } catch {
            // ignore quota or security errors
          }
        }, options?.debounceMs ?? 150);
      };

      el.addEventListener("scroll", onScroll, { passive: true });
      removeListener = () => {
        if (timer) clearTimeout(timer);
        el.removeEventListener("scroll", onScroll);
      };
    },
    destroy: () => {
      removeListener?.();
      currentScroller = null;
    },
  };
}
