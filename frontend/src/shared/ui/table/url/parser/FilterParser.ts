import type { ColumnFiltersState } from "@tanstack/react-table";

import type { ParseResult } from "@ui/table/types";
import { fail, ok } from "./ParseResult";

/**
 * FilterParser
 *
 * Parses column filter params from URLSearchParams.
 * Guards against injection via allowedCols whitelist and column ID regex.
 *
 * COMPACT FORMAT (default):
 *   colId:value  → { colId, value }
 *   Multiple filters share the same key:
 *     filter=status:active&filter=role:admin
 *
 * LEGACY FORMAT (bracket notation, still supported for backward compat):
 *   filter[colId]=value
 */

export interface ParsedFilter {
  colId: string;
  value: string;
  asNumber?: number;
  asBoolean?: boolean;
  asDate?: Date;
}

export interface FilterParserConfig {
  maxLength: number;
  maxFilters: number;
  allowedCols?: string[];
}

const DEFAULT: FilterParserConfig = { maxLength: 200, maxFilters: 10 };

const COLUMN_ID_RE = /^[\w-]+$/;

export const FilterParser = Object.freeze({
  /**
   * parseOne — parse a single colId + value pair
   */
  parseOne(
    colId: string,
    raw: string,
    config: FilterParserConfig = DEFAULT
  ): ParseResult<ParsedFilter> {
    if (!colId || !COLUMN_ID_RE.test(colId))
      return fail("Filter.colId", colId, "INVALID_VALUE");

    if (config.allowedCols && !config.allowedCols.includes(colId))
      return fail("Filter.colId", colId, "INVALID_VALUE");

    const value = raw.trim();
    if (!value) return fail("Filter.value", raw, "EMPTY");
    if (value.length > config.maxLength)
      return fail("Filter.value", raw, "TOO_LONG");

    const asNumber = Number(value);
    const asBoolean =
      value === "true" ? true : value === "false" ? false : undefined;
    const asDate = !isNaN(Date.parse(value)) ? new Date(value) : undefined;

    return ok({
      colId,
      value,
      asNumber: isNaN(asNumber) ? undefined : asNumber,
      asBoolean,
      asDate,
    });
  },

  /**
   * parseOneCompact — parse "colId:value" compact format
   */
  parseOneCompact(
    raw: string,
    config: FilterParserConfig = DEFAULT
  ): ParseResult<ParsedFilter> {
    const colonIndex = raw.indexOf(":");
    if (colonIndex <= 0) return fail("Filter", raw, "MALFORMED");

    const colId = raw.slice(0, colonIndex);
    const value = raw.slice(colonIndex + 1);
    return FilterParser.parseOne(colId, value, config);
  },

  /**
   * parseFromParams — extract all filter params
   *   Compact: reads from multi-value "filter" key → "colId:value" format
   *   Legacy:  reads from "filter[colId]" bracket notation
   */
  parseFromParams(
    params: URLSearchParams,
    prefix: string,
    config: FilterParserConfig = DEFAULT
  ): ParsedFilter[] {
    const results: ParsedFilter[] = [];

    // COMPACT FORMAT: single key with multiple "colId:value" values
    const filterKey = prefix.replace(/\[.*\]$/, ""); // "orders:filter[status]" → "orders:filter"
    const compactValues = params.getAll(filterKey);
    for (const raw of compactValues) {
      const result = FilterParser.parseOneCompact(raw, config);
      if (result.ok) results.push(result.value);
    }

    // LEGACY FORMAT: "filter[colId]=value" bracket notation
    params.forEach((val, key) => {
      if (!key.startsWith(`${prefix}[`) || !key.endsWith("]")) return;
      const colId = key.slice(prefix.length + 1, -1);
      const result = FilterParser.parseOne(colId, val, config);
      if (result.ok) results.push(result.value);
    });

    return results.slice(0, config.maxFilters);
  },

  /**
   * toTanStack — ParsedFilter[] → TanStack ColumnFiltersState
   */
  toTanStack(filters: ParsedFilter[]): ColumnFiltersState {
    return filters.map((f) => ({ id: f.colId, value: f.value }));
  },

  /**
   * format — ColumnFiltersState → URL entries Record (compact format)
   *   Multiple filters share the same key as "colId:value" values
   */
  format(
    filters: ColumnFiltersState,
    prefix: string
  ): Record<string, string[]> {
    const filterKey = prefix.replace(/\[.*\]$/, ""); // "orders:filter[status]" → "orders:filter"
    const values = filters
      .filter((f) => f.value != null && f.value !== "")
      .map((f) => `${f.id}:${f.value}`);
    return values.length > 0 ? { [filterKey]: values } : {};
  },

  /**
   * isOwnedKey — predicate: does key belong to this filter prefix?
   */
  isOwnedKey(key: string, prefix: string): boolean {
    const filterKey = prefix.replace(/\[.*\]$/, ""); // "orders:filter[status]" → "orders:filter"
    return (
      key === filterKey || (key.startsWith(`${prefix}[`) && key.endsWith("]"))
    );
  },
});
