import { useVirtualizer } from "@tanstack/react-virtual";

import { useTableDOM } from "@ui/table/core/TableDOMContext";

/**
 * useTableVirtualizer
 *
 * Wraps @tanstack/react-virtual for use with the ZenithTable scrolling container.
 * Returns a virtualizer instance that manages visible row calculation.
 *
 * @param rowCount - Total number of rows to virtualize
 * @param estimateRowHeight - Estimated row height in pixels (default: 48)
 * @param options - Additional virtualizer options
 */
export function useTableVirtualizer(
  rowCount: number,
  estimateRowHeight = 48,
  options?: { overscan?: number }
) {
  const { scrollerRef } = useTableDOM();

  return useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollerRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: options?.overscan ?? 10,
  });
}
