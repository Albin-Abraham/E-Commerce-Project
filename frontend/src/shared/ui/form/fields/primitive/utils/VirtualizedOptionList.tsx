import React, { useRef, useState, useMemo, useCallback } from "react";

export interface VirtualizedOptionListProps<T = any> {
  /** Array of items/options to display */
  items: ReadonlyArray<T>;
  /** Fixed item height in pixels (default: 36) */
  itemHeight?: number;
  /** Viewport max-height in pixels (default: 260) */
  maxHeight?: number;
  /** Overscan buffer items to render above and below visible window (default: 4) */
  overscan?: number;
  /** Render callback for each visible item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Additional container CSS class */
  className?: string;
  /** Scroll callback (e.g. for threshold loading or active item tracking) */
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  /** Ref forwarded to the scrollable container */
  containerRef?: React.Ref<HTMLDivElement>;
}

/**
 * VirtualizedOptionList — Zero-Dependency Pure React Windowed Virtual Scrolling.
 *
 * Slices options dynamically based on scroll position so massive datasets (> 5,000 items)
 * render instantaneously with 60 FPS performance and only 12-20 DOM nodes at any time.
 */
export function VirtualizedOptionList<T = any>({
  items,
  itemHeight = 36,
  maxHeight = 260,
  overscan = 4,
  renderItem,
  className = "",
  onScroll,
  containerRef: externalRef,
}: VirtualizedOptionListProps<T>): React.ReactElement {
  const localRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  // Calculate visible range
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(maxHeight / itemHeight) + overscan * 2;
    const end = Math.min(items.length, start + visibleCount);
    const top = start * itemHeight;
    return { startIndex: start, endIndex: end, offsetY: top };
  }, [scrollTop, itemHeight, maxHeight, overscan, items.length]);

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
      if (onScroll) onScroll(e);
    },
    [onScroll]
  );

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      localRef.current = node;
      if (typeof externalRef === "function") {
        externalRef(node);
      } else if (externalRef && "current" in externalRef) {
        (externalRef as any).current = node;
      }
    },
    [externalRef]
  );

  return (
    <div
      ref={setRef}
      onScroll={handleScroll}
      style={{ maxHeight, overflowY: "auto" }}
      className={`relative w-full ${className}`}
      tabIndex={-1}
      role="listbox"
    >
      <div style={{ height: totalHeight, width: "100%", position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) =>
            renderItem(item, startIndex + index)
          )}
        </div>
      </div>
    </div>
  );
}
