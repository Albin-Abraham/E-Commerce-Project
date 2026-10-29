/**
 * PaginationUrlCategory
 */
export interface PaginationUrlState {
  pageIndex: number;
  pageSize: number;
}

export const PaginationUrlCategory = Object.freeze({
  serialize(
    state: PaginationUrlState,
    keys: { page: string; size: string },
    defaults: { page: number; size: number }
  ): Record<string, string> {
    const out: Record<string, string> = {};
    if (state.pageIndex !== defaults.page)
      out[keys.page] = String(state.pageIndex);
    if (state.pageSize !== defaults.size)
      out[keys.size] = String(state.pageSize);
    return out;
  },

  deserialize(
    params: URLSearchParams,
    keys: { page: string; size: string },
    defaults: { page: number; size: number }
  ): PaginationUrlState {
    const rawPage = params.get(keys.page);
    const rawSize = params.get(keys.size);
    return {
      pageIndex:
        rawPage != null && !isNaN(Number(rawPage))
          ? Math.max(0, Number(rawPage))
          : defaults.page,
      pageSize:
        rawSize != null && !isNaN(Number(rawSize)) && Number(rawSize) > 0
          ? Number(rawSize)
          : defaults.size,
    };
  },
});
