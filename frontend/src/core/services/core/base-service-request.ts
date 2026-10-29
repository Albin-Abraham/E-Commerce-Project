import type { HttpError, HttpRequestConfig, HttpResponse, Result } from "@core/http";
import { httpClient } from "../http.instance";
import type { BaseHTTPClientService } from "../http/core/http.client.service";

/**
 * BaseServiceRequest
 *
 * Core service abstraction for safe HTTP requests returning Result<HttpResponse<T>, HttpError>.
 * Eliminates raw try/catch blocks in feature code and standardizes error handling.
 */
export class BaseServiceRequest {
  constructor(protected readonly http: BaseHTTPClientService = httpClient.public) {}

  /**
   * Execute safe request on instance
   */
  async safeRequest<T>(
    config: HttpRequestConfig
  ): Promise<Result<HttpResponse<T>, HttpError>> {
    return this.http.requestSafe<T>(config);
  }

  /**
   * Static helper for safe request execution
   */
  static async safeRequest<T>(
    config: HttpRequestConfig,
    client: BaseHTTPClientService = httpClient.public
  ): Promise<Result<HttpResponse<T>, HttpError>> {
    return client.requestSafe<T>(config);
  }
}
