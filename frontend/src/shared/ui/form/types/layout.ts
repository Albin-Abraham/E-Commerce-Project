import type { ComponentType } from "react";

import type { FormField } from "./index";

/* ============================================================================
 *  FORM LAYOUT TYPES
 * ============================================================================
 * Defines the visual structure separate from the data structure.
 * All valid layout types are enumerated in a single discriminated union.
 * Adding a new layout type requires adding both the interface and handling
 * in the layout registry — the exhaustive check will enforce this at compile time.
 */

export type LayoutType =
  | "grid"
  | "flex"
  | "block"
  | "card"
  | "tabs"
  | "accordion"
  | "fieldset"
  | "group"
  | "container"
  | "section"
  | "steps";

export interface BaseLayoutConfig {
  type: LayoutType;
  className?: string;
  padding?: string | number;
  margin?: string | number;
  wrapOuter?: boolean;
  /**
   * Marks a section as the wizard's **submit landing** (a review step that is
   * never navigated to and whose fields are excluded from submit validation).
   * The wizard's final navigable step routes directly to submit.
   * Consumed by {@link FlowProxy} and the engine's `submit()`.
   */
  reviewOnly?: boolean;
}

export interface GridLayoutConfig extends BaseLayoutConfig {
  type: "grid";
  columns: number;
  gap?: number | string;
  rowGap?: number | string;
  colGap?: number | string;
  breakpoints?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export interface FlexLayoutConfig extends BaseLayoutConfig {
  type: "flex";
  direction: "row" | "column" | "row-reverse" | "column-reverse";
  wrap?: "nowrap" | "wrap" | "wrap-reverse";
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly";
  align?: "start" | "end" | "center" | "baseline" | "stretch";
  gap?: number | string;
}

export interface BlockLayoutConfig extends BaseLayoutConfig {
  type: "block";
}

export interface TabsLayoutConfig extends BaseLayoutConfig {
  type: "tabs";
  variant?: "default" | "underlined" | "pills";
  orientation?: "horizontal" | "vertical";
  defaultTab?: string | number;
}

export interface CardLayoutConfig extends BaseLayoutConfig {
  type: "card";
  variant?: "default" | "outlined" | "flat" | "glass";
  header?: boolean;
  footer?: boolean;
  elevation?: "none" | "sm" | "md" | "lg" | "xl";
  gap?: number | string;
}

/**
 * Convenience type for section-level layout configs.
 * Used by entry-level form definitions.
 */
export type SectionLayoutConfig =
  | GridLayoutConfig
  | FlexLayoutConfig
  | BlockLayoutConfig
  | TabsLayoutConfig
  | CardLayoutConfig
  | AccordionLayoutConfig
  | ContainerLayoutConfig
  | StepsLayoutConfig
  | SectionLayout;

export interface AccordionLayoutConfig extends BaseLayoutConfig {
  type: "accordion";
  defaultOpen?: boolean;
  columns?: number;
  gap?: number | string;
}

export interface ContainerLayoutConfig extends BaseLayoutConfig {
  type: "container";
  columns?: number;
  gap?: number | string;
}

export interface StepsLayoutConfig extends BaseLayoutConfig {
  type: "steps";
}

export interface SectionLayout extends BaseLayoutConfig {
  type: "section";
  columns?: number;
  gap?: number | string;
}

export interface GroupLayoutConfig extends BaseLayoutConfig {
  type: "group";
  direction?: "row" | "col";
  gap?: number | string;
}

export interface FieldsetLayoutConfig extends BaseLayoutConfig {
  type: "fieldset";
  columns?: number;
  gap?: number | string;
}

/**
 * Runtime layout config — a closed discriminated union over all known layout types.
 * Every type string here MUST have a corresponding handler in the layout registry.
 * If you add a new type, TypeScript will error on the exhaustive check until you
 * register a renderer for it.
 */
export type RuntimeLayoutConfig =
  | GridLayoutConfig
  | FlexLayoutConfig
  | BlockLayoutConfig
  | CardLayoutConfig
  | TabsLayoutConfig
  | AccordionLayoutConfig
  | ContainerLayoutConfig
  | StepsLayoutConfig
  | SectionLayout
  | GroupLayoutConfig
  | FieldsetLayoutConfig;

/**
 * Exhaustive check helper.
 * Place this in a switch default to get a compile error if a new layout type is added
 * without being handled.
 */
export function assertExhaustiveLayout(_: never): never {
  throw new Error(`Unhandled layout type`);
}

/**
 * Segmented single-select content (radio semantics).
 *
 * Renders one active option from a closed set — exactly the behavior of a
 * radio button group, delivered as a typed config instead of a bespoke
 * component. Drives view-state (V4) via `onChange` without polluting the
 * form's data payload.
 */
export interface SegmentedContent {
  type: "segmented";
  /** Radio-like options — exactly one is active at a time. */
  options: { label: string; value: string }[];
  /** Currently selected value. */
  value?: string;
  /** Fired when an option is selected (picks exactly one). */
  onChange?: (value: string) => void;
  className?: string;
}

export type ContainerContentType =
  | "image"
  | "section-ref"
  | "component"
  | "html"
  | "container"
  | "segmented";

export interface ContainerContent {
  type: ContainerContentType;
  fields?: FormField[]; // Support for inline fields in split/hero panes
  id?: string; // Optional identifier for pane-specific targeting
  src?: string;
  alt?: string;
  overlay?: boolean;
  sectionId?: string;
  content?: string;
  className?: string;
  /** Custom React component for `type: "component"` panes (e.g. a branded hero panel). */
  component?: ComponentType<any>;
  /** Props forwarded to `component` when using `type: "component"`. */
  componentProps?: Record<string, unknown>;
  /** Radio-like segmented options for `type: "segmented"`. */
  options?: SegmentedContent["options"];
  /** Active value for `type: "segmented"`. */
  value?: string;
  /** Selection handler for `type: "segmented"`. */
  onChange?: (value: string) => void;
}

export interface ContainerDefinition {
  id: string;
  type: "split" | "card" | "hero" | "sidebar";
  config?: {
    splitRatio?: "50/50" | "40/60" | "30/70";
    orientation?: "horizontal" | "vertical";
    /** Full-width strip rendered above the panes (e.g. an auth mode toggle). */
    topContent?: ContainerContent;
    leftContent?: ContainerContent;
    rightContent?: ContainerContent;
  };
  children?: string[]; // Reference section IDs
}

// Props interface for any layout component
// Props interface for any layout component
export interface LayoutComponentProps {
  section: any; // Using any temporarily to avoid circular deps with FormSection - strictly it is FormSection
  childrenNodes: any[]; // RenderNodes
  data?: any; // Made optional for 5V compatibility
  errors?: Record<string, string>; // Made optional for 5V compatibility
  setValue?: (name: string, value: any) => void; // Made optional for 5V compatibility
  getComponentProps?: (fieldId: string) => any; // New 5V prop
  renderChildren: () => React.ReactNode; // Callback to render all standard children (default behavior)
  renderNode: (node: any) => React.ReactNode; // Callback to render a specific node
  className?: string; // BEM/Tailwind class injection from SectionRenderer
}

/* ============================================================================
 *  RUNTIME SHELL CONFIGURATION (Grid-Surface-Content Model)
 * ============================================================================
 * Strongly typed discriminated unions for schema-driven full page layout.
 */

export type ShellNode = LayoutNode | SurfaceNode | FlowNode | ContentNode;

export interface LayoutNode {
  node: "layout";
  type: "grid" | "flex" | "stack" | "box";
  config?: {
    columns?: number;
    gap?: number | string;
    direction?: "row" | "col";
  };
  children: ShellNode[];
  className?: string;
  colSpan?: number | Record<string, number>;
}

export interface SurfaceNode {
  node: "surface";
  type: "card" | "dialog" | "drawer" | "overlay" | "hero";
  config?: {
    gridSpan?: number | { sm?: number; lg?: number; base: number };
    elevation?: "none" | "sm" | "md" | "lg" | "premium";
    glass?: boolean;
    position?: "right" | "left" | "bottom" | "top";
    size?: "sm" | "md" | "lg" | "full";
  };
  children: ShellNode[];
  className?: string;
  colSpan?: number | Record<string, number>;
}

export interface FlowNode {
  node: "flow";
  type: "wizard" | "stepper" | "tabs";
  config?: {
    linear?: boolean;
    stepperPosition?: "top" | "sidebar";
    defaultTab?: string;
  };
  children: ShellNode[];
  className?: string;
  colSpan?: number | Record<string, number>;
}

export interface ContentNode {
  node: "content";
  type:
    | "section-ref"
    | "component"
    | "segmented"
    | "html"
    | "image"
    | "form-standard"
    | "form-steps";
  sectionId?: string;
  component?: React.ComponentType<any>;
  /** Props forwarded to the component when type is "component". */
  componentProps?: Record<string, unknown>;
  src?: string;
  alt?: string;
  overlay?: boolean;
  content?: string;
  options?: { label: string; value: string }[];
  value?: string;
  onChange?: (val: string) => void;
  className?: string;
  colSpan?: number | Record<string, number>;
}
