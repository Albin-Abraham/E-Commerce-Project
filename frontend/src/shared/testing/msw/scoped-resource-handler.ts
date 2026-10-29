import { http } from "msw";
import {
  extractMswQueryParams,
  applyQueryToCollection,
  mockEnvelope,
} from "./msw-utils";

export interface ScopedItem {
  id: string | number;
  orgId?: string;
  branchId?: string;
  [key: string]: any;
}

/**
 * Creates MSW handlers for hierarchical, scoped resources.
 * Supports:
 * - Dynamic route param extraction (:orgId, :branchId, :id)
 * - Namespaced search, sort, filter, and pagination
 */
export const createScopedResourceHandler = <T extends ScopedItem>(
  endpointPattern: string,
  fixtureDataset: T[],
  tablePrefix?: string
) => {
  return [
    http.get(endpointPattern, ({ params, request }) => {
      const { orgId, branchId, id } = params as {
        orgId?: string;
        branchId?: string;
        id?: string;
      };

      // 1. Filter by hierarchical route scope
      let scoped = fixtureDataset.filter((item) => {
        if (orgId && item.orgId && item.orgId !== orgId) return false;
        if (branchId && item.branchId && item.branchId !== branchId) return false;
        return true;
      });

      // 2. Single entity detail request if :id provided
      if (id) {
        const entity = scoped.find((item) => String(item.id) === String(id));
        if (!entity) {
          return mockEnvelope({ message: `Entity ${id} not found in scope` }, undefined, 404);
        }
        return mockEnvelope(entity);
      }

      // 3. Extract and apply namespaced query params (sort, filter, page)
      const query = extractMswQueryParams(request, tablePrefix);
      const { items, total } = applyQueryToCollection(scoped, query);

      return mockEnvelope(items, {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
        scope: { orgId, branchId },
      });
    }),
  ];
};
