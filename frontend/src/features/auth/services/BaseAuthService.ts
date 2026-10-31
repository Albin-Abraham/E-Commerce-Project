import { ApiErrorParser, HttpError } from "@core/http";
import { jwtDecode } from "jwt-decode";

import type { BaseHTTPClientService } from "@services/http/core/http.client.service";

import type { IAuthClass } from "../interfaces/IAuthClass";
import { useAuthStore } from "../store/auth.store";
import { AuthRepository } from "./auth.repository";
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from "./auth.types";

/**
 * BaseAuthService
 *
 * Implements the core authentication domain logic (The Bridge).
 * Connects the repository (HTTP layer) with the application state (Zustand store).
 */
export class BaseAuthService implements IAuthClass {
  private repository: AuthRepository;

  constructor(
    publicHttp: BaseHTTPClientService,
    authHttp: BaseHTTPClientService
  ) {
    this.repository = new AuthRepository(publicHttp, authHttp);
  }

  public isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated;
  }

  public getUser(): AuthUser | null {
    return useAuthStore.getState().user;
  }

  public getAccessToken(): string | null {
    return useAuthStore.getState().accessToken;
  }

  /**
   * Performs the login domain flow
   */
  public async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const data = await this.repository.login(credentials);
      if (!data?.access) {
        const errorMsg =
          (data as any)?.message ||
          (data as any)?.detail?.nonFieldErrors?.[0] ||
          (data as any)?.detail?.non_field_errors?.[0] ||
          "Authentication failed. Please check your credentials.";
        throw new HttpError(errorMsg, (data as any)?.status || 401, "", data);
      }
      // Temporarily store the token so getCurrentUser() can authenticate
      this.storeTokenOnly(data.access);
      // Fetch user profile — only then mark as authenticated
      const user = await this.getCurrentUser();
      const tokenExpiry = this.decodeExpiry(data.access);
      useAuthStore
        .getState()
        .setAuth(user, data.access, tokenExpiry, data.refresh);

      // Seed session context from server-side profile if available
      this.seedSessionContext(user);

      return data;
    } catch (err) {
      // Rollback partial state if profile fetch failed after token was stored
      this.clearTokens();
      throw ApiErrorParser.from(err);
    }
  }

  /**
   * Exchanges the stored refresh token for a new access token.
   * Updates the store with the new access token and its expiry.
   * Throws if no refresh token is available or the refresh request fails.
   */
  public async refreshAccessToken(): Promise<string> {
    try {
      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken)
        throw new Error("[AuthService] No refresh token available.");

      const { access, refresh: newRefreshToken } =
        await this.repository.refresh(refreshToken);
      const tokenExpiry = this.decodeExpiry(access);

      useAuthStore.setState((s) => ({
        ...s,
        accessToken: access,
        tokenExpiry,
        ...(newRefreshToken ? { refreshToken: newRefreshToken } : {}),
      }));
      return access;
    } catch (err) {
      throw ApiErrorParser.from(err);
    }
  }

  /**
   * Performs the logout domain flow
   */
  public async logout(): Promise<void> {
    try {
      await this.repository.logout();
    } catch (err) {
      // Always clear local tokens even if server logout fails
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Performs the forgot password request flow
   */
  public async forgotPassword(email: string): Promise<{ message?: string }> {
    try {
      return await this.repository.forgotPassword(email);
    } catch (err) {
      throw ApiErrorParser.from(err);
    }
  }

  public async register(credentials: RegisterRequest): Promise<LoginResponse> {
    try {
      const data = await this.repository.register(credentials);
      // If backend returned access token directly
      if (data?.access) {
        this.storeTokenOnly(data.access);
        const user = await this.getCurrentUser();
        const tokenExpiry = this.decodeExpiry(data.access);
        useAuthStore
          .getState()
          .setAuth(user, data.access, tokenExpiry, data.refresh);

        this.seedSessionContext(user);
        return data;
      }

      // Backend registered user successfully (201 Created) without issuing JWT tokens.
      // Automatically log in with credentials to establish session seamlessly.
      // The auth endpoint takes a single `email` identifier that may be either an
      // email address or a username, so resolve whichever the form supplied.
      const identifier = credentials.email || credentials.username;
      if (!identifier) {
        this.clearTokens();
        throw new Error("Cannot establish session: no email or username");
      }
      const loginPayload: LoginRequest = {
        email: identifier,
        password: credentials.password,
      };
      return await this.login(loginPayload);
    } catch (err) {
      // Rollback partial state if profile fetch failed after token was stored
      this.clearTokens();
      throw ApiErrorParser.from(err);
    }
  }

  public async getCurrentUser(): Promise<AuthUser> {
    try {
      const user = await this.repository.getCurrentUser();
      useAuthStore.getState().updateUser(user);
      return user;
    } catch (err) {
      throw ApiErrorParser.from(err);
    }
  }

  public saveTokens(tokens: LoginResponse): void {
    const accessToken = tokens.access;
    if (accessToken) {
      // Store the token first so subsequent requests (e.g. /profile/) are authenticated
      useAuthStore.getState().setAuth(null, accessToken);
    } else {
      console.error(
        "[AuthService] saveTokens: missing access token in response payload.",
        tokens
      );
    }
  }

  /** Stores token in-memory for profile fetch without marking the session as authenticated */
  private storeTokenOnly(accessToken: string): void {
    if (accessToken) {
      const tokenExpiry = this.decodeExpiry(accessToken);
      useAuthStore.getState().setTokenOnly(accessToken, tokenExpiry);
    }
  }

  /** Decodes the JWT exp claim and returns it as a Unix timestamp (seconds), or null on failure */
  private decodeExpiry(token: string | undefined): number | null {
    if (!token) return null;
    try {
      const { exp } = jwtDecode<{ exp: number }>(token);
      return exp ?? null;
    } catch {
      return null;
    }
  }

  public clearTokens(): void {
    useAuthStore.getState().clearAuth();
  }

  /**
   * Seeds the session context with IDs from the server profile.
   * Full objects (name, code) are resolved later by useSessionFlow's org queries.
   */
  private seedSessionContext(user: AuthUser): void {
    const session = user?.session;
    if (!session?.companyId) return;

    const current = useAuthStore.getState().sessionContext;

    // Only seed if session is not already populated
    if (current.company) return;

    useAuthStore.setState({
      sessionContext: {
        company: { id: session.companyId, name: "", code: "" },
        businessUnit: session.businessUnitId
          ? {
              id: session.businessUnitId,
              name: "",
              code: "",
              companyId: session.companyId,
            }
          : null,
        branch: session.branchId
          ? {
              id: session.branchId,
              name: "",
              code: "",
              businessUnitId: session.businessUnitId ?? "",
            }
          : null,
        isStable: false,
      },
    });
  }
}
