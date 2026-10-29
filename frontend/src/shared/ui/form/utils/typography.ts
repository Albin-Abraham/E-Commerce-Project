import type { FieldProperties } from "../fields";
import { cn } from "./form-styles";

export function buildTypographyClasses(props?: FieldProperties): string {
  if (!props || !props.typography) return "";

  const ctx = props.typography;
  const classes: string[] = [];

  // Variant mapping using the tokens defined in modern Tailwind defaults
  const variantMap: Record<string, string> = {
    h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
    h2: "scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0",
    h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
    body: "text-base leading-7",
    small: "text-sm font-medium leading-none",
    caption: "text-xs text-muted-foreground",
  };

  if (ctx.variant && variantMap[ctx.variant]) {
    classes.push(variantMap[ctx.variant]);
  }

  // Alignment mapping
  if (ctx.alignment) {
    const alignMap: Record<string, string> = {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    };
    if (alignMap[ctx.alignment]) classes.push(alignMap[ctx.alignment]);
  }

  // Weight mapping
  if (ctx.weight) {
    const weightMap: Record<string, string> = {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    };
    if (weightMap[ctx.weight]) classes.push(weightMap[ctx.weight]);
  }

  // Custom color
  if (ctx.color) {
    classes.push(ctx.color);
  }

  return cn(...classes);
}
