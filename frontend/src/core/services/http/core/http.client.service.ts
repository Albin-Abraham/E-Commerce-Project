// services/http/core/http.client.service.ts
import { HttpError, ResponseFactory, isHttpError } from "@core/http";
import { FileUploadHelper } from "@core/http";
import type {
  HttpClient,
  HttpRequestConfig,
  HttpResponse,
  Result,
} from "@core/http";

export type HttpMiddleware = (
  config: HttpRequestConfig,
  next: (config: HttpRequestConfig) => Promise<HttpResponse<any>>
) => Promise<HttpResponse<any>>;

/**
 * Base HTTP Client Service (Elite 2026 Version)
 *
 * A high-performance transport orchestrator that leverages a middleware
 * pipeline for cross-cutting concerns.
 */
export class BaseHTTPClientService implements HttpClient {
  private middleware: HttpMiddleware[] = [];

  constructor(private readonly client: HttpClient) {}

  /**
   * Attach middleware to the request/response pipeline
   */
  use(fn: HttpMiddleware): this {
    this.middleware.push(fn);
    return this;
  }

  /**
   * Main Execution Path with Middleware Support
   */
  async request<T>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    const chain = [...this.middleware, this.coreRequest.bind(this)];

    let index = 0;
    const next = async (cfg: HttpRequestConfig): Promise<HttpResponse<any>> => {
      const middleware = chain[index++];
      return middleware(cfg, next);
    };

    return next(config) as Promise<HttpResponse<T>>;
  }

  /**
   * Internal Core Request (The final step in the chain)
   */
  private async coreRequest<T>(
    config: HttpRequestConfig
  ): Promise<HttpResponse<T>> {
    const effectiveConfig = this.prepareRequest(config);

    // We MUST omit the custom ZenOS transform properties before passing to the underlying HTTP client (like Axios)
    // Otherwise, Axios overrides its default JSON.stringify/JSON.parse with these objects and completely corrupts the payload!
    const { transformRequest, transformResponse, ...axiosConfig } =
      effectiveConfig;

    const response = await this.client.request<T>(axiosConfig);
    return this.processResponse<T>(response, config);
  }

  /**
   * Safe Request Execution (Result Pattern)
   */
  async requestSafe<T>(
    config: HttpRequestConfig
  ): Promise<Result<HttpResponse<T>, HttpError>> {
    try {
      const response = await this.request<T>(config);
      if (response && typeof response.status === "number" && response.status >= 400) {
        const error = new HttpError(
          response.statusText || "Request failed",
          response.status,
          response.statusText,
          response.data,
          config,
          false
        );
        return { success: false, error: this.normalizeError(error, config) };
      }
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: this.normalizeError(error, config) };
    }
  }

  // --- Convenience Methods ---
  get<T>(url: string, config?: Partial<HttpRequestConfig>) {
    return this.request<T>({ url, method: "GET", ...config });
  }

  post<T>(url: string, data?: unknown, config?: Partial<HttpRequestConfig>) {
    return this.request<T>({ url, method: "POST", data, ...config });
  }

  put<T>(url: string, data?: unknown, config?: Partial<HttpRequestConfig>) {
    return this.request<T>({ url, method: "PUT", data, ...config });
  }

  patch<T>(url: string, data?: unknown, config?: Partial<HttpRequestConfig>) {
    return this.request<T>({ url, method: "PATCH", data, ...config });
  }

  delete<T>(url: string, config?: Partial<HttpRequestConfig>) {
    return this.request<T>({ url, method: "DELETE", ...config });
  }

  uploadFile<T = any>(
    url: string,
    fileConfig: import("@core/http").FileUploadConfig
  ) {
    const config = FileUploadHelper.createUploadConfig(url, fileConfig);
    return this.request<T>(config);
  }

  private prepareRequest(config: HttpRequestConfig): HttpRequestConfig {
    if (!config.data || !config.transformRequest) return config;
    return {
      ...config,
      data: ResponseFactory.Wrap(config.data, {
        casing: config.transformRequest.casing,
      }),
    };
  }

  private processResponse<T>(
    response: HttpResponse<any>,
    config: HttpRequestConfig
  ): HttpResponse<T> {
    if (!config.transformResponse) return response;
    return {
      ...response,
      data: ResponseFactory.UnWrap<any, T>(response, {
        casing: config.transformResponse.casing || "camel",
        autoEnvelope: config.transformResponse.autoEnvelope ?? false,
      }),
    };
  }

  private normalizeError(error: unknown, config: HttpRequestConfig): HttpError {
    if (isHttpError(error)) return error;
    return new HttpError(
      error instanceof Error ? error.message : "Transport Failure",
      0,
      "TRANSPORT_ERROR",
      error,
      config,
      true
    );
  }
}
