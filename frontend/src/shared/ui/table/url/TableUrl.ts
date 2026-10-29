import { TableUrlAdapters } from "@ui/table/url/adapters/TableUrlAdapters";
import { FilterUrlCategory } from "@ui/table/url/categories/FilterUrlCategory";
import { PaginationUrlCategory } from "@ui/table/url/categories/PaginationUrlCategory";
import { SearchUrlCategory } from "@ui/table/url/categories/SearchUrlCategory";
import { SortUrlCategory } from "@ui/table/url/categories/SortUrlCategory";
import { useTableUrlReader } from "@ui/table/url/hooks/useTableUrlReader";
import { useTableUrlWriter } from "@ui/table/url/hooks/useTableUrlWriter";
import { FilterParser } from "@ui/table/url/parser/FilterParser";
import { SearchParser } from "@ui/table/url/parser/SearchParser";
import { SortParser } from "@ui/table/url/parser/SortParser";

export type { TableUrlPort } from "@ui/table/url/TableUrlPort";
export { TableUrlKeyResolver } from "@ui/table/url/TableUrlKeyResolver";
export { AppendPipeline } from "@ui/table/url/AppendPipeline";
export { ParsePipeline } from "@ui/table/url/ParsePipeline";

/**
 * TableUrl — Static class namespace for all URL utilities.
 *
 * Discovery DX:
 *   TableUrl.Sort.serialize(...)
 *   TableUrl.Filter.deserialize(...)
 *   TableUrl.Parser.Sort.parseOne(...)
 *   TableUrl.Adapters.useReactRouter()
 *   TableUrl.Adapters.createMock()
 *   TableUrl.useReader(...)
 *   TableUrl.useWriter(...)
 */
export const TableUrl = {
  // ── Pure URL categories ───────────────────────────────────────────
  Sort: SortUrlCategory,
  Filter: FilterUrlCategory,
  Pagination: PaginationUrlCategory,
  Search: SearchUrlCategory,

  // ── Adapter factory (concrete implementations of TableUrlPort) ────
  Adapters: TableUrlAdapters,

  // ── Parser layer (advanced — direct access to validators) ─────────
  Parser: Object.freeze({
    Sort: SortParser,
    Filter: FilterParser,
    Search: SearchParser,
  }),

  // ── Hooks ─────────────────────────────────────────────────────────
  useReader: useTableUrlReader,
  useWriter: useTableUrlWriter,
} as const;
