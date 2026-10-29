/**
 * Strongly-Typed URL Parameter Contracts for Table and Grid Engines.
 */

export type TableSortDirection = "asc" | "desc";

export interface TableSortRule<TData> {
  field: keyof TData;
  direction: TableSortDirection;
}

export interface TableUrlState<TData> {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: keyof TData;
  sortOrder?: TableSortDirection;
  sortRules?: Array<TableSortRule<TData>>;
  filters?: Partial<Record<keyof TData, string | number | boolean | Array<string | number>>>;
}

/**
 * Serializes a strongly-typed TableUrlState into URLSearchParams with optional table prefixing.
 */
export function buildTableQueryString<TData>(
  state: TableUrlState<TData>,
  prefix = ""
): URLSearchParams {
  const params = new URLSearchParams();
  const key = (k: string) => (prefix ? `${prefix}_${k}` : k);

  if (state.page !== undefined && state.page > 1) {
    params.set(key("page"), String(state.page));
  }

  if (state.pageSize !== undefined && state.pageSize !== 10) {
    params.set(key("limit"), String(state.pageSize));
  }

  if (state.search && state.search.trim()) {
    params.set(key("q"), state.search.trim());
  }

  if (state.sortBy) {
    params.set(key("sort"), `${String(state.sortBy)}:${state.sortOrder || "asc"}`);
  }

  if (state.filters) {
    Object.entries(state.filters).forEach(([filterKey, filterVal]) => {
      if (filterVal !== undefined && filterVal !== null && filterVal !== "") {
        params.set(
          key(`filter_${filterKey}`),
          Array.isArray(filterVal) ? filterVal.join(",") : String(filterVal)
        );
      }
    });
  }

  return params;
}

/**
 * Deserializes URLSearchParams into a strongly-typed TableUrlState.
 */
export function parseTableQueryString<TData>(
  params: URLSearchParams,
  prefix = ""
): TableUrlState<TData> {
  const state: TableUrlState<TData> = {};
  const key = (k: string) => (prefix ? `${prefix}_${k}` : k);

  const pageVal = params.get(key("page"));
  if (pageVal) state.page = Math.max(1, parseInt(pageVal, 10) || 1);

  const limitVal = params.get(key("limit"));
  if (limitVal) state.pageSize = Math.max(1, parseInt(limitVal, 10) || 10);

  const qVal = params.get(key("q"));
  if (qVal) state.search = qVal;

  const sortVal = params.get(key("sort"));
  if (sortVal) {
    const [field, dir] = sortVal.split(":");
    state.sortBy = field as keyof TData;
    state.sortOrder = dir === "desc" ? "desc" : "asc";
  }

  const filters: Partial<Record<keyof TData, any>> = {};
  const filterPrefix = key("filter_");

  params.forEach((value, k) => {
    if (k.startsWith(filterPrefix)) {
      const fieldName = k.slice(filterPrefix.length) as keyof TData;
      filters[fieldName] = value.includes(",") ? value.split(",") : value;
    }
  });

  if (Object.keys(filters).length > 0) {
    state.filters = filters;
  }

  return state;
}
