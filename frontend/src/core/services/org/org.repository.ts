import { createRepository } from "@services/core/repo.factory";

import type {
  Branch,
  BusinessUnit,
  Company,
} from "@features/auth/services/session.types";

import { BaseHTTPClientService } from "../http/core/http.client.service";
import { OrgEndpoints } from "./org.endpoints";

/**
 * OrgRepository Interface
 */
export interface OrgRepository {
  getCompanies(): Promise<Company[]>;
  getBusinessUnits(companyId: string): Promise<BusinessUnit[]>;
  getBranches(businessUnitId: string): Promise<Branch[]>;
}

/**
 * createOrgRepo: Functional Organizational Repository Factory
 */
export function createOrgRepo(client: BaseHTTPClientService): OrgRepository {
  const repo = createRepository(client, OrgEndpoints);

  return {
    getCompanies: () => repo.getCompanies(undefined as void),
    getBusinessUnits: (companyId) => repo.getBusinessUnits({ companyId }),
    getBranches: (businessUnitId) => repo.getBranches({ businessUnitId }),
  };
}
