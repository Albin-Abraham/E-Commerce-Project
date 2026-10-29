/**
 * Tailwind JIT Safelist
 *
 * These classes are generated dynamically at runtime (e.g., `col-span-${n}`,
 * `gap-${n}`, `md:col-span-${n}`) and would be purged by Tailwind's JIT engine
 * unless explicitly listed here.
 *
 * Paste this array into your tailwind.config.js `safelist` option:
 * ```js
 * // tailwind.config.js
 * safelist: [...require('./src/shared/ui/form/utils/tailwind-safelist').SAFELIST]
 * ```
 */

const COL_SPANS = [
  "col-span-1",
  "col-span-2",
  "col-span-3",
  "col-span-4",
  "col-span-5",
  "col-span-6",
  "col-span-7",
  "col-span-8",
  "col-span-9",
  "col-span-10",
  "col-span-11",
  "col-span-12",
];

const MD_COL_SPANS = [
  "md:col-span-1",
  "md:col-span-2",
  "md:col-span-3",
  "md:col-span-4",
  "md:col-span-5",
  "md:col-span-6",
  "md:col-span-7",
  "md:col-span-8",
  "md:col-span-9",
  "md:col-span-10",
  "md:col-span-11",
  "md:col-span-12",
];

const GAP_CLASSES = [
  "gap-0",
  "gap-1",
  "gap-2",
  "gap-3",
  "gap-4",
  "gap-5",
  "gap-6",
  "gap-8",
  "gap-10",
  "gap-12",
];

const GAP_X_CLASSES = [
  "gap-x-0",
  "gap-x-1",
  "gap-x-2",
  "gap-x-3",
  "gap-x-4",
  "gap-x-5",
  "gap-x-6",
  "gap-x-8",
  "gap-x-10",
  "gap-x-12",
];

const GAP_Y_CLASSES = [
  "gap-y-0",
  "gap-y-1",
  "gap-y-2",
  "gap-y-3",
  "gap-y-4",
  "gap-y-5",
  "gap-y-6",
  "gap-y-8",
  "gap-y-10",
  "gap-y-12",
];

const ROW_CLASSES = [
  "row-span-1",
  "row-span-2",
  "row-span-3",
  "row-span-4",
  "row-span-5",
  "row-span-6",
  "row-span-12",
  "row-start-1",
  "row-start-2",
  "row-start-3",
  "row-start-4",
  "col-start-1",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
  "col-start-8",
  "col-start-9",
  "col-start-10",
  "col-start-11",
  "col-start-12",
];

export const SAFELIST = [
  ...COL_SPANS,
  ...MD_COL_SPANS,
  ...GAP_CLASSES,
  ...GAP_X_CLASSES,
  ...GAP_Y_CLASSES,
  ...ROW_CLASSES,
];
