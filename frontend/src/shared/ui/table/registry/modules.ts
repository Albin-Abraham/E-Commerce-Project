/**
 * Module Registry
 *
 * Runtime registration bag for dynamic / untyped table extensions.
 */

const moduleRegistry = new Map<string, unknown>();

export function registerTableModule<T>(name: string, module: T): void {
  moduleRegistry.set(name, module);
}

export function getTableModule<T>(name: string): T | undefined {
  return moduleRegistry.get(name) as T | undefined;
}

export function hasTableModule(name: string): boolean {
  return moduleRegistry.has(name);
}

export function clearTableModuleRegistry(): void {
  moduleRegistry.clear();
}
