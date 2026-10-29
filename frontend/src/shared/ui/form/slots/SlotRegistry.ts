import React from "react";
import type { FormField } from "../fields";

/**
 * Context passed to dynamic slot components during rendering.
 */
export interface SlotRenderContext<TProps = any> {
  field: FormField;
  slotProps?: TProps;
  value?: any;
  onChange?: (val: any) => void;
  error?: boolean;
  errorMessage?: string;
}

/**
 * Dynamic slot component signature.
 */
export type SlotComponent<TProps = any> = React.ComponentType<
  SlotRenderContext<TProps>
>;

/**
 * SlotRegistry — Enterprise Dependency Injection Registry for Dynamic Form Slots.
 *
 * Allows decoupling custom slot UI widgets from core form primitives.
 * Forms can reference slot identifiers declaratively in their schema/JSON:
 * ```ts
 * {
 *   name: "email",
 *   properties: {
 *     slots: {
 *       endContent: { slotId: "verify-badge", props: { level: "high" } }
 *     }
 *   }
 * }
 * ```
 */
export class SlotRegistry {
  private slots = new Map<string, SlotComponent<any>>();

  /**
   * Register a slot component by unique ID.
   */
  register<TProps = any>(slotId: string, component: SlotComponent<TProps>): this {
    this.slots.set(slotId, component);
    return this;
  }

  /**
   * Resolve a slot component by ID.
   */
  get<TProps = any>(slotId: string): SlotComponent<TProps> | undefined {
    return this.slots.get(slotId);
  }

  /**
   * Check if a slot ID is registered.
   */
  has(slotId: string): boolean {
    return this.slots.has(slotId);
  }

  /**
   * Remove a registered slot.
   */
  unregister(slotId: string): boolean {
    return this.slots.delete(slotId);
  }

  /**
   * Clear all registered slots (useful in tests).
   */
  clear(): void {
    this.slots.clear();
  }
}

/** Global singleton slot registry */
export const slotRegistry = new SlotRegistry();
