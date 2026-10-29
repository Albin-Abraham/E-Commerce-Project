// domain/http/http.client.interface.ts
import type { HttpRequestConfig, HttpResponse } from "./http.types";

/**
 * HTTP Client Interface
 *
 * Framework-agnostic interface for HTTP operations. This is the core
 * abstraction that defines the contract for making HTTP requests.
 *
 * Implementations can use any HTTP library (Axios, Fetch, etc.) as long
 * as they conform to this interface.
 *
 * ## Design Principles
 *
 * 1. **Framework Independence**: No dependencies on specific HTTP libraries
 * 2. **Single Responsibility**: Only concerned with making HTTP requests
 * 3. **Type Safety**: Fully typed request/response cycle
 * 4. **Error Handling**: Throws HttpError on failure
 *
 * ## Implementation Notes
 *
 * Implementations should:
 * - Transform framework-specific errors to HttpError
 * - Handle content-type detection and serialization
 * - Support request cancellation via AbortSignal
 * - Provide progress tracking for uploads/downloads
 *
 * @example
 * ```typescript
 * // Using the interface
 * class MyService {
 *   constructor(private httpClient: HttpClient) {}
 *
 *   async getUser(id: string) {
 *     const response = await this.httpClient.request<User>({
 *       url: `/users/${id}`,
 *       method: "GET"
 *     });
 *     return response.data;
 *   }
 * }
 *
 * // Injecting an implementation
 * const axiosClient = new AxiosHttpClient(axiosInstance);
 * const service = new MyService(axiosClient);
 * ```
 *
 * @see {@link AxiosHttpClient} for Axios implementation
 */
export interface HttpClient {
  /**
   * Make an HTTP request
   *
   * This is the core method that all HTTP operations go through.
   * Implementations should handle:
   * - Request serialization based on content type
   * - Response deserialization
   * - Error transformation to HttpError
   * - Progress tracking
   * - Request cancellation
   *
   * @template T - Expected type of the response data
   * @param config - Request configuration
   * @returns Promise resolving to HTTP response
   * @throws {HttpError} On request failure (network error, HTTP error, etc.)
   *
   * @example
   * ```typescript
   * // GET request
   * const response = await client.request<User[]>({
   *   url: "/api/users",
   *   method: "GET",
   *   params: { role: "admin" }
   * });
   *
   * // POST request with JSON body
   * const response = await client.request<User>({
   *   url: "/api/users",
   *   method: "POST",
   *   data: { name: "John", email: "john@example.com" },
   *   contentType: "application/json"
   * });
   *
   * // File upload with progress tracking
   * const response = await client.request({
   *   url: "/api/upload",
   *   method: "POST",
   *   data: formData,
   *   contentType: "multipart/form-data",
   *   onUploadProgress: (event) => {
   *     console.log(`Upload: ${event.percentage}%`);
   *   }
   * });
   *
   * // Cancellable request
   * const controller = new AbortController();
   * const response = await client.request({
   *   url: "/api/data",
   *   method: "GET",
   *   signal: controller.signal
   * });
   * // Later: controller.abort();
   * ```
   */
  request<T = unknown>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
}
