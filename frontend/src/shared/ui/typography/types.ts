import type { ElementType, ReactNode } from "react";

export type SemanticTextStyle =
  | "display"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "heading-4"
  | "body-lg"
  | "body-md"
  | "body-sm"
  | "label-lg"
  | "label-md"
  | "label-sm"
  | "caption"
  | "code";

export type FontWeight = "regular" | "medium" | "semibold" | "bold";

export type TextAlign = "start" | "center" | "end" | "justify";

export type TextColor =
  | "foreground"
  | "muted"
  | "subtle"
  | "primary"
  | "secondary"
  | "accent"
  | "danger"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "inherit";

export interface BaseTypographyProps {
  variant?: SemanticTextStyle;
  weight?: FontWeight;
  align?: TextAlign;
  color?: TextColor;
  truncate?: boolean | number;
  wrap?: boolean;
  tabularNums?: boolean;
  className?: string;
  children?: ReactNode;
}
