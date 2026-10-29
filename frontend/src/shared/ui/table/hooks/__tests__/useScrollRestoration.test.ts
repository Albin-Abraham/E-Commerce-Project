import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useScrollRestoration } from "../useScrollRestoration";

function createScrollerRef(scrollTop = 0) {
  const el = document.createElement("div");
  el.scrollTop = scrollTop;
  Object.defineProperty(el, "scrollTo", {
    value: vi.fn(),
    writable: true,
  });
  return { current: el };
}

describe("useScrollRestoration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(1);
      return 1;
    });
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("saves scroll position to sessionStorage on scroll", () => {
    const scrollerRef = createScrollerRef(100);

    renderHook(() =>
      useScrollRestoration({
        tableId: "test-table",
        scrollerRef: scrollerRef as React.RefObject<HTMLDivElement | null>,
      })
    );

    scrollerRef.current!.scrollTop = 250;
    scrollerRef.current!.dispatchEvent(new Event("scroll"));

    act(() => {
      vi.advanceTimersByTime(200);
    });

    const key = Object.keys(sessionStorage).find((k) =>
      k.includes("test-table")
    );
    expect(key).toBeDefined();
    expect(sessionStorage.getItem(key!)).toBe("250");
  });

  it("restores scroll position on mount", () => {
    const path = window.location.pathname;
    const key = `zenith:scroll:restored-table:${path}`;
    sessionStorage.setItem(key, "300");

    const scrollerRef = createScrollerRef(0);

    renderHook(() =>
      useScrollRestoration({
        tableId: "restored-table",
        scrollerRef: scrollerRef as React.RefObject<HTMLDivElement | null>,
      })
    );

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(scrollerRef.current!.scrollTo).toHaveBeenCalledWith({
      top: 300,
      behavior: "instant",
    });
  });

  it("does not restore when enabled=false", () => {
    const path = window.location.pathname;
    const key = `zenith:scroll:disabled-table:${path}`;
    sessionStorage.setItem(key, "300");

    const scrollerRef = createScrollerRef(0);

    renderHook(() =>
      useScrollRestoration({
        tableId: "disabled-table",
        scrollerRef: scrollerRef as React.RefObject<HTMLDivElement | null>,
        enabled: false,
      })
    );

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(scrollerRef.current!.scrollTo).not.toHaveBeenCalled();
  });

  it("clearSavedPosition removes stored position", () => {
    const path = window.location.pathname;
    const key = `zenith:scroll:clear-table:${path}`;
    sessionStorage.setItem(key, "100");

    const scrollerRef = createScrollerRef(0);

    const { result } = renderHook(() =>
      useScrollRestoration({
        tableId: "clear-table",
        scrollerRef: scrollerRef as React.RefObject<HTMLDivElement | null>,
      })
    );

    act(() => {
      result.current.clearSavedPosition();
    });

    expect(sessionStorage.getItem(key)).toBeNull();
  });

  it("does not save when enabled=false", () => {
    const scrollerRef = createScrollerRef(0);

    renderHook(() =>
      useScrollRestoration({
        tableId: "no-save-table",
        scrollerRef: scrollerRef as React.RefObject<HTMLDivElement | null>,
        enabled: false,
      })
    );

    scrollerRef.current!.scrollTop = 500;
    scrollerRef.current!.dispatchEvent(new Event("scroll"));

    act(() => {
      vi.advanceTimersByTime(200);
    });

    const keys = Object.keys(sessionStorage).filter((k) =>
      k.includes("no-save-table")
    );
    expect(keys).toHaveLength(0);
  });

  it("cleans up scroll listener on unmount", () => {
    const scrollerRef = createScrollerRef(0);
    const removeEventListenerSpy = vi.spyOn(
      scrollerRef.current!,
      "removeEventListener"
    );

    const { unmount } = renderHook(() =>
      useScrollRestoration({
        tableId: "cleanup-table",
        scrollerRef: scrollerRef as React.RefObject<HTMLDivElement | null>,
      })
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );
  });
});
