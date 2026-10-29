/**
 * @file LazyRegistryStore.tsx
 * @description RegistryStore with support for lazy (code-split) field component registration.
 */
import React from "react";

import type { FieldComponent } from "@ui/form/fields/registry";
import { RegistryStore } from "./RegistryStore";

type LazyImporter = () => Promise<{ default: FieldComponent } | FieldComponent>;

/**
 * RegistryStore extension that supports both eager and lazy field registration.
 *
 * - `register(type, component)` — eager, same as base RegistryStore
 * - `registerLazy(type, importer)` — deferred; `import()` runs on first `get(type)`
 */
export class LazyRegistryStore extends RegistryStore {
  private lazyLoaders: Map<string, LazyImporter> = new Map();
  private loadingFields: Map<string, Promise<FieldComponent>> = new Map();

  constructor(initialFields?: Record<string, FieldComponent>) {
    super(initialFields);
  }

  /**
   * Register a field type with a lazy import function.
   * The import is deferred until the field type is first resolved.
   */
  registerLazy(type: string, importer: LazyImporter): void {
    this.lazyLoaders.set(type, importer);
  }

  /**
   * Override `get` to support lazy loading on first access.
   * Checks eager components first (via protected access — no false warning),
   * then lazy loaders, then falls back to the parent get with its warning.
   */
  get(type: string): FieldComponent {
    const eagerComp = this.components.get(type);
    if (eagerComp) return eagerComp;

    if (this.lazyLoaders.has(type)) {
      return this.createLazyComponent(type);
    }

    return super.get(type);
  }

  /**
   * Pre-load a lazy field.
   */
  async preload(type: string): Promise<boolean> {
    if (!this.lazyLoaders.has(type)) return false;
    try {
      await this.resolveLazy(type);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Pre-load multiple fields in parallel.
   */
  async preloadMany(types: string[]): Promise<number> {
    const results = await Promise.allSettled(types.map((t) => this.preload(t)));
    return results.filter((r) => r.status === "fulfilled" && r.value).length;
  }

  /** List of registered lazy field types (not yet loaded). */
  getLazyTypes(): string[] {
    return Array.from(this.lazyLoaders.keys());
  }

  /** List of eagerly registered field types. */
  getEagerTypes(): string[] {
    return Object.keys(this.getAll());
  }

  /** Merge another registry into this one. */
  merge(other: RegistryStore): void {
    const all = other.getAll();
    Object.entries(all).forEach(([type, component]) => {
      this.register(type, component);
    });
    if (other instanceof LazyRegistryStore) {
      other.getLazyTypes().forEach((type) => {
        const loader = (other as any).lazyLoaders.get(type) as LazyImporter;
        if (loader) this.registerLazy(type, loader);
      });
    }
  }

  private createLazyComponent(type: string): FieldComponent {
    const LazyField = React.lazy(async () => {
      try {
        const mod = await this.resolveLazy(type);
        return { default: mod };
      } catch (err) {
        console.error(
          `[LazyRegistry] Failed to load field type "${type}":`,
          err
        );
        return { default: this.createFallbackComponent(type) };
      }
    });

    const Wrapper = React.forwardRef<any, any>((props, ref) => (
      <React.Suspense
        fallback={
          <div className="h-[var(--z-input-height)] w-full bg-surface border border-border/30 animate-pulse rounded-[var(--radius-md)]" />
        }
      >
        {/* Lazy field modules are opaque, so the ref is forwarded untyped. */}
        {React.createElement(LazyField as any, { ref, ...(props as Record<string, unknown>) })}
      </React.Suspense>
    ));
    Wrapper.displayName = `LazyField(${type})`;
    (Wrapper as any).__isLazy = true;

    return Wrapper as FieldComponent;
  }

  private async resolveLazy(type: string): Promise<FieldComponent> {
    if (this.loadingFields.has(type)) {
      return this.loadingFields.get(type)!;
    }

    const loader = this.lazyLoaders.get(type);
    if (!loader) {
      throw new Error(`No lazy loader registered for type "${type}"`);
    }

    const promise = loader().then((result) => {
      const component = (result as any).default ?? result;
      this.register(type, component);
      this.lazyLoaders.delete(type);
      this.loadingFields.delete(type);
      return component as FieldComponent;
    });

    this.loadingFields.set(type, promise);
    return promise;
  }

  private createFallbackComponent(type: string): FieldComponent {
    const Fallback = () => (
      <div
        className="p-4 border border-dashed border-danger/30 rounded-lg bg-danger/5 text-danger font-mono text-[10px] sm:text-xs"
        data-testid={`lazy-load-error-${type}`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1 px-1.5 bg-danger text-white rounded font-bold uppercase">
            Load Error
          </span>
          <span className="font-bold">{type}</span>
        </div>
      </div>
    );
    return Fallback as FieldComponent;
  }
}
