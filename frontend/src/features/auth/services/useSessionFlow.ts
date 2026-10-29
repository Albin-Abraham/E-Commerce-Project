import { useEffect } from "react";

import {
  useBranchesQuery,
  useBusinessUnitsQuery,
  useCompaniesQuery,
} from "@services/org/org.hooks";

import type {
  Branch,
  BusinessUnit,
  Company,
} from "@features/auth/services/session.types";
import { type AuthState, useAuthStore } from "@features/auth/store/auth.store";

import { authManager } from "./auth-manager";

/**
 * useSessionFlow
 *
 * Orchestrates the hierarchical session context flow.
 * Supports auto-skip when a user has a single company and single business unit.
 * Branch is optional — stability is achieved with company + BU (2-tier).
 */
export function useSessionFlow() {
  const context = useAuthStore((s: AuthState) => s.sessionContext);
  const isAuthenticated = useAuthStore((s: AuthState) => s.isAuthenticated);

  const { data: companies, isLoading: loadingCompanies } = useCompaniesQuery();

  const { data: businessUnits, isLoading: loadingBUs } = useBusinessUnitsQuery(
    context.company?.id ?? null
  );

  const { data: branches, isLoading: loadingBranches } = useBranchesQuery(
    context.businessUnit?.id ?? null
  );

  // 2-tier stability: company + BU required, branch is optional
  const isStable = !!context.company && !!context.businessUnit;

  const isLoading = loadingCompanies || loadingBUs || loadingBranches;

  // ── Auto-skip: single company → select it automatically ──
  useEffect(() => {
    if (!context.company && companies?.length === 1) {
      authManager.selectCompany(companies[0]);
    }
  }, [companies, context.company]);

  // ── Auto-skip: single BU for selected company → select it automatically ──
  useEffect(() => {
    if (
      context.company &&
      !context.businessUnit &&
      businessUnits?.length === 1
    ) {
      authManager.selectBusinessUnit(businessUnits[0]);
    }
  }, [context.company, context.businessUnit, businessUnits]);

  // ── Resolve pre-seeded company ID to full object ──
  useEffect(() => {
    if (context.company && !context.company.name && companies?.length) {
      const resolved = companies.find((c) => c.id === context.company!.id);
      if (resolved) {
        useAuthStore.setState({
          sessionContext: {
            ...useAuthStore.getState().sessionContext,
            company: resolved,
          },
        });
      }
    }
  }, [companies, context.company]);

  return {
    // State
    company: context.company,
    businessUnit: context.businessUnit,
    branch: context.branch,
    isStable,
    isAuthenticated,

    // Data
    companies: companies || [],
    businessUnits: businessUnits || [],
    branches: branches || [],

    isLoading,

    // Actions
    selectCompany: (id: string) => {
      const company = (companies as Company[])?.find((c) => c.id === id);
      if (company) authManager.selectCompany(company);
    },

    selectBusinessUnit: (id: string) => {
      const bu = (businessUnits as BusinessUnit[])?.find((b) => b.id === id);
      if (bu) authManager.selectBusinessUnit(bu);
    },

    selectBranch: (id: string) => {
      const branch = (branches as Branch[])?.find((b) => b.id === id);
      if (branch) authManager.selectBranch(branch);
    },

    reset: () => authManager.resetContext(),
  };
}
