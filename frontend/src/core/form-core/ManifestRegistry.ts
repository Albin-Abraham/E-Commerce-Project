/**
 * @file ManifestRegistry.ts
 * @description Unified registry for field types, layout renderers, field components,
 * and per-type InstanceDefinition defaults.
 *
 * Replaces 5 scattered registries:
 *   - `FIELD_REGISTRY`       → `manifestRegistry.getField(type)`
 *   - `fieldRegistry`        → `manifestRegistry.getFieldComponent(type)`
 *   - `FIELD_METADATA`       → `manifestRegistry.getLabel(type)` / `getIcon(type)`
 *   - `layoutRendererRegistry` → `manifestRegistry.getLayout(type)`
 *   - `RegistryStore.definitions` → `manifestRegistry.getInstanceDefaults(type)`
 *
 * Each field type registers **once** via `registerField()`, which provides the
 * complete routing, rendering, capabilities, and metadata contract.
 *
 * @module ManifestRegistry
 */
import type {
  FieldManifest,
  FieldRouting,
  InstanceDefinition,
  LayoutRendererManifest,
  ManifestFieldCategory,
} from "./domain/manifest";
import {
  type FieldAdapter,
  fieldAdapterRegistry,
} from "./domain/field-adapter-registry";

/**
 * ManifestRegistry — Central authority for field-type metadata.
 *
 * Features:
 * - Single registration for all metadata (category, routing, capabilities, icons, etc.)
 * - Backward-compatible alias support (e.g. "email" → "text")
 * - Lazy component resolution via `resolveFieldComponent()`
 * - Per-type InstanceDefinition defaults (options source, value mapping, selection config)
 * - Layout renderer registration (CardRenderer, TabsRenderer, etc.)
 *
 * Usage:
 * ```ts
 * manifestRegistry.registerField({
 *   type: "select",
 *   category: "input",
 *   routing: "leaf",
 *   capabilities: { hasValue: true, hasValidity: true, ... },
 *   label: "Select Dropdown",
 *   wrapper: { enabled: true },
 * });
 *
 * const category = manifestRegistry.getCategory("select"); // "input"
 * ```
 */
export class ManifestRegistry {
  /** @internal Map of field type → FieldManifest (including aliases). */
  private fields = new Map<string, FieldManifest>();

  /** @internal Map of layout type → LayoutRendererManifest. */
  private layouts = new Map<string, LayoutRendererManifest>();

  /** @internal Map of field type → eagerly-loaded component (overrides manifest.component). */
  private fieldComponents = new Map<string, any>();

  /** @internal Map of field type → Factory that produces InstanceDefinition defaults for that type. */
  private instanceDefaults = new Map<
    string,
    (schemaField: any) => InstanceDefinition
  >();

  // ── Field registration ──────────────────────────────────────────────────

  /**
   * Register a single field manifest.
   * Also creates alias entries for `manifest.aliases`.
   *
   * @param manifest - Complete FieldManifest for the field type.
   */
  registerField(manifest: FieldManifest): void {
    this.fields.set(manifest.type, { ...manifest, _isAlias: false });
    for (const alias of manifest.aliases ?? []) {
      this.fields.set(alias, { ...manifest, type: alias, _isAlias: true });
    }
  }

  /**
   * Register an eager React component override for a field type.
   * Used by `registry.tsx` and `LazyRegistryStore.register()` to sync
   * legacy registrations into the manifest system.
   *
   * @param type - Field type string.
   * @param component - React component for this field type.
   */
  registerFieldComponent(
    type: string,
    component: any
  ): void {
    this.fieldComponents.set(type, component);
  }

  /**
   * Register a factory that produces InstanceDefinition defaults for a field type.
   *
   * The factory receives the schema field object, allowing defaults to be
   * conditional per instance. Merged with schema-level config (remoteOptions, options, etc.)
   * in `resolveInstanceDefinition()`.
   *
   * @param type - Field type string (e.g. "select", "autocomplete").
   * @param factory - Function receiving the schema field and returning InstanceDefinition defaults.
   */
  registerInstanceDefaults(
    type: string,
    factory: (schemaField: any) => InstanceDefinition
  ): void {
    this.instanceDefaults.set(type, factory);
  }

  // ── Layout registration ─────────────────────────────────────────────────

  /**
   * Register a custom FieldAdapter for type-specific parse, serialize, format, and validate.
   *
   * @param adapter - Implementation of FieldAdapter.
   */
  registerAdapter<T = unknown>(adapter: FieldAdapter<T>): void {
    fieldAdapterRegistry.register(adapter);
  }

  /**
   * Get a registered FieldAdapter for a given field type.
   *
   * @param type - Field type string.
   */
  getAdapter<T = unknown>(type: string): FieldAdapter<T> | undefined {
    return fieldAdapterRegistry.get<T>(type);
  }

  /**
   * Register a layout renderer manifest.
   *
   * @param manifest - Complete LayoutRendererManifest.
   */
  registerLayout(manifest: LayoutRendererManifest): void {
    this.layouts.set(manifest.type, manifest);
  }

  // ── Queries ─────────────────────────────────────────────────────────────

  /**
   * Get the FieldManifest for a given type.
   *
   * @param type - Field type string.
   * @returns The FieldManifest, or `undefined` if not registered.
   */
  getField(type: string): FieldManifest | undefined {
    return this.fields.get(type);
  }

  /**
   * Get the LayoutRendererManifest for a given layout type.
   *
   * @param type - Layout type string.
   * @returns The LayoutRendererManifest, or `undefined` if not registered.
   */
  getLayout(type: string): LayoutRendererManifest | undefined {
    return this.layouts.get(type);
  }

  /**
   * Get the eager component override for a field type.
   *
   * @param type - Field type string.
   * @returns The registered component, or `undefined`.
   */
  getFieldComponent(type: string): any {
    return this.fieldComponents.get(type);
  }

  /**
   * Resolve the component for a field type with lazy loading support.
   *
   * Resolution priority:
   * 1. `manifest.loader()` — async lazy import
   * 2. `registerFieldComponent()` — eager override
   * 3. `manifest.component` — inline component from manifest
   *
   * @param type - Field type string.
   * @returns A promise resolving to the React component, or `undefined`.
   */
  async resolveFieldComponent(
    type: string
  ): Promise<React.ComponentType<any> | undefined> {
    const manifest = this.fields.get(type);
    if (manifest?.loader) {
      const mod = await manifest.loader();
      return mod.default;
    }
    return this.fieldComponents.get(type) ?? (manifest?.component as any);
  }

  /**
   * Get the manifest category for a field type.
   *
   * @param type - Field type string.
   * @returns The manifest category, defaults to `"input"` if not registered.
   */
  getCategory(type: string): ManifestFieldCategory {
    return this.fields.get(type)?.category ?? "input";
  }

  /**
   * Get the routing strategy for a field type.
   *
   * @param type - Field type string.
   * @returns The routing value, defaults to `"leaf"` if not registered.
   */
  getRouting(type: string): FieldRouting {
    return this.fields.get(type)?.routing ?? "leaf";
  }

  /**
   * Get the capabilities contract for a field type.
   *
   * @param type - Field type string.
   * @returns The FieldCapabilities object, or `undefined` if not registered.
   */
  getCapabilities(type: string) {
    return this.fields.get(type)?.capabilities;
  }

  /**
   * Whether a field type acts as a container (renders children).
   *
   * @param type - Field type string.
   * @returns `true` if category is `"container"` or `"composite"`.
   */
  isContainer(type: string): boolean {
    const cat = this.getCategory(type);
    return cat === "container" || cat === "composite";
  }

  /**
   * Whether a field type is structural (container, composite, or repeater).
   *
   * @param type - Field type string.
   * @returns `true` if category is container/composite or routing is "repeater".
   */
  isStructural(type: string): boolean {
    return this.isContainer(type) || this.getRouting(type) === "repeater";
  }

  /**
   * Whether a field type accepts and renders children.
   *
   * @param type - Field type string.
   * @returns `true` if the manifest's `layout.acceptsChildren` is `true`.
   */
  acceptsChildren(type: string): boolean {
    return this.fields.get(type)?.layout?.acceptsChildren ?? false;
  }

  /**
   * Get the InstanceDefinition defaults factory for a field type.
   *
   * @param type - Field type string.
   * @returns The factory function, or `undefined`.
   */
  getInstanceDefaults(
    type: string
  ): ((schemaField: any) => InstanceDefinition) | undefined {
    return this.instanceDefaults.get(type);
  }

  /**
   * Get the withAtom wrapper configuration for a field type.
   *
   * @param type - Field type string.
   * @returns The wrapper config (enabled, showLabel, wrapOuter), or `undefined`.
   */
  getWrapper(
    type: string
  ):
    | { enabled: boolean; showLabel?: boolean; wrapOuter?: boolean }
    | undefined {
    return this.fields.get(type)?.wrapper;
  }

  /**
   * Get the human-readable label for a field type.
   *
   * @param type - Field type string.
   * @returns The label, or the type string itself as fallback.
   */
  getLabel(type: string): string {
    return this.fields.get(type)?.label ?? type;
  }

  /**
   * Get the icon component for a field type.
   *
   * @param type - Field type string.
   * @returns The icon component, or `undefined`.
   */
  getIcon(type: string): React.ComponentType<{ size?: number }> | undefined {
    return this.fields.get(type)?.icon;
  }

  /**
   * Get all registered field manifests (including aliases).
   *
   * @returns Array of all FieldManifest entries.
   */
  getAllFields(): FieldManifest[] {
    return Array.from(this.fields.values());
  }

  /**
   * Get only the primary (non-alias) field manifests.
   * Useful for builder UIs that should show each distinct field type once.
   *
   * @returns Array of primary FieldManifest entries.
   */
  getAllPrimaryFields(): FieldManifest[] {
    return Array.from(this.fields.values()).filter((m) => !m._isAlias);
  }

  /**
   * Get all registered layout renderer manifests.
   *
   * @returns Array of all LayoutRendererManifest entries.
   */
  getAllLayouts(): LayoutRendererManifest[] {
    return Array.from(this.layouts.values());
  }

  /**
   * Check if a field type is registered.
   *
   * @param type - Field type string.
   * @returns `true` if the type (or alias) exists in the registry.
   */
  hasField(type: string): boolean {
    return this.fields.has(type);
  }

  /**
   * Check if a layout type is registered.
   *
   * @param type - Layout type string.
   * @returns `true` if the layout type exists in the registry.
   */
  hasLayout(type: string): boolean {
    return this.layouts.has(type);
  }

  // ── Bulk registration ───────────────────────────────────────────────────

  /**
   * Register multiple field manifests in a single call.
   *
   * @param manifests - Array of FieldManifest objects.
   */
  registerFields(manifests: FieldManifest[]): void {
    for (const m of manifests) this.registerField(m);
  }

  /**
   * Register multiple layout renderer manifests in a single call.
   *
   * @param manifests - Array of LayoutRendererManifest objects.
   */
  registerLayouts(manifests: LayoutRendererManifest[]): void {
    for (const m of manifests) this.registerLayout(m);
  }
}

/** Singleton instance used across the form system. */
export const manifestRegistry = new ManifestRegistry();
