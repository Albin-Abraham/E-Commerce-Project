import { cva } from "class-variance-authority";

import { tokens } from "./tokens";
import manifest from "./zenos.manifest.json";

/**
 * Zenith Type Definitions
 */
export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12;

export interface ResponsiveConfig {
  base?: GridColumns;
  sm?: GridColumns;
  md?: GridColumns;
  lg?: GridColumns;
  xl?: GridColumns;
  xxl?: GridColumns;
}

const GRID_COL_MAP: Record<GridColumns, string> = {
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
  12: "grid-cols-12",
};

/**
 * CVA (Class Variance Authority) Implementations
 * Strictly typed, mathematically computed class generators.
 */
export const badgeVariants = cva("z-badge", {
  variants: {
    intent: {
      primary: "z-badge--primary",
      secondary: "bg-secondary/10 text-secondary border border-secondary/20",
      warning: "bg-warning/10 text-warning border border-warning/20",
    },
    isPulsing: {
      true: "z-badge--pulse",
    },
  },
  defaultVariants: {
    intent: "primary",
    isPulsing: false,
  },
});

/**
 * Zenith Design Patterns
 *
 * Implements Modern Layout Methodologies:
 * - Mobile-First
 * - Fluid Scaling
 * - Adaptive Density
 * - Intrinsic Web Design
 */
export const patterns = {
  layout: {
    page: "min-h-screen bg-background p-[var(--space-4)] lg:p-[var(--space-12)]",
    container: "z-container mx-auto px-[var(--space-4)] md:px-[var(--space-6)]",
    section: "py-[var(--space-16)] lg:py-[var(--space-24)]",
    flexCenter: "flex items-center justify-center",
    flexColumn: "flex flex-col",
    header:
      "flex justify-between items-end border-b border-[var(--color-border)] pb-[var(--space-8)]",
    media:
      "relative aspect-[var(--aspect-landscape)] overflow-hidden bg-black/5 rounded-t-[var(--radius-xl)]",

    // Grid System: Column-based layout structure with strict Tailwind mapping
    grid: (config: GridColumns | ResponsiveConfig) => {
      const classes = ["grid gap-[var(--space-6)] lg:gap-[var(--space-8)]"];

      if (typeof config === "number") {
        classes.push(GRID_COL_MAP[config]);
      } else {
        if (config.base) classes.push(GRID_COL_MAP[config.base]);
        if (config.sm) classes.push(`sm:${GRID_COL_MAP[config.sm]}`);
        if (config.md) classes.push(`md:${GRID_COL_MAP[config.md]}`);
        if (config.lg) classes.push(`lg:${GRID_COL_MAP[config.lg]}`);
        if (config.xl) classes.push(`xl:${GRID_COL_MAP[config.xl]}`);
        if (config.xxl) classes.push(`xxl:${GRID_COL_MAP[config.xxl]}`);
      }

      return classes.join(" ");
    },

    // Intrinsic Web Design: Layout adapts naturally to content
    intrinsic: {
      autoFit:
        "grid grid-cols-[repeat(auto-fit,minmax(min(100%,352px),1fr))] gap-[var(--space-6)] lg:gap-[var(--space-8)]",
      autoFill:
        "grid grid-cols-[repeat(auto-fill,minmax(min(100%,208px),1fr))] gap-[var(--space-4)]",
      cluster: "flex flex-wrap items-center gap-[var(--space-4)]",
    },

    // Adaptive Density: Adjust information density based on viewport
    density: {
      compact: "p-[var(--space-2)] gap-[var(--space-2)]",
      comfortable: "p-[var(--space-4)] gap-[var(--space-4)]",
      spacious: "p-[var(--space-8)] gap-[var(--space-8)]",
      adaptive:
        "p-[var(--space-6)] md:p-[var(--space-8)] lg:p-[var(--space-12)] gap-[var(--space-6)] md:gap-[var(--space-8)] lg:gap-[var(--space-12)]",
    },
  },

  // App Shell: The semantic "BEM" structure for the application frame
  // App Shell: The semantic "BEM" structure for the application frame dynamically loaded from manifest
  app: manifest.patterns.app,

  cards: manifest.patterns.cards,

  // Hero Section: Specialized architectural components for the main landing area
  hero: {
    container:
      "z-container z-card bg-surface/40 backdrop-blur-2xl border border-white/10 rounded-[var(--radius-xxl)] !p-[var(--space-10)] lg:!p-[var(--space-20)]",
    mockup:
      "z-hero__mockup rounded-[var(--radius-xl)] shadow-floating border border-white/5",
    blobPrimary: "z-hero__blob z-hero__blob--primary opacity-20 blur-[120px]",
    blobSecondary:
      "z-hero__blob z-hero__blob--secondary opacity-20 blur-[120px]",
    badge: "z-badge z-badge--primary z-badge--pulse mb-[var(--space-8)]",
  },

  // Trust/Client Marquee Orchestration
  trust: {
    container: "z-trust py-[var(--space-12)]",
    edgeMaskLeft: "z-trust__mask z-trust__mask--left",
    edgeMaskRight: "z-trust__mask z-trust__mask--right",
    title:
      "text-center text-[var(--text-xs)] uppercase font-[var(--font-black)] tracking-[var(--tracking-widest)] text-muted-foreground mb-[var(--space-12)] opacity-60",
    track: "z-trust__track flex items-center gap-[var(--space-16)]",
    logoWrapper: "group cursor-pointer",
    logoText:
      "text-[var(--text-xl)] md:text-[var(--text-2xl)] font-[var(--font-black)] tracking-[var(--tracking-tightest)] text-foreground/80 group-hover:text-primary transition-all duration-[var(--motion-slow)]",
    logoUnderline:
      "h-0.5 w-0 bg-primary mx-auto mt-1 group-hover:w-full transition-all duration-[var(--motion-slow)] rounded-full shadow-[0_0_10px_var(--color-primary)]",
  },

  buttons: manifest.patterns.buttons,

  inputs: manifest.patterns.inputs,

  typography: {
    // Fluid Typography: Script-driven scaling
    fluid: {
      h1: "text-[clamp(2.5rem,5vw,4.5rem)] font-[var(--font-black)] tracking-[var(--tracking-tighter)] leading-[var(--leading-tight)]",
      h2: "text-[clamp(2rem,4vw,3rem)] font-[var(--font-bold)] tracking-[var(--tracking-tight)] leading-[var(--leading-snug)]",
      h3: "text-[clamp(1.5rem,3vw,2rem)] font-[var(--font-semibold)] leading-[var(--leading-snug)]",
      body: "text-[var(--text-base)] leading-[var(--leading-normal)] text-foreground/80",
    },
    h1: "text-[var(--text-2xl)] font-[var(--font-black)] tracking-[var(--tracking-tighter)]",
    h2: "text-[var(--text-xl)] font-[var(--font-bold)] tracking-[var(--tracking-tight)]",
    h3: "text-[var(--text-lg)] font-[var(--font-semibold)]",
    body: "text-[var(--text-base)]",
    caption:
      "text-[var(--text-xs)] uppercase tracking-[var(--tracking-widest)] font-[var(--font-black)] text-muted",
  },

  // Widgets: Semantic UI elements for data visualization
  widgets: {
    display:
      "bg-background/80 backdrop-blur-sm border border-border rounded-[var(--radius-xl)] shadow-premium p-[var(--space-6)]",
    status: "flex items-center gap-[var(--space-3)] font-[var(--font-medium)]",
    indicator: "w-[var(--space-3)] h-[var(--space-3)] rounded-full",
  },

  // Feedback: System health and state orchestration
  feedback: manifest.patterns.feedback,

  // Data: Visualization and code-like elements
  data: {
    label:
      "text-[var(--text-xs)] uppercase font-[var(--font-black)] text-muted-foreground tracking-[var(--tracking-widest)] opacity-60 mb-[var(--space-1)]",
    snippet:
      "p-[var(--space-2)] bg-black/5 dark:bg-white/5 rounded-[var(--radius-sm)] font-mono text-[var(--text-xs)] overflow-hidden text-ellipsis whitespace-nowrap shadow-inner border border-border/20",
    sync: "flex items-center gap-[var(--space-3)] justify-center text-primary font-[var(--font-bold)]",
    error:
      "text-[var(--text-xs)] font-[var(--font-black)] text-red-500 uppercase tracking-[var(--tracking-widest)]",
  },

  // Table Core: High-density data orchestration
  table: {
    container:
      "z-card bg-surface border border-border/40 rounded-[var(--radius-xl)] overflow-hidden shadow-premium",
    header: "bg-muted/5 border-b border-border/60",
    row: "hover:bg-primary/5 transition-all duration-300 group relative",
    cell: "px-[var(--space-6)] py-[var(--space-4)] text-sm font-medium text-foreground/90 align-middle transition-all duration-300",
    headerCell:
      "px-[var(--space-6)] py-[var(--space-4)] text-xs font-black uppercase tracking-widest text-muted-foreground align-middle transition-all duration-300",
    selected: "bg-primary/10",
  },

  // Borders: Tiered structural separation
  borders: {
    subtle: "border border-border/30",
    strong: "border-2 border-[var(--color-border-strong)]",
    interactive: "border-2 border-primary/40",
    divider:
      "h-px w-full bg-[var(--color-border-strong)]/20 my-[var(--space-4)]",
  },

  // Z-Index Utility: Mapping semantic layers to Tailwind classes
  z: (layer: keyof typeof tokens.zIndices) => `z-[${tokens.zIndices[layer]}]`,

  motion: {
    base: "transition-all duration-[var(--motion-medium)] ease-[var(--ease-in-out)]",
    entrance:
      "animate-in fade-in slide-in-from-bottom-4 duration-[var(--motion-slow)]",
  },

  /**
   * Framer Motion Standard Variants
   * These provide a consistent entrance/exit vocabulary.
   */
  motionVariants: {
    swipeIn: {
      bottom: {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
      },
      left: {
        initial: { opacity: 0, x: -40 },
        whileInView: { opacity: 1, x: 0 },
        transition: { duration: 0.5, ease: "easeOut" },
      },
      right: {
        initial: { opacity: 0, x: 40 },
        whileInView: { opacity: 1, x: 0 },
        transition: { duration: 0.5, ease: "easeOut" },
      },
    },
    fade: {
      initial: { opacity: 0 },
      whileInView: { opacity: 1 },
      transition: { duration: 0.4 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      whileInView: { opacity: 1, scale: 1 },
      transition: { duration: 0.4, ease: "backOut" },
    },
  },

  /**
   * Density Orchestration
   * Allows components to scale based on information density requirements.
   */
  density: {
    compact: "p-[var(--space-2)] gap-[var(--space-2)] text-xs",
    comfortable: "p-[var(--space-4)] gap-[var(--space-4)] text-sm",
    spacious: "p-[var(--space-8)] gap-[var(--space-8)] text-base",
  },

  /**
   * Glassmorphism & Subsurface Systems
   */
  glass: {
    base: "bg-surface/60 backdrop-blur-xl border border-border/20 shadow-sm",
    prominent:
      "bg-surface/80 backdrop-blur-2xl border border-primary/20 shadow-premium",
    muted: "bg-surface/30 backdrop-blur-md border border-border/10",
  },
} as const;
