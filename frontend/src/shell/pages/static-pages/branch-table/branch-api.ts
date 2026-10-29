import { BaseServiceRequest } from "@core/services";
import type { Branch, BranchApiResponse, BranchQueryParams } from "./branch-types";

/**
 * Normalizes backend paginated response envelope into standard BranchApiResponse.
 * Strictly maps Backend-RestFul's ResponseFactory.paginated format ({ results, count, ... }).
 */
export function normalizeBranchApiResponse(
  payload: any,
  requestedPage = 0,
  requestedPageSize = 10
): BranchApiResponse {
  if (!payload || typeof payload !== "object") {
    return {
      status: 200,
      message: "Success",
      count: 0,
      total_pages: 1,
      current_page: requestedPage + 1,
      data: [],
    };
  }

  const results: any[] = Array.isArray(payload.results)
    ? payload.results
    : Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

  const count =
    typeof payload.count === "number"
      ? payload.count
      : typeof payload.totalCount === "number"
        ? payload.totalCount
        : results.length;

  const totalPages =
    typeof payload.total_pages === "number"
      ? payload.total_pages
      : Math.max(1, Math.ceil(count / requestedPageSize));

  const currentPage =
    typeof payload.current_page === "number"
      ? payload.current_page
      : requestedPage + 1;

  return {
    status: payload.status ?? 200,
    message: payload.message ?? "Success",
    count,
    total_pages: totalPages,
    current_page: currentPage,
    range: payload.range,
    next_url: payload.next_url ?? null,
    prev_url: payload.prev_url ?? null,
    has_next: payload.has_next ?? (currentPage < totalPages),
    has_prev: payload.has_prev ?? (currentPage > 1),
    data: results.map(normalizeBranchItem),
  };
}

/**
 * Normalizes a single branch record into a consistent domain model.
 */
function normalizeBranchItem(raw: any, index: number): Branch {
  if (!raw || typeof raw !== "object") {
    return {
      id: `br-${index + 1}`,
      code: `BR-${index + 1}`,
      name: "Unknown Branch",
      location: "HQ",
      opened_date: new Date().toISOString().split("T")[0],
      company: { id: "c-001", label: "Default", type: "company", display: "Default" },
      business_unit: { id: "bu-001", label: "General", type: "bu", display: "General" },
      status: "active",
    };
  }

  const isAll = Boolean(raw.is_all_branch);
  const derivedStatus = isAll ? "active" : raw.status ?? "active";

  return {
    id: String(raw.id ?? `br-${index + 1}`),
    code: String(raw.code ?? raw.branch_code ?? `BR-${index + 1}`),
    name: String(raw.name ?? raw.branch_name ?? "Branch"),
    location: String(raw.location ?? raw.city ?? "HQ"),
    opened_date: String(raw.opened_date ?? raw.establishedDate ?? ""),
    is_all_branch: isAll,
    status: derivedStatus,
    manager: raw.manager ?? raw.extensions?.extra_attributes?.manager ?? undefined,
    email: raw.email ?? raw.extensions?.extra_attributes?.email ?? undefined,
    phone: raw.phone ?? raw.extensions?.extra_attributes?.phone ?? undefined,
    city: raw.city ?? raw.extensions?.extra_attributes?.city ?? undefined,
    state: raw.state ?? raw.extensions?.extra_attributes?.state ?? undefined,
    country: raw.country ?? raw.extensions?.extra_attributes?.country ?? undefined,
    capacity: typeof raw.capacity === "number"
      ? raw.capacity
      : typeof raw.extensions?.extra_attributes?.capacity === "number"
        ? raw.extensions.extra_attributes.capacity
        : undefined,
    company: raw.company ?? {
      id: "comp-001",
      label: "System",
      type: "company",
      display: "System (comp-001)",
    },
    business_unit: raw.business_unit ?? {
      id: "bu-001",
      label: "All Business",
      type: "businessunit",
      display: "All Business (bu-001)",
    },
    catalog: raw.catalog ?? null,
    extensions: raw.extensions ?? null,
  };
}

/**
 * Branch API Service
 * Dispatches live HTTP GET strictly to `/api/v1/admin/branches/`.
 */
export async function fetchBranches(
  params: BranchQueryParams
): Promise<BranchApiResponse> {
  const { page = 0, page_size = 10, search = "", sort = [], filters = {} } = params;

  const urlParams = new URLSearchParams();
  // Backend uses 1-indexed pagination via PageNumberPagination
  urlParams.set("page", String(page + 1));
  urlParams.set("page_size", String(page_size));

  if (search && search.trim() !== "") {
    urlParams.set("search", search.trim());
  }

  // Guard against sorting on non-database/virtual fields like "status"
  if (sort && sort.length > 0) {
    const sortField = sort[0].key;
    if (sortField !== "status") {
      const sortValue = sort[0].dir === "desc" ? `-${sortField}` : sortField;
      urlParams.set("sort", sortValue);
    }
  }

  // Sanitize filters — exclude non-database fields and empty strings
  Object.entries(filters).forEach(([k, v]) => {
    if (k !== "status" && v !== undefined && v !== null && v !== "") {
      urlParams.set(k, String(v));
    }
  });

  const requestUrl = `/api/v1/admin/branches/?${urlParams.toString()}`;

  const res = await BaseServiceRequest.safeRequest<any>({
    url: requestUrl,
    method: "GET",
  });

  if (!res.success) {
    throw new Error(
      res.error?.message || "Failed to fetch branches from server"
    );
  }

  return normalizeBranchApiResponse(res.data?.data ?? res.data, page, page_size);
}
