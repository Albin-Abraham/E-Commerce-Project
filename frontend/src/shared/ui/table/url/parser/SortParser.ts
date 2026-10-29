import type { SortingState } from "@tanstack/react-table";

import type { ParseResult } from "@ui/table/types";
import { fail, ok } from "./ParseResult";

/**
 * SortParser
 *
 * Parses, validates, formats, and maps sort URL values.
 * Single source of truth for sort format — no duplication between
 * serializer and deserializer.
 *
 * COMPACT FORMAT (default):
 *   -name  → descending by name
 *    name  → ascending by name
 *   -age   → descending by age
 *
 * LEGACY FORMAT (separator-based, still supported for backward compat):
 *   name:asc  → ascending by name
 *   name:desc → descending by name
 */

export interface ParsedSort {
  id: string;
  dir: "asc" | "desc";
}

export interface SortParserConfig {
  separator: ":" | "." | "-";
  maxFields: number;
  allowedIds?: string[];
}

const DEFAULT: SortParserConfig = { separator: ":", maxFields: 5 };

// Regex: column ID must be alphanumeric, dot, underscore, or hyphen
const COLUMN_ID_RE = /^[\w.-]+$/;

export const SortParser = Object.freeze({
  /**
   * parseOne — parse one raw sort string
   *   Compact:  "-name" → { id: "name", dir: "desc" }
   *             "name"  → { id: "name", dir: "asc" }
   *   Legacy:   "name:asc"  → { id: "name", dir: "asc" }
   *             "name:desc" → { id: "name", dir: "desc" }
   */
  parseOne(
    raw: string,
    config: SortParserConfig = DEFAULT
  ): ParseResult<ParsedSort> {
    if (!raw || raw.trim() === "") return fail("Sort", raw, "EMPTY");
    if (raw.length > 100) return fail("Sort", raw, "TOO_LONG");

    const trimmed = raw.trim();

    // COMPACT FORMAT: "-name" or "name"
    if (trimmed.startsWith("-")) {
      const id = trimmed.slice(1);
      if (!id || !COLUMN_ID_RE.test(id))
        return fail("Sort.id", id, "INVALID_VALUE");
      if (config.allowedIds && !config.allowedIds.includes(id))
        return fail("Sort.id", id, "INVALID_VALUE");
      return ok({ id, dir: "desc" });
    }

    // No separator in compact format → ascending
    if (!trimmed.includes(config.separator)) {
      if (!COLUMN_ID_RE.test(trimmed))
        return fail("Sort.id", trimmed, "INVALID_VALUE");
      if (config.allowedIds && !config.allowedIds.includes(trimmed))
        return fail("Sort.id", trimmed, "INVALID_VALUE");
      return ok({ id: trimmed, dir: "asc" });
    }

    // LEGACY FORMAT: "name:asc" or "name.desc"
    const parts = trimmed.split(config.separator);
    if (parts.length !== 2) return fail("Sort", trimmed, "MALFORMED");

    const [id, dir] = parts;

    if (!id || !COLUMN_ID_RE.test(id))
      return fail("Sort.id", id, "INVALID_VALUE");
    if (dir !== "asc" && dir !== "desc")
      return fail("Sort.dir", dir, "INVALID_VALUE");
    if (config.allowedIds && !config.allowedIds.includes(id))
      return fail("Sort.id", id, "INVALID_VALUE");

    return ok({ id, dir });
  },

  /**
   * parseMany — parse multiple sort strings, silently drops invalid ones
   */
  parseMany(
    values: string[],
    config: SortParserConfig = DEFAULT
  ): ParsedSort[] {
    return values
      .slice(0, config.maxFields)
      .map((v) => SortParser.parseOne(v, config))
      .filter((r): r is { ok: true; value: ParsedSort } => r.ok)
      .map((r) => r.value);
  },

  /**
   * format — ParsedSort → URL string (compact format)
   *   { id: "name", dir: "desc" } → "-name"
   *   { id: "name", dir: "asc" }  → "name"
   */
  format(sort: ParsedSort, _config?: SortParserConfig): string {
    return sort.dir === "desc" ? `-${sort.id}` : sort.id;
  },

  /**
   * toTanStack — ParsedSort[] → TanStack SortingState
   */
  toTanStack(sorts: ParsedSort[]): SortingState {
    return sorts.map((s) => ({ id: s.id, desc: s.dir === "desc" }));
  },

  /**
   * fromTanStack — TanStack SortingState → ParsedSort[]
   */
  fromTanStack(sorts: SortingState): ParsedSort[] {
    return sorts.map((s) => ({ id: s.id, dir: s.desc ? "desc" : "asc" }));
  },
});
