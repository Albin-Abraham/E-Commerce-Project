import React, { forwardRef, type ElementType, type ComponentPropsWithoutRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@libs/utils";
import type { BaseTypographyProps, SemanticTextStyle, FontWeight, TextAlign, TextColor } from "./types";

export const textVariants = cva("transition-colors", {
  variants: {
    variant: {
      display: "text-display",
      "heading-1": "text-heading-1",
      "heading-2": "text-heading-2",
      "heading-3": "text-heading-3",
      "heading-4": "text-heading-4",
      "body-lg": "text-body-lg",
      "body-md": "text-body-md",
      "body-sm": "text-body-sm",
      "label-lg": "text-label-lg",
      "label-md": "text-label-md",
      "label-sm": "text-label-sm",
      caption: "text-caption",
      code: "text-code font-mono",
    },
    weight: {
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    align: {
      start: "text-start",
      center: "text-center",
      end: "text-end",
      justify: "text-justify",
    },
    color: {
      foreground: "text-foreground",
      muted: "text-muted",
      subtle: "text-subtle",
      primary: "text-primary",
      secondary: "text-secondary",
      accent: "text-accent",
      danger: "text-danger",
      success: "text-success",
      warning: "text-warning",
      error: "text-error",
      info: "text-info",
      inherit: "text-inherit",
    },
  },
  defaultVariants: {
    variant: "body-md",
    color: "foreground",
  },
});

export type TextProps<T extends ElementType = "p"> = BaseTypographyProps &
  Omit<ComponentPropsWithoutRef<T>, keyof BaseTypographyProps> & {
    as?: T;
  };

export const Text = forwardRef(function Text<T extends ElementType = "p">(
  props: TextProps<T>,
  ref: React.ForwardedRef<any>
) {
  const {
    as,
    variant = "body-md",
    weight,
    align,
    color = "foreground",
    truncate,
    wrap = true,
    tabularNums = false,
    className,
    children,
    ...rest
  } = props;

  const Component = as || "p";

  const truncateClasses =
    truncate === true
      ? "truncate"
      : typeof truncate === "number"
      ? truncate === 1
        ? "line-clamp-1"
        : truncate === 2
        ? "line-clamp-2"
        : truncate === 3
        ? "line-clamp-3"
        : `line-clamp-${truncate}`
      : undefined;

  const wrapClass = wrap === false ? "whitespace-nowrap" : undefined;
  const numClass = tabularNums ? "tabular-nums" : undefined;

  return (
    <Component
      ref={ref}
      className={cn(
        textVariants({ variant, weight, align, color }),
        truncateClasses,
        wrapClass,
        numClass,
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}) as <T extends ElementType = "p">(
  props: TextProps<T> & { ref?: React.ForwardedRef<any> }
) => React.ReactElement;

(Text as any).displayName = "Text";
