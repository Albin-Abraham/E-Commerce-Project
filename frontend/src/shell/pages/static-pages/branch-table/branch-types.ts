/**
 * Branch Domain & API Types — Official Server DTO Interface
 * Aligned strictly with Backend-RestFul (`core/admin/models/branch.py` & serializers)
 */

export interface BranchCompany {
  id: string;
  name?: string;
  code?: string;
  label?: string;
  display?: string;
  type?: string;
}

export interface BranchBusinessUnit {
  id: string;
  name?: string;
  code?: string;
  label?: string;
  display?: string;
  type?: string;
}

export interface BranchCatalog {
  id: string;
  name?: string;
  tier?: string;
  label?: string;
  display?: string;
  module_keys?: string[];
}

export interface BranchExtensions {
  extra_attributes?: {
    manager?: string;
    email?: string;
    phone?: string;
    capacity?: number;
    city?: string;
    state?: string;
    country?: string;
    [key: string]: unknown;
  };
}

export type BranchStatus = "active" | "inactive" | "maintenance";

export interface Branch {
  id: string;
  code: string;
  name: string;
  location: string;
  opened_date: string;
  company: BranchCompany | string;
  business_unit: BranchBusinessUnit | string;
  catalog?: BranchCatalog | string | null;
  is_all_branch?: boolean;
  status?: BranchStatus;
  manager?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  capacity?: number;
  extensions?: BranchExtensions | null;
}

export interface BranchQueryParams {
  page: number;
  page_size: number;
  search?: string;
  sort?: { key: string; dir: "asc" | "desc" }[];
  filters?: Record<string, unknown>;
}

export interface BranchApiResponse {
  status: number;
  message: string;
  count: number;
  total_pages: number;
  current_page: number;
  range?: string;
  next_url?: string | null;
  prev_url?: string | null;
  has_next?: boolean;
  has_prev?: boolean;
  data: Branch[];
}
