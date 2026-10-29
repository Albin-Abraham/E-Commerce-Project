/**
 * @file field-adapter-registry.ts
 * @description Central typed registry for custom Field Adapters (OCP / Strategy Pattern).
 *
 * Allows registering custom field types with domain-level parsing, serialization,
 * formatting, and validation without modifying FormCore or engine.ts.
 *
 * @module FieldAdapterRegistry
 */

/**
 * Contract for a pluggable Field Adapter in Form-Core 3.0.
 *
 * @template TValue - Internal domain model representation for this field type.
 */
export interface FieldAdapter<TValue = unknown> {
  /** Unique field type key (e.g. 'color-palette', 'currency-range', 'signature') */
  readonly type: string;

  /** Coerces external/UI input (e.g. raw text, event) into internal model value */
  parse?(input: unknown): TValue;

  /** Serializes the internal model value for API payloads or persistent storage */
  serialize?(value: TValue): unknown;

  /** Formats the internal model value for human-readable display */
  format?(value: TValue): string;

  /** Custom domain validation rule for this field type */
  validate?(
    value: TValue,
    context?: Record<string, unknown>
  ): boolean | string | Promise<boolean | string>;
}

/**
 * Registry holding pluggable FieldAdapter instances.
 */
export class FieldAdapterRegistry {
  private static instance: FieldAdapterRegistry;
  private adapters = new Map<string, FieldAdapter<any>>();

  public static getInstance(): FieldAdapterRegistry {
    if (!FieldAdapterRegistry.instance) {
      FieldAdapterRegistry.instance = new FieldAdapterRegistry();
    }
    return FieldAdapterRegistry.instance;
  }

  /**
   * Registers a custom field adapter.
   *
   * @param adapter - Implementation of FieldAdapter.
   */
  public register<T = unknown>(adapter: FieldAdapter<T>): void {
    this.adapters.set(adapter.type, adapter);
  }

  /**
   * Retrieves a registered field adapter by type.
   */
  public get<T = unknown>(type: string): FieldAdapter<T> | undefined {
    return this.adapters.get(type);
  }

  /**
   * Checks whether an adapter is registered for a given field type.
   */
  public has(type: string): boolean {
    return this.adapters.has(type);
  }

  /**
   * Coerces raw input using the registered adapter's parse method if present.
   */
  public parse(type: string, input: unknown): unknown {
    const adapter = this.adapters.get(type);
    return adapter?.parse ? adapter.parse(input) : input;
  }

  /**
   * Serializes a model value using the registered adapter's serialize method if present.
   */
  public serialize(type: string, value: unknown): unknown {
    const adapter = this.adapters.get(type);
    return adapter?.serialize ? adapter.serialize(value) : value;
  }

  /**
   * Formats a model value using the registered adapter's format method if present.
   */
  public format(type: string, value: unknown): string {
    const adapter = this.adapters.get(type);
    return adapter?.format ? adapter.format(value) : String(value ?? "");
  }

  /**
   * Clears registered adapters (useful for test isolation).
   */
  public clear(): void {
    this.adapters.clear();
  }
}

/** Global singleton instance */
export const fieldAdapterRegistry = FieldAdapterRegistry.getInstance();

/**
 * Convenience helper to register a field adapter.
 */
export function registerFieldAdapter<T = unknown>(adapter: FieldAdapter<T>): void {
  fieldAdapterRegistry.register(adapter);
}
