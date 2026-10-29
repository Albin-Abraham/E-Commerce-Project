// src/domain/auth/auth.types.ts

/**
 * Authentication User Profile
 */
export interface AuthUser {
  id: string | number;
  email: string;
  /** Alternate login identifier; used as a display-name fallback. */
  username?: string;
  firstName?: string;
  lastName?: string;
  role: string | string[];
  permissions: string[];
  avatarUrl?: string;
  metadata?: Record<string, any>;
  /** Server-side session context IDs from /api/v1/auth/profile/ */
  session?: {
    companyId: string | null;
    businessUnitId: string | null;
    branchId: string | null;
  };
}

/**
 * Login Request Payload
 */
export interface LoginRequest {
  email: string;
  /** Alternate identifier — the auth flow accepts either email or username. */
  username?: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Login Response Payload
 * Backend returns tokens only — user profile is fetched separately via /profile/
 */
export interface LoginResponse {
  access: string;
  refresh: string;
}

/**
 * Registration Request Payload
 */
export interface RegisterRequest extends LoginRequest {
  firstName: string;
  lastName: string;
  confirmPassword: string;
}
