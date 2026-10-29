import { SearchParser } from "@ui/table/url/parser/SearchParser";

/**
 * SearchUrlCategory
 */
export const SearchUrlCategory = Object.freeze({
  serialize(value: string, key: string): Record<string, string> {
    const formatted = SearchParser.format(value);
    return formatted ? { [key]: formatted } : {};
  },

  deserialize(params: URLSearchParams, key: string): string {
    const raw = params.get(key) ?? "";
    const result = SearchParser.parse(raw);
    return result.ok ? result.value.normalized : "";
  },
});
