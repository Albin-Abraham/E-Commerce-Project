/**
 * Zenith Layout & Spacing Tokens (4-Point Grid)
 */
export const spacing = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  32: "8rem", // 128px
  40: "10rem", // 160px
  48: "12rem", // 192px
} as const;

export const layout = {
  gutter: {
    sm: "1rem", // 16px
    md: "1.5rem", // 24px
    lg: "2rem", // 32px
  },
  margin: {
    edge: "1.5rem", // 24px
    section: "4rem", // 64px
  },
  max: {
    content: "80rem", // 1280px
    readable: "42rem", // 672px
  },
  aspect: {
    square: "1 / 1",
    video: "16 / 9",
    portrait: "3 / 4",
    landscape: "4 / 3",
    golden: "1.618 / 1",
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    xxl: "1536px",
  },
} as const;
