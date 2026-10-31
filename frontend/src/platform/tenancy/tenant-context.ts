/**
 * Platform Tenancy: Tenant Context State Holder
 */

import { RequestContext } from "../networking/request-context";
import { permissionEvaluator } from "../authorization/permission-evaluator";
import type { TenantCompany, TenantBranch, TenantFacility, TenantState } from "./tenant.types";

export type TenantChangeListener = (state: TenantState) => void;

export class TenantContext {
  private state: TenantState = {
    activeCompany: null,
    activeBranch: null,
    activeFacility: null,
    availableCompanies: [],
    availableBranches: [],
  };

  private listeners = new Set<TenantChangeListener>();

  public getState(): TenantState {
    return { ...this.state };
  }

  public setCompany(company: TenantCompany | null): void {
    this.state.activeCompany = company;
    // Reset active branch if switching company
    if (this.state.activeBranch && company && this.state.activeBranch.companyId !== company.id) {
      this.state.activeBranch = null;
    }
    this.syncRequestContext();
    this.notify();
  }

  public setBranch(branch: TenantBranch | null): void {
    this.state.activeBranch = branch;
    this.syncRequestContext();
    this.notify();
  }

  public setAvailableHierarchy(
    companies: TenantCompany[],
    branches: TenantBranch[]
  ): void {
    this.state.availableCompanies = companies;
    this.state.availableBranches = branches;

    // Auto-select defaults if not set
    if (!this.state.activeCompany && companies.length > 0) {
      this.state.activeCompany = companies.find((c) => c.isDefault) ?? companies[0];
    }

    if (!this.state.activeBranch && branches.length > 0) {
      const companyBranches = branches.filter(
        (b) => b.companyId === this.state.activeCompany?.id
      );
      this.state.activeBranch = companyBranches.find((b) => b.isDefault) ?? companyBranches[0] ?? null;
    }

    this.syncRequestContext();
    this.notify();
  }

  public subscribe(listener: TenantChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private syncRequestContext(): void {
    // Synchronize default request context
    RequestContext.setDefaultScope({
      companyId: this.state.activeCompany?.id,
      branchId: this.state.activeBranch?.id,
      facilityId: this.state.activeFacility?.id,
    });

    // Synchronize authorization context
    permissionEvaluator.setContext({
      companyId: this.state.activeCompany?.id,
      branchId: this.state.activeBranch?.id,
    });
  }

  private notify(): void {
    const current = this.getState();
    for (const listener of this.listeners) {
      listener(current);
    }
  }
}

export const tenantContext = new TenantContext();
