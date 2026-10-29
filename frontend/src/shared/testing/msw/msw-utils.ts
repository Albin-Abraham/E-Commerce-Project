import { HttpResponse, type StrictRequest } from "msw";

export interface MswQueryParams {
  page: number;
  pageSize: number;
  sortField?: string;
  isDesc: boolean;
  search?: string;
  filters: Record<string, string>;
}

/**
 * Pure MSW Query Parameter Extractor
 * Extracts page, size, sort, search, and dynamic filter[x] params from any request.
 */
export const extractMswQueryParams = (
  request: StrictRequest<any>,
  tablePrefix?: string
): MswQueryParams => {
  const url = new URL(request.url);
  const prefix = tablePrefix ? `${tablePrefix}:` : "";

  const sortRaw = url.searchParams.get(`${prefix}sort`) || url.searchParams.get("sort");
  const isDesc = sortRaw?.startsWith("-") ?? false;
  const sortField = sortRaw ? (isDesc ? sortRaw.slice(1) : sortRaw) : undefined;

  const filterRegex = new RegExp(`^${prefix ? `${prefix}` : ""}filter\\[(.+)\\]$`);
  const filters: Record<string, string> = {};

  url.searchParams.forEach((val, key) => {
    const match = key.match(filterRegex);
    if (match) {
      filters[match[1]] = val;
    } else if (!tablePrefix) {
      const fallbackMatch = key.match(/^filter\[(.+)\]$/);
      if (fallbackMatch) filters[fallbackMatch[1]] = val;
    }
  });

  const pageVal =
    url.searchParams.get(`${prefix}page`) || url.searchParams.get("page") || "1";
  const sizeVal =
    url.searchParams.get(`${prefix}size`) ||
    url.searchParams.get(`${prefix}pageSize`) ||
    url.searchParams.get("pageSize") ||
    url.searchParams.get("size") ||
    "10";

  return {
    page: Math.max(1, Number(pageVal)),
    pageSize: Math.max(1, Number(sizeVal)),
    sortField,
    isDesc,
    search:
      url.searchParams.get(`${prefix}search`) ||
      url.searchParams.get("search") ||
      url.searchParams.get("q") ||
      undefined,
    filters,
  };
};

/**
 * Pure In-Memory Dataset Query Engine
 * Applies sorting, searching, column filtering, and pagination against fixture datasets.
 */
export const applyQueryToCollection = <T extends Record<string, any>>(
  dataset: T[],
  params: MswQueryParams
): { items: T[]; total: number } => {
  let filtered = [...dataset];

  // Search filter
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q))
    );
  }

  // Column filters (e.g. filter[status]=active)
  Object.entries(params.filters).forEach(([key, filterVal]) => {
    filtered = filtered.filter((row) => String(row[key]) === String(filterVal));
  });

  // Sorting
  if (params.sortField) {
    const key = params.sortField;
    filtered.sort((a, b) => {
      if (a[key] < b[key]) return params.isDesc ? 1 : -1;
      if (a[key] > b[key]) return params.isDesc ? -1 : 1;
      return 0;
    });
  }

  const total = filtered.length;
  const start = (params.page - 1) * params.pageSize;
  const items = filtered.slice(start, start + params.pageSize);

  return { items, total };
};

/**
 * Standard Envelope Response Generator
 * Wraps mock payloads in the project's standard API envelope.
 */
export const mockEnvelope = <T>(
  data: T,
  meta?: Record<string, any>,
  status: number = 200
) => {
  return HttpResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
};
