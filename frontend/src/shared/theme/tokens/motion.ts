/**
 * Zenith Motion & Transition Tokens
 */
export const motion = {
  duration: {
    instant: "0ms",
    fast: "150ms",
    medium: "300ms",
    slow: "500ms",
    stable: "700ms",
    snail: "1000ms",
  },
  ease: {
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    elastic: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
  },
  animation: {
    fadeUp: "fade-up var(--motion-medium) var(--ease-out) both",
    fadeDown: "fade-down var(--motion-medium) var(--ease-out) both",
    scaleIn: "scale-in var(--motion-fast) var(--ease-out) both",
    slideUp: "slide-up var(--motion-medium) var(--ease-out) both",
    slideDown: "slide-down var(--motion-medium) var(--ease-out) both",
    slideLeft: "slide-left var(--motion-medium) var(--ease-out) both",
    slideRight: "slide-right var(--motion-medium) var(--ease-out) both",
    pulseSoft: "pulse-soft 3s var(--ease-in-out) infinite",
    float: "float 6s ease-in-out infinite",
  },
} as const;
