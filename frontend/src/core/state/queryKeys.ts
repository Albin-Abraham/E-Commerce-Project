/**
 * Centralized Query Key Factory Helper
 *
 * Standardizes the React Query key taxonomy across the ZenOS platform.
 * Enforces hierarchical key nesting: [domain, scope, ...parameters].
 */

export interface BaseKeys {
  all: readonly unknown[];
  lists: readonly unknown[];
  list: (filters: Record<string, any>) => readonly unknown[];
  details: readonly unknown[];
  detail: (id: string | number) => readonly unknown[];
}

/**
 * Creates a standardized set of React Query keys for a specific domain.
 * Enforces namespacing to prevent cache collisions.
 *
 * @param domain Unique identifier for the domain (e.g. "patients", "products")
 */
export function createQueryKeys<
  Domain extends string,
  Filters extends Record<string, any> = Record<string, any>,
  ID extends string | number = string | number,
>(domain: Domain) {
  return {
    all: [domain] as const,
    lists: [domain, "list"] as const,
    list: (filters: Filters) => [domain, "list", filters] as const,
    details: [domain, "detail"] as const,
    detail: (id: ID) => [domain, "detail", id] as const,
  } as const;
}
