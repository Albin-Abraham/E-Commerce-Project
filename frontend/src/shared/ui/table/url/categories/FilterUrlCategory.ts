import type { ColumnFiltersState } from "@tanstack/react-table";

import { FilterParser } from "@ui/table/url/parser/FilterParser";
import type { FilterParserConfig } from "@ui/table/url/parser/FilterParser";

/**
 * FilterUrlCategory
 *
 * High-level serialize/deserialize for filter URL params.
 *
 * COMPACT FORMAT:
 *   colId:value — multiple values under single "filter" key
 *   Example: ?filter=role:admin&filter=status:active
 */
export const FilterUrlCategory = Object.freeze({
  serialize(
    filters: ColumnFiltersState,
    prefix: string
  ): Record<string, string[]> {
    return FilterParser.format(filters, prefix);
  },

  deserialize(
    params: URLSearchParams,
    prefix: string,
    config?: FilterParserConfig
  ): ColumnFiltersState {
    return FilterParser.toTanStack(
      FilterParser.parseFromParams(params, prefix, config)
    );
  },

  isOwnedKey(key: string, prefix: string): boolean {
    return FilterParser.isOwnedKey(key, prefix);
  },
});
