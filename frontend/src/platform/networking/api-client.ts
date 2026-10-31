/**
 * Platform Networking: Resilient Typed API Client
 *
 * Implements standard DRF integration, error normalization, request context
 * scoping, request cancellation, and safe retry execution.
 */

import { ApiError } from "./api-error";
import { RequestContext, type RequestScope } from "./request-context";
import { RetryPolicy, type RetryOptions } from "./retry-policy";

export interface RequestConfig extends RequestInit {
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  scope?: RequestScope;
  isPublicStorefront?: boolean;
  timeoutMs?: number;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly retryPolicy: RetryPolicy;
  private readonly defaultTimeoutMs: number;

  constructor(options: {
    baseUrl?: string;
    retryOptions?: RetryOptions;
    defaultTimeoutMs?: number;
  } = {}) {
    this.baseUrl = (options.baseUrl ?? "/api/v1").replace(/\/$/, "");
    this.retryPolicy = new RetryPolicy(options.retryOptions);
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 15000;
  }

  /**
   * Resolves complete URL with serialized query parameters
   */
  public resolveUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined | null>
  ): string {
    const isAbsolute = path.startsWith("http://") || path.startsWith("https://");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const base = isAbsolute ? path : `${this.baseUrl}${normalizedPath}`;

    if (!query) return base;

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }

    const queryString = searchParams.toString();
    if (!queryString) return base;

    return base.includes("?") ? `${base}&${queryString}` : `${base}?${queryString}`;
  }

  /**
   * Core request execution pipeline
   */
  public async request<T>(config: RequestConfig): Promise<T> {
    const method = (config.method ?? "GET").toUpperCase();
    const url = this.resolveUrl(config.path, config.query);

    const executeFetch = async (): Promise<T> => {
      const headers = RequestContext.buildHeaders({
        headers: config.headers,
        scope: config.scope,
        isPublicStorefront: config.isPublicStorefront,
      });

      if (config.body && !headers.has("Content-Type") && typeof config.body === "string") {
        headers.set("Content-Type", "application/json");
      }

      const controller = new AbortController();
      const timeoutMs = config.timeoutMs ?? this.defaultTimeoutMs;
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      // Merge user-supplied signal if provided
      const signal = config.signal
        ? anySignal([config.signal, controller.signal])
        : controller.signal;

      try {
        const response = await fetch(url, {
          ...config,
          method,
          headers,
          signal,
          credentials: config.credentials ?? "same-origin",
        });

        clearTimeout(timer);

        if (!response.ok) {
          throw await ApiError.fromResponse(response);
        }

        if (response.status === 204) {
          return undefined as unknown as T;
        }

        const data = await response.json();
        return data as T;
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof ApiError) {
          throw err;
        }
        throw ApiError.fromNetworkException(err);
      }
    };

    if (this.retryPolicy.isRetryable(method, null)) {
      return this.retryPolicy.execute(() => executeFetch(), method);
    }

    return executeFetch();
  }

  public get<T>(
    path: string,
    query?: Record<string, string | number | boolean | undefined | null>,
    config?: Omit<RequestConfig, "path" | "query" | "method">
  ): Promise<T> {
    return this.request<T>({ ...config, path, query, method: "GET" });
  }

  public post<T>(
    path: string,
    body?: unknown,
    config?: Omit<RequestConfig, "path" | "body" | "method">
  ): Promise<T> {
    return this.request<T>({
      ...config,
      path,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(
    path: string,
    body?: unknown,
    config?: Omit<RequestConfig, "path" | "body" | "method">
  ): Promise<T> {
    return this.request<T>({
      ...config,
      path,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(
    path: string,
    body?: unknown,
    config?: Omit<RequestConfig, "path" | "body" | "method">
  ): Promise<T> {
    return this.request<T>({
      ...config,
      path,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(
    path: string,
    config?: Omit<RequestConfig, "path" | "method">
  ): Promise<T> {
    return this.request<T>({ ...config, path, method: "DELETE" });
  }
}

/**
 * Polyfill-friendly composite AbortSignal helper
 */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      return signal;
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return controller.signal;
}

export const apiClient = new ApiClient();
