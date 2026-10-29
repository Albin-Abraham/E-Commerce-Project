import type { ParseResult } from "@ui/table/types";
import { fail, ok } from "./ParseResult";

/**
 * SearchParser
 *
 * Parses, normalises, and sanitises search string URL params.
 * Provides a matches() utility for client-side filtering.
 */

export interface ParsedSearch {
  raw: string;
  normalized: string; // trimmed + collapsed whitespace
  terms: string[]; // individual search terms after split
  isEmpty: boolean;
}

export interface SearchParserConfig {
  maxLength: number;
  minTermLength: number;
}

const DEFAULT: SearchParserConfig = { maxLength: 200, minTermLength: 1 };

export const SearchParser = Object.freeze({
  /**
   * parse — raw string → ParsedSearch
   */
  parse(
    raw: string,
    config: SearchParserConfig = DEFAULT
  ): ParseResult<ParsedSearch> {
    if (!raw) {
      return ok({ raw: "", normalized: "", terms: [], isEmpty: true });
    }

    if (raw.length > config.maxLength) return fail("Search", raw, "TOO_LONG");

    const normalized = raw.trim().replace(/\s+/g, " ");
    const terms = normalized
      .split(" ")
      .filter((t) => t.length >= config.minTermLength);

    return ok({ raw, normalized, terms, isEmpty: terms.length === 0 });
  },

  /**
   * format — normalize for URL (trim, collapse whitespace — consistent with parse())
   */
  format(value: string): string {
    return (value ?? "").trim().replace(/\s+/g, " ");
  },

  /**
   * matches — check if a target string matches all parsed search terms.
   * Returns true when parsed is empty (no search active).
   */
  matches(parsed: ParsedSearch, target: string): boolean {
    if (parsed.isEmpty) return true;
    const lower = target?.toLowerCase() ?? "";
    return parsed.terms.every((t) => lower.includes(t.toLowerCase()));
  },
});
