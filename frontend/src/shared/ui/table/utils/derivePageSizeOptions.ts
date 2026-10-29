/**
 * derivePageSizeOptions
 *
 * Pure dynamic helper function that derives smart page size dropdown options
 * based on total record count. Automatically caps oversized options at exact totalCount.
 *
 * @param totalCount - Total number of items across all pages
 * @param baseOptions - Base page size options (defaults to [10, 25, 50, 100])
 * @returns Array of unique page size options capped at exact totalCount
 *
 * @example
 * derivePageSizeOptions(5)   // => [5]
 * derivePageSizeOptions(25)  // => [10, 25]
 * derivePageSizeOptions(80)  // => [10, 25, 50, 80]
 * derivePageSizeOptions(150) // => [10, 25, 50, 100]
 */
export function derivePageSizeOptions(
  totalCount: number,
  baseOptions: number[] = [10, 25, 50, 100]
): number[] {
  if (totalCount <= 0) return baseOptions;

  const sorted = Array.from(new Set(baseOptions)).sort((a, b) => a - b);
  const result: number[] = [];

  for (const option of sorted) {
    if (option < totalCount) {
      result.push(option);
    } else if (option === totalCount) {
      result.push(option);
      break;
    } else {
      // Option is greater than totalCount: cap at exact totalCount for viewing all records
      result.push(totalCount);
      break;
    }
  }

  return Array.from(new Set(result));
}
