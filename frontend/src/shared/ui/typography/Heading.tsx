import React, { forwardRef } from "react";
import { Text, type TextProps } from "./Text";
import type { SemanticTextStyle } from "./types";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps extends Omit<TextProps<any>, "as"> {
  level?: HeadingLevel;
  variant?: SemanticTextStyle;
}

const defaultVariantMap: Record<HeadingLevel, SemanticTextStyle> = {
  1: "heading-1",
  2: "heading-2",
  3: "heading-3",
  4: "heading-4",
  5: "heading-4",
  6: "label-lg",
};

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  function Heading(props, ref) {
    const { level = 2, variant, children, ...rest } = props;

    const htmlTag = `h${level}` as const;
    const resolvedVariant = variant || defaultVariantMap[level] || "heading-2";

    return (
      <Text
        as={htmlTag}
        variant={resolvedVariant}
        ref={ref}
        role="heading"
        aria-level={level}
        {...rest}
      >
        {children}
      </Text>
    );
  }
);

Heading.displayName = "Heading";
