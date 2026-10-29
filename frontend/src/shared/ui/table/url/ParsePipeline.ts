import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";

import type { ParseError, UrlConfig } from "@ui/table/types";
import type { TableUrlKeyResolver } from "@ui/table/url/TableUrlKeyResolver";
import { PaginationUrlCategory } from "@ui/table/url/categories/PaginationUrlCategory";
import { FilterParser } from "@ui/table/url/parser/FilterParser";
import { SearchParser } from "@ui/table/url/parser/SearchParser";
import { SortParser } from "@ui/table/url/parser/SortParser";

/**
 * ParsePipeline
 *
 * Three-step inbound read pipeline:
 *   1. Extract raw strings from URLSearchParams
 *   2. Parse + validate via category parsers
 *   3. Map to TanStack state types
 *
 * Parse errors are collected and surfaced via .errors — never thrown.
 * The table degrades gracefully on malformed URLs.
 */

export interface PipelineResult {
  pageIndex: number;
  pageSize: number;
  search: string;
  sorting: SortingState;
  filters: ColumnFiltersState;
}

export class ParsePipeline {
  private _params: URLSearchParams;
  private _resolver: TableUrlKeyResolver;
  private _url: UrlConfig;
  private _errors: ParseError[] = [];

  constructor(
    params: URLSearchParams,
    resolver: TableUrlKeyResolver,
    url: UrlConfig
  ) {
    this._params = ParsePipeline._normalizeParams(params, resolver);
    this._resolver = resolver;
    this._url = url;
  }

  /**
   * Normalize URL params so both `table:search` and `table_search` formats work.
   * Legacy URLs or external links may use underscore instead of colon as separator.
   * This ensures readers accept both without breaking the canonical colon format.
   */
  private static _normalizeParams(
    params: URLSearchParams,
    resolver: TableUrlKeyResolver
  ): URLSearchParams {
    const normalized = new URLSearchParams();
    const prefix = resolver.prefix;
    const knownKeys = ["page", "size", "search", "sort", "filter"] as const;

    params.forEach((value, key) => {
      let remaining: string | null = null;
      if (key.startsWith(`${prefix}_`)) {
        remaining = key.slice(prefix.length + 1);
      }

      const isKnownLegacy =
        remaining != null &&
        knownKeys.some(
          (k) =>
            remaining === k ||
            remaining.startsWith(`${k}_`) ||
            remaining.startsWith(`${k}[`)
        );

      if (isKnownLegacy && remaining) {
        let canonical = key;
        if (remaining.startsWith("filter_")) {
          const colId = remaining.slice("filter_".length);
          canonical = `${prefix}:filter[${colId}]`;
        } else {
          canonical = `${prefix}:${remaining}`;
        }
        normalized.append(canonical, value);
      } else {
        normalized.append(key, value);
      }
    });

    return normalized;
  }

  extractPagination(): { pageIndex: number; pageSize: number } {
    return PaginationUrlCategory.deserialize(
      this._params,
      {
        page: this._resolver.key("page"),
        size: this._resolver.key("size"),
      },
      this._url.defaults as { page: number; size: number }
    );
  }

  extractSearch(): string {
    const raw = this._params.get(this._resolver.key("search")) ?? "";
    const result = SearchParser.parse(raw);
    if (!result.ok) {
      this._errors.push(result.error);
      return "";
    }
    return result.value.normalized;
  }

  extractSort(): SortingState {
    const rawValues = this._params.getAll(this._resolver.key("sort"));
    const config = {
      separator: this._url.format!.separator as ":" | "." | "-",
      maxFields: 5,
    };

    // Collect parse errors for individual invalid values
    rawValues.forEach((r) => {
      const result = SortParser.parseOne(r, config);
      if (!result.ok) this._errors.push(result.error);
    });

    return SortParser.toTanStack(SortParser.parseMany(rawValues, config));
  }

  extractFilters(): ColumnFiltersState {
    const parsed = FilterParser.parseFromParams(
      this._params,
      this._resolver.filterPrefix()
    );
    return FilterParser.toTanStack(parsed);
  }

  /**
   * extractAll — convenience method: extract all params at once
   */
  extractAll(): PipelineResult {
    return {
      ...this.extractPagination(),
      search: this.extractSearch(),
      sorting: this.extractSort(),
      filters: this.extractFilters(),
    };
  }

  get errors(): ParseError[] {
    return [...this._errors];
  }
  get hasErrors(): boolean {
    return this._errors.length > 0;
  }
}
