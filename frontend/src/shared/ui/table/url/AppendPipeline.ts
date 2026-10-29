import type { TableUrlKeyResolver } from "@ui/table/url/TableUrlKeyResolver";

/**
 * AppendPipeline
 *
 * Three-step outbound write pipeline:
 *   1. Clone current URLSearchParams (never mutate live params)
 *   2. Clear all keys owned by this table (via resolver.ownedKeys)
 *   3. Write fresh values using correct method per type:
 *      - .set()       for single-value params (page, size, search)
 *      - .appendAll() for multi-value params (sort, filter)
 *
 * COMPACT FORMAT:
 *   Sort:    -name (desc), name (asc) — multiple values under same key
 *   Filter:  colId:value — multiple values under same key
 *
 * IMPORTANT: build() returns a URLSearchParams object — never pass through
 * Object.fromEntries() which would collapse multi-value keys.
 */
export class AppendPipeline {
  private _next: URLSearchParams;
  private _resolver: TableUrlKeyResolver;

  constructor(current: URLSearchParams, resolver: TableUrlKeyResolver) {
    this._next = new URLSearchParams(current);
    this._resolver = resolver;
    this._clearOwned();
  }

  private _clearOwned(): void {
    const toDelete = this._resolver.ownedKeys(this._next);
    // Collect then delete — cannot delete during URLSearchParams iteration
    toDelete.forEach((k) => this._next.delete(k));
  }

  /**
   * set — single-value param. Skips if value is null/undefined/empty.
   */
  set(urlKey: string, value: string | null | undefined): this {
    if (value != null && value !== "") {
      this._next.set(urlKey, value);
    }
    return this;
  }

  /**
   * appendAll — multi-value param (sort, filter). Uses append() for each value
   * so all values share the same key name with multiple entries.
   */
  appendAll(urlKey: string, values: string[]): this {
    values.forEach((v) => {
      if (v) this._next.append(urlKey, v);
    });
    return this;
  }

  /**
   * setFilter — compact filter format: "colId:value" under single filter key.
   * Multiple filters share the same key as multiple values.
   */
  setFilter(colId: string, value: string | null | undefined): this {
    if (value != null && value !== "") {
      const filterKey = this._resolver.key("filter");
      this._next.append(filterKey, `${colId}:${value}`);
    }
    return this;
  }

  /**
   * build — return the final URLSearchParams.
   * Use adapter.set(pipeline.build()) — do NOT Object.fromEntries().
   */
  build(): URLSearchParams {
    return this._next;
  }

  /**
   * toEntries — convert the built URLSearchParams into the Record format
   * accepted by TableUrlPort.set(). Signals deletion by writing an empty
   * array for every owned key that no longer appears in the built params.
   *
   * This encapsulates the deletion-diffing loop that previously lived inside
   * useTableUrlWriter, keeping the hook as pure orchestration.
   *
   * @param ownedKeys — all keys owned by this table in the current live URL.
   */
  toEntries(
    ownedKeys: Iterable<string>
  ): Record<string, string | string[]> {
    const nextKeys = new Set<string>();
    this._next.forEach((_, key) => nextKeys.add(key));

    const entries: Record<string, string | string[]> = {};

    // Signal deletion for owned keys that dropped out of the new params
    for (const key of ownedKeys) {
      if (!nextKeys.has(key)) {
        entries[key] = [];
      }
    }

    // Collect remaining values (multi-value keys accumulate into arrays)
    this._next.forEach((val, key) => {
      if (!entries[key]) entries[key] = [];
      (entries[key] as string[]).push(val);
    });

    return entries;
  }
}
