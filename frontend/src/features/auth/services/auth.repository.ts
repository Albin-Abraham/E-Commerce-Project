import { ApiErrorParser, HttpError, ResponseFactory } from "@core/http";

import { ApiEndpoints } from "@configs/api";

import type { BaseHTTPClientService } from "@services/http/core/http.client.service";

import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from "./auth.types";

/**
 * Auth Repository
 *
 * Encapsulates all identity-related data operations.
 * Uses requestSafe() + ResponseFactory.unwrap() for structured error handling.
 */
export class AuthRepository {
  constructor(
    private publicHttp: BaseHTTPClientService,
    private authHttp: BaseHTTPClientService
  ) {}

  /**
   * Performs login and returns credentials
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const result = await this.publicHttp.requestSafe<LoginResponse>({
      url: ApiEndpoints.Auth.Login,
      method: "POST",
      data: credentials,
      transformRequest: { casing: "snake" },
      transformResponse: { casing: "camel", autoEnvelope: true },
    });

    if (!result.success) throw ApiErrorParser.from(result.error);
    const data = ResponseFactory.unwrap(result.data);

    // Defense-in-depth: detect error payload if server envelope was returned
    if (
      data &&
      typeof data === "object" &&
      (("status" in data && typeof (data as any).status === "number" && (data as any).status >= 400) ||
       ("status_code" in data && typeof (data as any).status_code === "number" && (data as any).status_code >= 400) ||
       ("error" in data && (data as any).error))
    ) {
      const statusCode = (data as any).status || (data as any).status_code || 400;
      const message = (data as any).message || (data as any).error?.message || "Validation failed";
      throw ApiErrorParser.from(new HttpError(message, statusCode, "", data));
    }

    return data;
  }

  /**
   * Registers a new user
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const result = await this.publicHttp.requestSafe<LoginResponse>({
      url: ApiEndpoints.Auth.Register,
      method: "POST",
      data,
      transformRequest: { casing: "snake" },
      transformResponse: { casing: "camel", autoEnvelope: true },
    });

    if (!result.success) throw ApiErrorParser.from(result.error);
    const resData = ResponseFactory.unwrap(result.data);

    // Defense-in-depth: detect error payload if server envelope was returned
    if (
      resData &&
      typeof resData === "object" &&
      (("status" in resData && typeof (resData as any).status === "number" && (resData as any).status >= 400) ||
       ("status_code" in resData && typeof (resData as any).status_code === "number" && (resData as any).status_code >= 400) ||
       ("error" in resData && (resData as any).error))
    ) {
      const statusCode = (resData as any).status || (resData as any).status_code || 400;
      const message = (resData as any).message || (resData as any).error?.message || "Validation failed";
      throw ApiErrorParser.from(new HttpError(message, statusCode, "", resData));
    }

    return resData;
  }

  /**
   * Registers a B2B partner / vendor
   */
  async registerVendor(data: Record<string, any>): Promise<any> {
    const result = await this.publicHttp.requestSafe<any>({
      url: ApiEndpoints.Auth.VendorRegister,
      method: "POST",
      data,
      transformRequest: { casing: "snake" },
      transformResponse: { casing: "camel", autoEnvelope: true },
    });

    if (!result.success) throw ApiErrorParser.from(result.error);
    const resData = ResponseFactory.unwrap(result.data);

    if (
      resData &&
      typeof resData === "object" &&
      (("status" in resData && typeof (resData as any).status === "number" && (resData as any).status >= 400) ||
       ("status_code" in resData && typeof (resData as any).status_code === "number" && (resData as any).status_code >= 400) ||
       ("error" in resData && (resData as any).error))
    ) {
      const statusCode = (resData as any).status || (resData as any).status_code || 400;
      const message = (resData as any).message || (resData as any).error?.message || "Validation failed";
      throw ApiErrorParser.from(new HttpError(message, statusCode, "", resData));
    }

    return resData;
  }

  /**
   * Requests a password reset link for the provided email address
   */
  async forgotPassword(email: string): Promise<{ message?: string }> {
    const result = await this.publicHttp.requestSafe<{ message?: string }>({
      url: ApiEndpoints.Auth.ForgotPassword,
      method: "POST",
      data: { email },
      transformResponse: { casing: "camel", autoEnvelope: true },
    });

    if (!result.success) throw ApiErrorParser.from(result.error);
    return ResponseFactory.unwrap(result.data);
  }

  /**
   * Exchanges a refresh token for a new access token
   */
  async refresh(
    refreshToken: string
  ): Promise<{ access: string; refresh?: string }> {
    const result = await this.publicHttp.requestSafe<{
      access: string;
      refresh?: string;
    }>({
      url: ApiEndpoints.Auth.Refresh,
      method: "POST",
      data: { refresh: refreshToken },
    });

    if (!result.success) throw ApiErrorParser.from(result.error);
    return ResponseFactory.unwrap(result.data);
  }

  /**
   * Performs logout on the server
   */
  async logout(): Promise<void> {
    const result = await this.publicHttp.requestSafe({
      url: ApiEndpoints.Auth.Logout,
      method: "POST",
    });

    if (!result.success) throw ApiErrorParser.from(result.error);
  }

  /**
   * Fetches the current user profile including session context IDs.
   * Uses authHttp so the interceptor injects the Bearer token (set by
   * storeTokenOnly() before this call in the login/register flow).
   */
  async getCurrentUser(): Promise<AuthUser> {
    const result = await this.authHttp.requestSafe<AuthUser>({
      url: ApiEndpoints.Auth.Me,
      method: "GET",
      transformResponse: { casing: "camel", autoEnvelope: true },
    });

    if (!result.success) throw ApiErrorParser.from(result.error);
    return ResponseFactory.unwrap(result.data);
  }
}
