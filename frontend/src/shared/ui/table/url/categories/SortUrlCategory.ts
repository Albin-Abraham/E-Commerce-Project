import type { SortingState } from "@tanstack/react-table";

import { SortParser } from "@ui/table/url/parser/SortParser";
import type { SortParserConfig } from "@ui/table/url/parser/SortParser";

/**
 * SortUrlCategory
 *
 * High-level serialize/deserialize for sort URL params.
 * Delegates to SortParser for all format logic — single source of truth.
 */
export const SortUrlCategory = Object.freeze({
  serialize(sorts: SortingState, config?: SortParserConfig): string[] {
    return SortParser.fromTanStack(sorts).map((s) =>
      SortParser.format(s, config)
    );
  },

  deserialize(values: string[], config?: SortParserConfig): SortingState {
    return SortParser.toTanStack(SortParser.parseMany(values, config));
  },

  isOwnedKey(key: string, resolvedSortKey: string): boolean {
    return key === resolvedSortKey;
  },
});
