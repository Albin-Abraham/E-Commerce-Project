import { defineEndpoint } from "@services/core/repo.factory";

import type {
  Branch,
  BusinessUnit,
  Company,
} from "@features/auth/services/session.types";

/**
 * Organizational Endpoints Schema
 *
 * Aligned to backend session endpoints at /api/v1/sessions/user/
 */
export const OrgEndpoints = {
  /**
   * Fetch all companies the current user has access to.
   */
  getCompanies: defineEndpoint<void, Company[]>({
    path: "/api/v1/sessions/user/companies/",
    method: "GET",
    config: {
      transformResponse: { autoEnvelope: true },
    },
  }),

  /**
   * Fetch business units for a specific company.
   */
  getBusinessUnits: defineEndpoint<{ companyId: string }, BusinessUnit[]>({
    path: ({ companyId }) =>
      `/api/v1/sessions/user/business-units/?company_id=${companyId}`,
    method: "GET",
    config: {
      transformResponse: { autoEnvelope: true },
    },
  }),

  /**
   * Fetch branches for a specific business unit.
   */
  getBranches: defineEndpoint<{ businessUnitId: string }, Branch[]>({
    path: ({ businessUnitId }) =>
      `/api/v1/sessions/user/branches/?business_unit_id=${businessUnitId}`,
    method: "GET",
    config: {
      transformResponse: { autoEnvelope: true },
    },
  }),
};
