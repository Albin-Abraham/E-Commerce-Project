// domain/http/http.types.ts

/**
 * HTTP Types and Interfaces
 *
 * Core domain types for HTTP operations. These are framework-agnostic
 * abstractions that define the contract for HTTP communication.
 *
 * @module domain/http/types
 */

/**
 * Supported HTTP methods
 *
 * @example
 * ```typescript
 * const method: HttpMethod = "GET";
 * ```
 */
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

/**
 * Supported response types for HTTP requests
 *
 * @example
 * ```typescript
 * const responseType: ResponseType = "blob"; // For file downloads
 * ```
 */
export type ResponseType =
  | "json"
  | "blob"
  | "text"
  | "arraybuffer"
  | "document";

/**
 * Standard Content-Type values
 *
 * @example
 * ```typescript
 * const headers = {
 *   "Content-Type": ContentType.JSON
 * };
 * ```
 */
export const ContentType = {
  JSON: "application/json",
  FORM_DATA: "multipart/form-data",
  FORM_URLENCODED: "application/x-www-form-urlencoded",
  TEXT: "text/plain",
  HTML: "text/html",
  XML: "application/xml",
  PDF: "application/pdf",
  OCTET_STREAM: "application/octet-stream",
} as const;

/**
 * Type-safe Content-Type value
 */
export type ContentTypeValue = (typeof ContentType)[keyof typeof ContentType];

/**
 * Progress event for uploads and downloads
 *
 * Provides information about the current state of a file transfer operation.
 *
 * @example
 * ```typescript
 * const onProgress = (event: ProgressEvent) => {
 *   console.log(`Progress: ${event.percentage}%`);
 *   console.log(`Loaded: ${event.loaded} / ${event.total} bytes`);
 * };
 * ```
 */
export interface ProgressEvent {
  /** Number of bytes loaded so far */
  loaded: number;

  /** Total number of bytes to transfer */
  total: number;

  /** Percentage of completion (0-100) */
  percentage: number;
}

/**
 * HTTP Request Configuration
 *
 * Comprehensive configuration for HTTP requests with support for:
 * - Multiple content types (JSON, FormData, etc.)
 * - Request cancellation via AbortSignal
 * - Upload/download progress tracking
 * - Custom timeouts and validation
 *
 * @example
 * ```typescript
 * const config: HttpRequestConfig = {
 *   url: "/api/users",
 *   method: "POST",
 *   data: { name: "John" },
 *   headers: { "Authorization": "Bearer token" },
 *   timeout: 5000,
 *   onUploadProgress: (event) => console.log(event.percentage)
 * };
 * ```
 */
export interface HttpRequestConfig {
  /** Request URL (relative or absolute) */
  url: string;

  /** HTTP method to use */
  method: HttpMethod;

  /** Request body data (will be serialized based on content type) */
  data?: unknown;

  /** Custom request headers */
  headers?: Record<string, string>;

  /** URL query parameters */
  params?: Record<string, string | number | boolean | null | undefined>;

  /** Request timeout in milliseconds */
  timeout?: number;

  /** AbortSignal for request cancellation */
  signal?: AbortSignal;

  /** Expected response type */
  responseType?: ResponseType;

  /** Include credentials (cookies) in cross-origin requests */
  withCredentials?: boolean;

  /** Custom function to validate HTTP status codes */
  validateStatus?: (status: number) => boolean;

  /** Upload progress callback */
  onUploadProgress?: (event: ProgressEvent) => void;

  /** Download progress callback */
  onDownloadProgress?: (event: ProgressEvent) => void;

  /** Content-Type header (auto-detected if not provided) */
  contentType?: ContentTypeValue | string;

  /** Maximum request body size in bytes */
  maxBodyLength?: number;

  /** Maximum response size in bytes */
  maxContentLength?: number;

  /**
   * Request transformation options
   */
  transformRequest?: {
    casing?: "snake" | "camel" | "none";
  };

  /**
   * Response transformation options
   */
  transformResponse?: {
    casing?: "camel" | "snake" | "none";
    autoEnvelope?: boolean;
  };

  /**
   * Enable request deduplication
   *
   * When enabled, concurrent identical requests will share the same response.
   * Useful for preventing duplicate API calls.
   *
   * @default false
   */
  deduplicate?: boolean;
}

/**
 * HTTP Response
 *
 * Standardized response object containing:
 * - Response data (typed)
 * - HTTP status information
 * - Response headers
 * - Original request configuration
 *
 * @template T - Type of the response data
 *
 * @example
 * ```typescript
 * interface User { id: string; name: string; }
 *
 * const response: HttpResponse<User> = await httpClient.get("/api/user/123");
 * console.log(response.data.name); // Type-safe access
 * console.log(response.status);    // 200
 * ```
 */
export interface HttpResponse<T = unknown> {
  /** Response data (parsed based on content type) */
  data: T;

  /** HTTP status code (e.g., 200, 404, 500) */
  status: number;

  /** HTTP status text (e.g., "OK", "Not Found") */
  statusText: string;

  /** Response headers (normalized to lowercase keys) */
  headers: Record<string, string>;

  /** Original request configuration */
  config: HttpRequestConfig;
}

/**
 * Result type for safe error handling
 *
 * Use this for operations that may fail without throwing exceptions.
 * Encourages explicit error handling at the call site.
 *
 * @template T - Type of the success value
 * @template E - Type of the error (defaults to Error)
 *
 * @example
 * ```typescript
 * async function fetchUser(id: string): Promise<Result<User, HttpError>> {
 *   try {
 *     const response = await httpClient.get(`/users/${id}`);
 *     return { success: true, data: response.data };
 *   } catch (error) {
 *     return { success: false, error: error as HttpError };
 *   }
 * }
 *
 * const result = await fetchUser("123");
 * if (result.success) {
 *   console.log(result.data.name);
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
