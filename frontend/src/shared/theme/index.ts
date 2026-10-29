import { cn } from "@libs/utils";

import {
  type GridColumns,
  type ResponsiveConfig,
  badgeVariants,
  patterns,
} from "./patterns";
import { tokens } from "./tokens";

/**
 * Zenith UI System
 *
 * The unified "Object-Based Styling Injection" system.
 */
export const Zenith = {
  /** Primitive values */
  tokens,

  /** Composite class strings */
  patterns,

  /** Layout Helpers */
  layout: patterns.layout,

  /** CVA Variants */
  badgeVariants,

  /** Style merger utility */
  cn,

  /**
   * Semantic Helpers
   */

  card: (
    options: {
      variant?: "base" | "glass";
      hover?: boolean;
      interactive?: boolean;
      density?: keyof typeof patterns.layout.density;
      id?: string;
    } = {}
  ) => ({
    className: cn(
      patterns.cards[options.variant || "base"],
      options.hover && patterns.cards.hover,
      options.interactive && patterns.cards.interactive,
      options.density && patterns.layout.density[options.density]
    ),
    "data-zenith-card": options.id || "ui-card",
  }),

  button: (variant: keyof typeof patterns.buttons = "primary") =>
    cn(patterns.buttons.base, patterns.buttons[variant]),

  input: (id?: string) => ({
    className: patterns.inputs.base,
    "data-zenith-input": id || "ui-input",
  }),

  text: (
    variant: keyof typeof patterns.typography.fluid,
    fluid = true
  ): string =>
    (fluid
      ? patterns.typography.fluid[variant]
      : patterns.typography[
          variant as keyof typeof patterns.typography
        ]) as string,

  grid: (config: GridColumns | ResponsiveConfig, id?: string) => ({
    className: patterns.layout.grid(config),
    "data-zenith-grid": id || "layout-grid",
  }),

  container: (id?: string) => ({
    className: patterns.layout.container,
    "data-zenith-container": id || "ui-container",
  }),
  section: (id?: string) => ({
    className: patterns.layout.section,
    "data-zenith-section": id || "content-block",
  }),
  z: (layer: keyof typeof tokens.zIndices) => patterns.z(layer),

  /**
   * App Shell Orchestration (BEM)
   */
  shell: (element: keyof typeof patterns.app) => patterns.app[element],

  density: (variant: keyof typeof patterns.density) =>
    patterns.density[variant],
  glass: (variant: keyof typeof patterns.glass) => patterns.glass[variant],

  /**
   * Feedback & State Orchestration
   */
  error: (title: string, message: string, onRetry?: () => void) => ({
    containerProps: { className: patterns.feedback.error.container },
    iconProps: { className: patterns.feedback.error.icon },
    titleProps: { className: patterns.feedback.error.title, children: title },
    messageProps: {
      className: patterns.feedback.error.message,
      children: message,
    },
    actionProps: onRetry
      ? {
          className: cn(
            patterns.buttons.base,
            patterns.buttons.primary,
            patterns.feedback.error.action
          ),
          onClick: onRetry,
          children: "Retry Connection",
        }
      : undefined,
  }),

  loading: (label = "Synchronizing System...") => ({
    containerProps: { className: patterns.feedback.loading.container },
    spinnerProps: { className: patterns.feedback.loading.spinner },
    textProps: { className: patterns.feedback.loading.text, children: label },
  }),

  empty: (title: string, message: string) => ({
    containerProps: { className: patterns.feedback.empty.container },
    titleProps: { className: patterns.feedback.empty.title, children: title },
    messageProps: {
      className: patterns.feedback.empty.message,
      children: message,
    },
  }),

  /**
   * Hero Orchestration
   */
  hero: (element: keyof typeof patterns.hero) => patterns.hero[element],

  /**
   * Trust/Client Orchestration
   */
  trust: (element: keyof typeof patterns.trust) => patterns.trust[element],
};

export default Zenith;
export { cn, patterns, tokens };
