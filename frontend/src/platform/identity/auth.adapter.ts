/**
 * Platform Identity: Django Auth Adapter
 *
 * Implements backend authentication contracts with Django REST Framework.
 */

import { apiClient } from "../networking/api-client";
import { runtimeConfig } from "../configuration/runtime-config";
import type { UserProfile, UserSession } from "./user-session.model";

export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
}

export interface AuthTokensDto {
  access?: string;
  refresh?: string;
  user?: Partial<UserProfile>;
}

export class AuthAdapter {
  private currentSession: UserSession = {
    user: null,
    isAuthenticated: false,
  };

  public getSession(): UserSession {
    return this.currentSession;
  }

  public setSession(session: UserSession): void {
    this.currentSession = session;
  }

  /**
   * Authenticate with username/password
   */
  public async login(credentials: LoginCredentials): Promise<UserSession> {
    try {
      const response = await apiClient.post<AuthTokensDto>(
        "/auth/login/",
        credentials,
        { isPublicStorefront: true }
      );

      const profile = await this.fetchProfile();
      this.currentSession = {
        user: profile,
        isAuthenticated: true,
        accessToken: response.access,
      };
      return this.currentSession;
    } catch (err) {
      if (runtimeConfig.isDevelopment() || runtimeConfig.isTest()) {
        // Provide seeded mock admin for offline local DX
        const mockUser: UserProfile = {
          id: "usr-admin-root",
          email: "admin@zenos.local",
          username: "admin",
          fullName: "System Administrator",
          isStaff: true,
          isSuperuser: true,
          roles: ["admin", "store_manager"],
          permissions: [
            "shop:products:view",
            "shop:products:manage",
            "shop:orders:view",
            "shop:orders:approve",
            "inventory:stock:view",
            "inventory:stock:adjust",
            "customers:profile:view",
            "customers:profile:manage",
          ],
          memberships: [
            {
              companyId: "comp-zenos-main",
              companyName: "Zenith Retail Corp",
              isDefault: true,
              branches: [
                {
                  branchId: "br-tokyo-flagship",
                  branchName: "Tokyo Flagship Store",
                  isDefault: true,
                },
                {
                  branchId: "br-osaka-hub",
                  branchName: "Osaka Central Hub",
                },
              ],
            },
          ],
        };

        this.currentSession = {
          user: mockUser,
          isAuthenticated: true,
          accessToken: "mock-jwt-token-dev",
        };
        return this.currentSession;
      }
      throw err;
    }
  }

  /**
   * Fetch current authenticated profile
   */
  public async fetchProfile(): Promise<UserProfile> {
    const raw = await apiClient.get<Record<string, unknown>>("/auth/profile/");

    return {
      id: String(raw.id ?? "usr-unknown"),
      email: String(raw.email ?? ""),
      username: String(raw.username ?? ""),
      fullName: String(raw.full_name ?? raw.username ?? "Anonymous User"),
      phone: typeof raw.phone === "string" ? raw.phone : undefined,
      avatarUrl: typeof raw.avatar_url === "string" ? raw.avatar_url : undefined,
      isStaff: Boolean(raw.is_staff),
      isSuperuser: Boolean(raw.is_superuser),
      roles: Array.isArray(raw.roles) ? (raw.roles as string[]) : [],
      permissions: Array.isArray(raw.permissions) ? (raw.permissions as string[]) : [],
      memberships: Array.isArray(raw.memberships)
        ? (raw.memberships as UserProfile["memberships"])
        : [],
    };
  }

  /**
   * Refresh active access token
   */
  public async refreshToken(refreshToken?: string): Promise<string | null> {
    try {
      const response = await apiClient.post<{ access: string }>("/auth/token-refresh/", {
        refresh: refreshToken,
      });
      if (this.currentSession.user) {
        this.currentSession = {
          ...this.currentSession,
          accessToken: response.access,
        };
      }
      return response.access;
    } catch {
      return null;
    }
  }

  /**
   * Revoke session
   */
  public async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout/");
    } catch {
      // Best-effort logout
    } finally {
      this.currentSession = {
        user: null,
        isAuthenticated: false,
      };
    }
  }
}

export const authAdapter = new AuthAdapter();
