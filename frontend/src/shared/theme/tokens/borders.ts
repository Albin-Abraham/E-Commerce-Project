/**
 * Zenith Border & Shape Tokens
 */
export const radius = {
  none: "0",
  sm: "var(--radius-sm)", // 4px
  md: "var(--radius-md)", // 8px
  lg: "var(--radius-lg)", // 12px
  xl: "var(--radius-xl)", // 16px
  xxl: "2rem", // 32px
  full: "9999px",
} as const;

export const borders = {
  width: {
    none: "0",
    thin: "1px",
    medium: "2px",
    thick: "4px",
  },
  style: {
    solid: "solid",
    dashed: "dashed",
  },
  colors: {
    subtle: "var(--color-border/30)",
    strong: "var(--color-border)",
    interactive: "var(--color-primary/40)",
  },
} as const;
