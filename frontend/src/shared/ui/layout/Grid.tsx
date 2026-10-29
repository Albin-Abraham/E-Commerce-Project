import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@libs/utils";

import {
  type ModifierProps,
  extractModifiers,
  getModifierClasses,
} from "./modifiers";

const gridVariants = cva("grid", {
  variants: {
    columns: {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
      7: "grid-cols-7",
      8: "grid-cols-8",
      9: "grid-cols-9",
      10: "grid-cols-10",
      11: "grid-cols-11",
      12: "grid-cols-12",
    },
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
      "2xl": "gap-12",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      baseline: "items-baseline",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
  },
  defaultVariants: {
    columns: 12,
  },
});

export interface GridProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants>,
    ModifierProps {
  asChild?: boolean;
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    { className, columns, gap, align, justify, asChild = false, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "div";
    const { modifiers, rest } = extractModifiers(props);
    const modifierClasses = getModifierClasses(modifiers);

    return (
      <Comp
        ref={ref}
        className={cn(
          gridVariants({ columns, gap, align, justify }),
          modifierClasses,
          className
        )}
        {...rest}
      />
    );
  }
);
Grid.displayName = "Grid";

// ── GridItem: Individual grid cell with span/start props ──────────

type ResponsiveSpan =
  | number
  | { base?: number; sm?: number; md?: number; lg?: number; xl?: number };

const spanBaseMap: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
};
const spanSmMap: Record<number, string> = {
  1: "sm:col-span-1",
  2: "sm:col-span-2",
  3: "sm:col-span-3",
  4: "sm:col-span-4",
  5: "sm:col-span-5",
  6: "sm:col-span-6",
  7: "sm:col-span-7",
  8: "sm:col-span-8",
  9: "sm:col-span-9",
  10: "sm:col-span-10",
  11: "sm:col-span-11",
  12: "sm:col-span-12",
};
const spanMdMap: Record<number, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12",
};
const spanLgMap: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  10: "lg:col-span-10",
  11: "lg:col-span-11",
  12: "lg:col-span-12",
};
const spanXlMap: Record<number, string> = {
  1: "xl:col-span-1",
  2: "xl:col-span-2",
  3: "xl:col-span-3",
  4: "xl:col-span-4",
  5: "xl:col-span-5",
  6: "xl:col-span-6",
  7: "xl:col-span-7",
  8: "xl:col-span-8",
  9: "xl:col-span-9",
  10: "xl:col-span-10",
  11: "xl:col-span-11",
  12: "xl:col-span-12",
};

function buildSpanClasses(span: ResponsiveSpan): string {
  if (typeof span === "number") {
    return spanBaseMap[span] || "";
  }
  const classes: string[] = [];
  if (span.base) classes.push(spanBaseMap[span.base] || "");
  if (span.sm) classes.push(spanSmMap[span.sm] || "");
  if (span.md) classes.push(spanMdMap[span.md] || "");
  if (span.lg) classes.push(spanLgMap[span.lg] || "");
  if (span.xl) classes.push(spanXlMap[span.xl] || "");
  return classes.filter(Boolean).join(" ");
}

const rowSpanMap: Record<number, string> = {
  1: "row-span-1",
  2: "row-span-2",
  3: "row-span-3",
  4: "row-span-4",
  5: "row-span-5",
  6: "row-span-6",
  7: "row-span-7",
  8: "row-span-8",
  9: "row-span-9",
  10: "row-span-10",
  11: "row-span-11",
  12: "row-span-12",
};

function buildRowSpanClasses(span: number | undefined): string {
  if (!span) return "";
  return rowSpanMap[span] || "";
}

const colStartMap: Record<number, string> = {
  1: "col-start-1",
  2: "col-start-2",
  3: "col-start-3",
  4: "col-start-4",
  5: "col-start-5",
  6: "col-start-6",
  7: "col-start-7",
  8: "col-start-8",
  9: "col-start-9",
  10: "col-start-10",
  11: "col-start-11",
  12: "col-start-12",
  13: "col-start-13",
};

const rowStartMap: Record<number, string> = {
  1: "row-start-1",
  2: "row-start-2",
  3: "row-start-3",
  4: "row-start-4",
  5: "row-start-5",
  6: "row-start-6",
  7: "row-start-7",
  8: "row-start-8",
  9: "row-start-9",
  10: "row-start-10",
  11: "row-start-11",
  12: "row-start-12",
  13: "row-start-13",
};

function buildStartClasses(colStart?: number, rowStart?: number): string {
  const classes: string[] = [];
  if (colStart) classes.push(colStartMap[colStart] || "");
  if (rowStart) classes.push(rowStartMap[rowStart] || "");
  return classes.filter(Boolean).join(" ");
}

export interface GridItemProps
  extends React.HTMLAttributes<HTMLDivElement>, ModifierProps {
  asChild?: boolean;
  colSpan?: ResponsiveSpan;
  rowSpan?: number;
  colStart?: number;
  rowStart?: number;
}

const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  (
    {
      className,
      asChild = false,
      colSpan,
      rowSpan,
      colStart,
      rowStart,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "div";
    const { modifiers, rest } = extractModifiers(props);
    const modifierClasses = getModifierClasses(modifiers);

    const spanClasses = cn(
      colSpan ? buildSpanClasses(colSpan) : "",
      buildRowSpanClasses(rowSpan),
      buildStartClasses(colStart, rowStart)
    );

    return (
      <Comp
        ref={ref}
        className={cn(spanClasses, modifierClasses, className)}
        {...rest}
      />
    );
  }
);
GridItem.displayName = "GridItem";

export { Grid, GridItem, gridVariants };
export type { ResponsiveSpan };
