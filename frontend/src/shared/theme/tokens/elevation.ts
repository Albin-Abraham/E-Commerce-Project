/**
 * Zenith Elevation & Shadow Tokens
 */
export const shadow = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
  lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
  xl: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
  premium:
    "0 10px 30px -10px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.05)",
  floating: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
} as const;

export const icon = {
  xs: "12px", // 3u
  sm: "16px", // 4u
  md: "24px", // 6u
  lg: "32px", // 8u
  xl: "48px", // 12u
} as const;
