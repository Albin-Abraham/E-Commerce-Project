/**
 * Generates the array of page numbers (and "..." ellipsis) for pagination.
 *
 * Always shows: first page, last page, current ± sideWidth, and ellipsis for gaps.
 * Returns at most maxVisible entries (not counting ellipsis).
 */
export function getPageNumbers(
  current: number,
  total: number,
  maxVisible: number = 7
): (number | "...")[] {
  if (total <= 0) return [];
  if (total === 1) return [1];
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];
  const sideWidth = Math.floor((maxVisible - 3) / 2);

  // Always show first page
  pages.push(1);

  // Calculate window around current page
  const windowStart = Math.max(2, current - sideWidth);
  const windowEnd = Math.min(total - 1, current + sideWidth);

  // Ellipsis before window if needed
  if (windowStart > 2) pages.push("...");

  // Pages in window
  for (let i = windowStart; i <= windowEnd; i++) {
    pages.push(i);
  }

  // Ellipsis after window if needed
  if (windowEnd < total - 1) pages.push("...");

  // Always show last page
  pages.push(total);

  return pages;
}

/**
 * Computes the range label values (from, to) for a given page/pageSize/total.
 */
export function getPageRange(
  page: number,
  pageSize: number,
  total: number
): { from: number; to: number } {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return { from, to };
}
