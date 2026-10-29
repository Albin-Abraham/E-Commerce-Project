import type { ResolvedTableMeta } from "@ui/table/meta/TableMetaDefaults";
import type { UrlConfig } from "@ui/table/types";

/**
 * TableUrlKeyResolver
 *
 * Single source of truth for URL key computation.
 * All keys are prefixed with meta.id to namespace per-table URL params.
 *
 * Example with meta.id = "orders":
 *   key("page")      → "orders:page"
 *   filterKey("role")→ "orders:filter[role]"
 *   filterPrefix()   → "orders:filter"
 */
export class TableUrlKeyResolver {
  readonly prefix: string;
  private readonly _keys: UrlConfig["keys"];

  constructor(meta: ResolvedTableMeta) {
    this.prefix = meta.id;
    this._keys = meta.url.keys;
  }

  key(type: keyof UrlConfig["keys"]): string {
    return `${this.prefix}:${this._keys[type]}`;
  }

  filterKey(colId: string): string {
    return `${this.prefix}:${this._keys.filter}[${colId}]`;
  }

  filterPrefix(): string {
    return `${this.prefix}:${this._keys.filter}`;
  }

  /**
   * ownedKeys — returns all keys in the given URLSearchParams that belong
   * to this table instance (for clearing before rewrite).
   * Canonical: `{id}:page`. Legacy: `{id}_page` (known suffixes only).
   * Does not match pathname prefixes or other tables (`orders_list:page`).
   */
  ownedKeys(params: URLSearchParams): string[] {
    const owned: string[] = [];
    const colonPrefix = `${this.prefix}:`;
    const known = Object.values(this._keys);

    params.forEach((_, key) => {
      if (key.startsWith(colonPrefix)) {
        owned.push(key);
        return;
      }
      for (const suffix of known) {
        const underscored = `${this.prefix}_${suffix}`;
        if (key === underscored || key.startsWith(`${underscored}[`)) {
          owned.push(key);
          return;
        }
      }
    });
    return owned;
  }
}
