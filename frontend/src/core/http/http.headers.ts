// domain/http/http.headers.ts

/**
 * HTTP Headers
 *
 * Predefined header configurations for common use cases.
 * Separated into business-specific and technical headers.
 *
 * @module domain/http/headers
 */

/**
 * Application-Specific Headers
 *
 * Business logic headers that convey application-specific information.
 * These headers are used to communicate special requirements or modes
 * to the backend.
 *
 * @example
 * ```typescript
 * // Request data formatted for select options
 * const response = await httpClient.get("/api/users", {
 *   headers: AppHeaders.selectOption
 * });
 *
 * // Enable admin mode for privileged operations
 * const response = await httpClient.post("/api/admin/action", data, {
 *   headers: AppHeaders.adminMode
 * });
 *
 * // Include app version for compatibility checks
 * const response = await httpClient.get("/api/data", {
 *   headers: AppHeaders.version("2.1.0")
 * });
 * ```
 */
export const AppHeaders = {
  /**
   * Indicates that the response should be formatted as select options
   *
   * Used when fetching data for dropdown/select components.
   * Backend should return data in { value, label } format.
   */
  selectOption: { "Is-Select-Option": "true" } as const,

  /**
   * Enables admin mode for the request
   *
   * Used for privileged operations that require elevated permissions.
   * Backend should validate admin status before processing.
   */
  adminMode: { "X-Admin-Mode": "enabled" } as const,

  /**
   * Specifies the application version
   *
   * Used for API versioning and compatibility checks.
   * Backend can use this to provide version-specific responses.
   *
   * @param version - Semantic version string (e.g., "2.1.0")
   * @returns Header object with version
   */
  version: (version: string) => ({ "X-App-Version": version }) as const,
} as const;

/**
 * Content-Type Headers
 *
 * Technical headers for specifying request/response content types.
 * These are typically set automatically by the HTTP client based on
 * the data being sent, but can be used explicitly when needed.
 *
 * @example
 * ```typescript
 * // Explicitly set JSON content type
 * const response = await httpClient.post("/api/data", jsonData, {
 *   headers: ContentHeaders.json
 * });
 *
 * // Note: Usually not needed as the client auto-detects
 * // FormData and sets multipart automatically
 * const response = await httpClient.post("/api/upload", formData, {
 *   headers: ContentHeaders.multipart
 * });
 * ```
 */
export const ContentHeaders = {
  /**
   * JSON content type
   *
   * Use for sending JSON-formatted request bodies.
   * Usually auto-detected by the HTTP client.
   */
  json: { "Content-Type": "application/json" } as const,

  /**
   * Multipart form data content type
   *
   * Use for file uploads and form submissions.
   * Usually auto-detected when sending FormData.
   *
   * Note: When using FormData, the browser automatically sets
   * the boundary parameter, so you typically don't need to set
   * this header manually.
   */
  multipart: { "Content-Type": "multipart/form-data" } as const,
} as const;
