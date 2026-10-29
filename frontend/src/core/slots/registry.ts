import type { ComponentType, ReactNode } from "react";

export interface SlotEntry {
  id: string;
  component: ComponentType<any> | ReactNode;
  priority?: number;
  props?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * SlotRegistry
 *
 * Central registry for dynamic UI components.
 * Supports priority-based rendering and feature-isolation.
 * Application-scoped — instantiate per app instance; the exported
 * slotRegistry is the default instance backing the CSR boot.
 */
export class SlotRegistry {
  private slots: Map<string, SlotEntry[]> = new Map();
  private listeners: Set<() => void> = new Set();

  private notify() {
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Clear all registered slots. Called before re-registration during HMR.
   */
  reset() {
    this.slots.clear();
    this.notify();
  }

  /**
   * Register a component to a slot
   */
  register(name: string, entry: SlotEntry) {
    if (!this.slots.has(name)) {
      this.slots.set(name, []);
    }
    const entries = this.slots.get(name)!;

    // Prevent duplicate IDs within the same slot
    if (entries.some((e) => e.id === entry.id)) {
      return;
    }

    entries.push(entry);

    // Sort by priority (higher priority first)
    entries.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    this.notify();
  }

  /**
   * Get all components for a slot
   */
  getEntries(name: string): SlotEntry[] {
    return this.slots.get(name) || [];
  }

  /**
   * Unregister a component
   */
  unregister(name: string, id: string) {
    const entries = this.slots.get(name);
    if (entries) {
      this.slots.set(
        name,
        entries.filter((e) => e.id !== id)
      );
      this.notify();
    }
  }
}

export const slotRegistry = new SlotRegistry();
