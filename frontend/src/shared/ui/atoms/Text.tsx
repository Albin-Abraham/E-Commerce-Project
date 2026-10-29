import React from "react";
import { cn } from "@libs/utils";
import { typography, type TypographyPreset } from "@shared/theme/tokens/typography";

type ElementType = keyof React.JSX.IntrinsicElements;

const defaultElementMap: Record<TypographyPreset, ElementType> = {
  hero: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  bodyLarge: "p",
  body: "p",
  caption: "span",
  dataCell: "span",
};

export type TextColor =
  | "foreground"
  | "muted"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "subtle"
  | "inherit";

const textColorMap: Record<TextColor, string> = {
  foreground: "text-foreground",
  muted: "text-muted",
  primary: "text-primary",
  secondary: "text-secondary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  subtle: "text-muted/60",
  inherit: "text-inherit",
};

export interface TextProps<T extends ElementType = "p"> {
  /** The semantic HTML tag to render. Defaults based on variant. */
  as?: T;
  /** Design token typography preset */
  variant?: TypographyPreset;
  /** Semantic token color from tokens.css */
  color?: TextColor;
  /** Convenience flag to apply font-bold */
  bold?: boolean;
  /** Force monospace tabular numbers for numeric alignment */
  tabular?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Children elements or text */
  children?: React.ReactNode;
}

export type TextComponentProps<T extends ElementType> = TextProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof TextProps<T>>;

export function Text<T extends ElementType = "p">({
  as,
  variant = "body",
  color,
  bold,
  tabular = false,
  className,
  children,
  ...restProps
}: TextComponentProps<T>) {
  const Component = (as || defaultElementMap[variant] || "p") as React.ElementType;
  const preset = typography.presets[variant];

  return (
    <Component
      className={cn(
        preset?.className,
        color && textColorMap[color],
        bold && "font-bold",
        tabular && "tabular-nums",
        className
      )}
      {...restProps}
    >
      {children}
    </Component>
  );
}

export default Text;
