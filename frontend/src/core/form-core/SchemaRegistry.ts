import type { FormDefinition } from "./domain";

export type SchemaBuilderFactory = () =>
  | FormDefinition
  | Promise<FormDefinition>;

export type LazySchemaLoader = () => Promise<
  | FormDefinition
  | { default: FormDefinition }
  | { buildSchema: () => FormDefinition }
  | { [key: string]: any }
>;

/** Extract a FormDefinition from an imported module or return object */
function extractFormDefinition(mod: any): FormDefinition {
  if (!mod) throw new Error("[SchemaRegistry] Loaded module is empty");
  if (mod.default && (mod.default.id || mod.default.sections)) {
    return typeof mod.default === "function" ? mod.default() : mod.default;
  }
  if (typeof mod.buildSchema === "function") {
    return mod.buildSchema();
  }
  if (mod.id || mod.sections) {
    return mod;
  }
  const candidate = Object.values(mod).find(
    (val: any) =>
      val && typeof val === "object" && (val.id || val.sections || val.content)
  );
  if (candidate) return candidate as FormDefinition;
  throw new Error("[SchemaRegistry] Could not extract FormDefinition from loaded module");
}

/**
 * SchemaRegistry — Central authority for Form Schemas.
 *
 * Supports synchronous registration (`register`), asynchronous code-splitting (`registerLazy`),
 * prefetching/preloading (`preload`, `preloadMany`), and memoized caching.
 */
export class SchemaRegistry {
  private schemas = new Map<string, SchemaBuilderFactory>();
  private lazyLoaders = new Map<string, LazySchemaLoader>();
  private cache = new Map<string, FormDefinition>();

  /**
   * Register a synchronous or direct promise form schema factory.
   * @param formId Unique identifier for the form (e.g., "create-branch")
   * @param factory Function that returns the FormDefinition
   */
  public register(formId: string, factory: SchemaBuilderFactory): void {
    if (this.schemas.has(formId) || this.lazyLoaders.has(formId)) {
      this.cache.delete(formId);
    }
    this.schemas.set(formId, factory);
  }

  /**
   * Register a code-split lazy dynamic import loader.
   * Loaded only on demand when requested.
   * @param formId Unique identifier for the form
   * @param loader Dynamic import function (e.g., () => import('./employee-schema'))
   */
  public registerLazy(formId: string, loader: LazySchemaLoader): void {
    if (this.schemas.has(formId) || this.lazyLoaders.has(formId)) {
      this.cache.delete(formId);
    }
    this.lazyLoaders.set(formId, loader);
  }

  /**
   * Check if a schema (eager or lazy) is registered.
   */
  public has(formId: string): boolean {
    return (
      this.cache.has(formId) ||
      this.schemas.has(formId) ||
      this.lazyLoaders.has(formId)
    );
  }

  /**
   * Retrieve and build a form schema asynchronously with cache memoization.
   */
  public async resolve(formId: string): Promise<FormDefinition> {
    if (this.cache.has(formId)) {
      return this.cache.get(formId)!;
    }

    if (this.schemas.has(formId)) {
      const factory = this.schemas.get(formId)!;
      const result = await factory();
      const def = extractFormDefinition(result);
      this.cache.set(formId, def);
      return def;
    }

    if (this.lazyLoaders.has(formId)) {
      const loader = this.lazyLoaders.get(formId)!;
      const mod = await loader();
      const def = extractFormDefinition(mod);
      this.cache.set(formId, def);
      return def;
    }

    throw new Error(
      `[SchemaRegistry] No schema registered for form ID: "${formId}"`
    );
  }

  /**
   * Retrieve and build a form schema synchronously.
   */
  public resolveSync(formId: string): FormDefinition {
    if (this.cache.has(formId)) {
      return this.cache.get(formId)!;
    }

    const factory = this.schemas.get(formId);
    if (!factory) {
      if (this.lazyLoaders.has(formId)) {
        throw new Error(
          `[SchemaRegistry] Schema for "${formId}" is code-split (lazy). Use async resolve() or preload() instead.`
        );
      }
      throw new Error(
        `[SchemaRegistry] No schema registered for form ID: "${formId}"`
      );
    }
    const result = factory();
    if (result instanceof Promise) {
      throw new Error(
        `[SchemaRegistry] Schema for "${formId}" is async. Use resolve() instead.`
      );
    }
    const def = extractFormDefinition(result);
    this.cache.set(formId, def);
    return def;
  }

  /**
   * Preload a schema definition into cache in the background.
   */
  public async preload(formId: string): Promise<FormDefinition> {
    return this.resolve(formId);
  }

  /**
   * Preload multiple schema definitions concurrently.
   */
  public async preloadMany(formIds: string[]): Promise<FormDefinition[]> {
    return Promise.all(formIds.map((id) => this.resolve(id)));
  }

  /**
   * Clear cache for a specific form or entire registry.
   */
  public clearCache(formId?: string): void {
    if (formId) {
      this.cache.delete(formId);
    } else {
      this.cache.clear();
    }
  }
}

/** Singleton instance used across the form system. */
export const schemaRegistry = new SchemaRegistry();
