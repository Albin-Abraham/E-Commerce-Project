/**
 * API Endpoints Configuration
 *
 * Centralized registry of all backend API routes.
 */
export const ApiEndpoints = {
  Auth: {
    Login: "/api/v1/auth/login/",
    Register: "/api/v1/auth/register/",
    Logout: "/api/v1/auth/logout/",
    Me: "/api/v1/auth/profile/",
    Refresh: "/api/v1/auth/token-refresh/",
  },
  Session: {
    SetCompany: "/api/v1/sessions/set-company/",
    SetBU: "/api/v1/sessions/set-bu/",
    SetBranch: "/api/v1/sessions/set-branch/",
    SetCompanyBU: "/api/v1/sessions/set-company-bu/",
    SetBUBranch: "/api/v1/sessions/set-bu-branch/",
    Clear: "/api/v1/sessions/clear/",
    UserCompanies: "/api/v1/sessions/user/companies/",
    UserBusinessUnits: "/api/v1/sessions/user/business-units/",
    UserBranches: "/api/v1/sessions/user/branches/",
  },
  Products: {
    Base: "https://dummyjson.com/products",
    Details: (id: string | number) => `https://dummyjson.com/products/${id}`,
  },
  Organization: {
    Base: "/org",
    Units: "/org/units",
  },
};
