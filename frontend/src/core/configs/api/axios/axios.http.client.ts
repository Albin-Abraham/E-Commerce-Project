// infrastructure/http/axios.http.client.ts
import { ContentTypeUtils, HttpError } from "@core/http";
import type {
  HttpClient,
  HttpRequestConfig,
  HttpResponse,
  ProgressEvent,
} from "@core/http";
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";

/**
 * Axios HTTP Client Adapter
 *
 * Adapts Axios to the framework-agnostic HttpClient interface defined in
 * the domain layer. This is the **Infrastructure Layer** implementation
 * that handles all Axios-specific details.
 *
 * ## Architecture
 *
 * This is the **Infrastructure Layer** in Clean Architecture:
 * - Implements domain interfaces (HttpClient)
 * - Contains framework-specific code (Axios)
 * - Transforms framework errors to domain errors (HttpError)
 * - Handles framework-specific configuration
 *
 * ## Features
 *
 * - Automatic error transformation to HttpError
 * - Content-Type detection and handling
 * - Progress tracking for uploads/downloads
 * - Request cancellation support via AbortSignal
 * - Comprehensive response metadata
 *
 * ## Usage
 *
 * ```typescript
 * import { AxiosAuthInstance } from "@configs/api/axios";
 * import { AxiosHttpClient } from "@configs/api/axios/axios.http.client";
 *
 * const httpClient = new AxiosHttpClient(AxiosAuthInstance);
 * const response = await httpClient.request({
 *   url: "/api/users",
 *   method: "GET"
 * });
 * ```
 *
 * @see {@link HttpClient} for the domain interface
 */

/**
 * Axios HTTP Client Adapter
 *
 * Adapts Axios to the framework-agnostic HttpClient interface.
 *
 * Features:
 * - Automatic error transformation to HttpError
 * - Content-Type detection and handling
 * - Progress tracking for uploads/downloads
 * - Request cancellation support
 * - Comprehensive response metadata
 */
export class AxiosHttpClient implements HttpClient {
  constructor(private readonly instance: AxiosInstance) {}

  /**
   * Make an HTTP request
   */
  async request<T>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    try {
      const axiosConfig = this.transformRequest(config);
      const response = await this.instance.request<T>(axiosConfig);
      if (response && typeof response.status === "number" && response.status >= 400) {
        const message =
          this.extractErrorMessage(response.data) ||
          response.statusText ||
          "Request failed";
        throw new HttpError(
          message,
          response.status,
          response.statusText,
          response.data,
          config,
          false
        );
      }
      return this.transformResponse<T>(response, config);
    } catch (error) {
      throw this.transformError(error, config);
    }
  }

  /**
   * Transform HttpRequestConfig to AxiosRequestConfig
   */
  private transformRequest(config: HttpRequestConfig): AxiosRequestConfig {
    const axiosConfig: AxiosRequestConfig = {
      url: config.url,
      method: config.method,
      data: this.transformRequestData(config.data, config.contentType),
      headers: this.buildHeaders(config),
      params: config.params,
      timeout: config.timeout,
      signal: config.signal,
      responseType: config.responseType || "json",
      ...(config.withCredentials !== undefined && {
        withCredentials: config.withCredentials,
      }),
      validateStatus: config.validateStatus,
      maxBodyLength: config.maxBodyLength,
      maxContentLength: config.maxContentLength,
    };

    // Add progress handlers
    if (config.onUploadProgress) {
      axiosConfig.onUploadProgress = (progressEvent) => {
        const progress = this.calculateProgress(progressEvent);
        config.onUploadProgress!(progress);
      };
    }

    if (config.onDownloadProgress) {
      axiosConfig.onDownloadProgress = (progressEvent) => {
        const progress = this.calculateProgress(progressEvent);
        config.onDownloadProgress!(progress);
      };
    }

    return axiosConfig;
  }

  /**
   * Transform request data based on content type
   */
  private transformRequestData(data: unknown, contentType?: string): unknown {
    if (!data) return data;

    // FormData - don't transform
    if (data instanceof FormData) {
      return data;
    }

    // URLSearchParams - don't transform
    if (data instanceof URLSearchParams) {
      return data;
    }

    // Blob/File - don't transform
    if (data instanceof Blob || data instanceof File) {
      return data;
    }

    // JSON - stringify if needed
    if (!contentType || ContentTypeUtils.isJSON(contentType)) {
      return data; // Axios will handle JSON stringification
    }

    return data;
  }

  /**
   * Build request headers with content-type detection
   */
  private buildHeaders(config: HttpRequestConfig): Record<string, string> {
    const headers: Record<string, string> = { ...config.headers };

    // Auto-detect Content-Type if not provided and data exists
    if (config.data && !headers["Content-Type"] && !config.contentType) {
      const detectedType = ContentTypeUtils.detect(config.data);

      // Don't set Content-Type for FormData (browser will set with boundary)
      if (detectedType !== "multipart/form-data") {
        headers["Content-Type"] = detectedType;
      }
    } else if (
      config.contentType &&
      config.contentType !== "multipart/form-data"
    ) {
      // Set explicit Content-Type (except FormData)
      headers["Content-Type"] = config.contentType;
    }

    return headers;
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(progressEvent: any): ProgressEvent {
    const total = progressEvent.total || 0;
    const loaded = progressEvent.loaded || 0;
    const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;

    return {
      loaded,
      total,
      percentage,
    };
  }

  /**
   * Transform Axios response to HttpResponse
   */
  private transformResponse<T>(
    axiosResponse: any,
    config: HttpRequestConfig
  ): HttpResponse<T> {
    return {
      data: axiosResponse.data,
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: this.normalizeHeaders(axiosResponse.headers),
      config,
    };
  }

  /**
   * Normalize response headers to Record<string, string>
   */
  private normalizeHeaders(headers: any): Record<string, string> {
    const normalized: Record<string, string> = {};

    if (!headers) return normalized;

    // Axios headers can be an object or AxiosHeaders instance
    if (typeof headers === "object") {
      Object.keys(headers).forEach((key) => {
        const value = headers[key];
        if (value !== undefined && value !== null) {
          normalized[key.toLowerCase()] = String(value);
        }
      });
    }

    return normalized;
  }

  /**
   * Transform Axios error to HttpError
   */
  private transformError(error: unknown, config: HttpRequestConfig): HttpError {
    // Handle Axios Cancellation explicitly before generic Axios errors
    if (
      axios.isCancel(error) ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      return new HttpError(
        "Request was cancelled",
        0,
        "Cancelled",
        undefined,
        config,
        false // Not a network error
      );
    }

    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Network error (no response)
      if (!axiosError.response) {
        return new HttpError(
          axiosError.message || "Network error occurred",
          0,
          "",
          undefined,
          config,
          true
        );
      }

      // HTTP error (with response)
      const response = axiosError.response;
      const message =
        this.extractErrorMessage(response.data) || axiosError.message;

      return new HttpError(
        message,
        response.status,
        response.statusText,
        response.data,
        config,
        false
      );
    }

    // Handle generic errors
    if (error instanceof Error) {
      return new HttpError(error.message, 0, "", undefined, config, true);
    }

    // Unknown error
    return new HttpError(
      "An unknown error occurred",
      0,
      "",
      error,
      config,
      true
    );
  }

  /**
   * Extract error message from response data
   *
   * Handles multiple error formats:
   * - String errors
   * - Nested error objects
   * - Array of errors
   * - Validation errors
   */
  private extractErrorMessage(data: any): string | undefined {
    if (!data) return undefined;

    // Direct string error
    if (typeof data === "string") return data;

    // Try common error fields in order of priority
    const errorFields = [
      "message",
      "error",
      "detail",
      "errors",
      "msg",
      "errorMessage",
      "error_message",
    ];

    for (const field of errorFields) {
      if (data[field]) {
        const value = data[field];

        // String value
        if (typeof value === "string") return value;

        // Nested object with message
        if (typeof value === "object" && value !== null) {
          if (value.message && typeof value.message === "string") {
            return value.message;
          }

          // Array of errors (validation errors)
          if (Array.isArray(value) && value.length > 0) {
            const firstError = value[0];
            if (typeof firstError === "string") return firstError;
            if (firstError && firstError.message) return firstError.message;

            // Join multiple error messages
            const messages = value
              .map((err) => (typeof err === "string" ? err : err.message))
              .filter(Boolean);
            if (messages.length > 0) return messages.join(", ");
          }
        }
      }
    }

    // Django/DRF style validation errors
    if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
      return data.non_field_errors.join(", ");
    }

    // Field-specific validation errors
    const fieldErrors: string[] = [];
    for (const key in data) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        const fieldName = key.replace(/_/g, " ");
        const errors = data[key]
          .map((err: any) => (typeof err === "string" ? err : err.message))
          .filter(Boolean);
        if (errors.length > 0) {
          fieldErrors.push(`${fieldName}: ${errors.join(", ")}`);
        }
      }
    }
    if (fieldErrors.length > 0) return fieldErrors.join("; ");

    return undefined;
  }
}
