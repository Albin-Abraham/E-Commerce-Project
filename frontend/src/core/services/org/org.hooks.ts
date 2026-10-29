import { useQuery } from "@tanstack/react-query";

import { httpClient } from "@services/http.instance";

import { createOrgRepo } from "./org.repository";

const orgRepo = createOrgRepo(httpClient.auth);

/**
 * useCompaniesQuery
 *
 * Fetches all companies the current user has access to.
 */
export function useCompaniesQuery() {
  return useQuery({
    queryKey: ["org", "companies"],
    queryFn: () => orgRepo.getCompanies(),
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * useBusinessUnitsQuery
 *
 * Fetches business units for a selected company.
 */
export function useBusinessUnitsQuery(companyId: string | null) {
  return useQuery({
    queryKey: ["org", "business-units", companyId],
    queryFn: () => orgRepo.getBusinessUnits(companyId!),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * useBranchesQuery
 *
 * Fetches branches for a selected business unit.
 */
export function useBranchesQuery(businessUnitId: string | null) {
  return useQuery({
    queryKey: ["org", "branches", businessUnitId],
    queryFn: () => orgRepo.getBranches(businessUnitId!),
    enabled: !!businessUnitId,
    staleTime: 1000 * 60 * 60,
  });
}
