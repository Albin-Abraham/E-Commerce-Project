import React from "react";

import type { FormField } from "@ui/form/fields";
import type { RuntimeLayoutConfig } from "@ui/form/types/layout";
import type { SpacingConfig } from "@ui/form/utils/spacing-calculator";

/**
 * Render child field callback type — mirrors the render prop in FormComposer.
 */
type RenderChildFieldFn = (props: {
  field: FormField;
  getComponentProps: (id: string) => any;
  visibility?: Record<string, boolean>;
  spacing?: SpacingConfig;
  parentLayout?: RuntimeLayoutConfig;
  key?: string;
}) => React.ReactNode;

/**
 * Rendering context passed to layout renderers that need access to
 * the rendering pipeline utilities (e.g., tabs renderer that creates
 * per-child SectionContent instances).
 */
export interface LayoutRendererContext {
  getComponentProps: (id: string) => any;
  visibility?: Record<string, boolean>;
  spacing?: SpacingConfig;
  parentLayout?: any;
  renderSectionContent: React.ComponentType<{
    children: React.ReactNode;
    layoutConfig?: any;
    headless?: boolean;
  }>;
  renderChildField: RenderChildFieldFn;
}

/**
 * Props that every layout renderer receives.
 */
export interface LayoutRendererProps {
  field: FormField;
  children: React.ReactNode;
  context?: LayoutRendererContext;
  styles?: Record<string, any>;
  className?: string;
}

/**
 * A layout renderer is a React component that renders a structural container.
 * The renderer is resolved from the layout type string via the registry.
 */
export type LayoutRenderer = React.ComponentType<LayoutRendererProps>;

/**
 * LayoutRendererRegistry
 *
 * Maps layout type strings to React components.
 * This replaces the if/else chain in SectionComposer with a plugin registry,
 * making new layouts extensible without modifying core renderer code.
 *
 * Usage:
 * ```ts
 * LayoutRendererRegistry.register("card", CardRenderer);
 * ```
 *
 * Default renderers are registered at import time from './layout-renderers'.
 */
class LayoutRendererRegistryClass {
  private renderers = new Map<string, LayoutRenderer>();

  public register(type: string, renderer: LayoutRenderer): void {
    this.renderers.set(type, renderer);
  }

  public registerMany(entries: Record<string, LayoutRenderer>): void {
    for (const [type, renderer] of Object.entries(entries)) {
      this.renderers.set(type, renderer);
    }
  }

  public get(type: string): LayoutRenderer | undefined {
    return this.renderers.get(type);
  }

  public has(type: string): boolean {
    return this.renderers.has(type);
  }

  public getAll(): Record<string, LayoutRenderer> {
    const all: Record<string, LayoutRenderer> = {};
    this.renderers.forEach((r, t) => {
      all[t] = r;
    });
    return all;
  }
}

export const layoutRendererRegistry = new LayoutRendererRegistryClass();
