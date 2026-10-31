/**
 * Platform Tenancy: Tenancy Manager
 *
 * Coordinates backend session switching with Django REST Framework.
 */

import { apiClient } from "../networking/api-client";
import { runtimeConfig } from "../configuration/runtime-config";
import { tenantContext } from "./tenant-context";
import type { TenantCompany, TenantBranch } from "./tenant.types";

export class TenancyManager {
  /**
   * Switch active company and persist to Django session
   */
  public async switchCompany(company: TenantCompany): Promise<void> {
    tenantContext.setCompany(company);

    try {
      await apiClient.post("/sessions/set-company/", {
        company_id: company.id,
      });
    } catch (err) {
      if (runtimeConfig.isProduction()) {
        throw err;
      }
      // Allowed in development / testing
    }
  }

  /**
   * Switch active branch and persist to Django session
   */
  public async switchBranch(branch: TenantBranch): Promise<void> {
    tenantContext.setBranch(branch);

    try {
      await apiClient.post("/sessions/set-branch/", {
        branch_id: branch.id,
      });
    } catch (err) {
      if (runtimeConfig.isProduction()) {
        throw err;
      }
      // Allowed in development / testing
    }
  }

  /**
   * Load user companies and branches from backend
   */
  public async loadTenancyHierarchy(): Promise<void> {
    try {
      const companies = await apiClient.get<TenantCompany[]>("/sessions/user/companies/");
      const branches = await apiClient.get<TenantBranch[]>("/sessions/user/branches/");
      tenantContext.setAvailableHierarchy(companies, branches);
    } catch (err) {
      if (runtimeConfig.isDevelopment() || runtimeConfig.isTest()) {
        const mockCompanies: TenantCompany[] = [
          {
            id: "comp-zenos-main",
            name: "Zenith Retail Corp",
            code: "ZEN-MAIN",
            currency: "USD",
            isDefault: true,
          },
        ];
        const mockBranches: TenantBranch[] = [
          {
            id: "br-tokyo-flagship",
            companyId: "comp-zenos-main",
            name: "Tokyo Flagship Store",
            code: "TYO-01",
            isDefault: true,
          },
          {
            id: "br-osaka-hub",
            companyId: "comp-zenos-main",
            name: "Osaka Central Hub",
            code: "OSA-01",
          },
        ];
        tenantContext.setAvailableHierarchy(mockCompanies, mockBranches);
        return;
      }
      throw err;
    }
  }
}

export const tenancyManager = new TenancyManager();
