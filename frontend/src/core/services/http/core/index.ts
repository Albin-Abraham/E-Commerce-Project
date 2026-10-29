/**
 * HTTP Service Layer
 *
 * This module provides the application layer for HTTP operations.
 * It re-exports domain types and provides the BaseHTTPClientService
 * for use case orchestration.
 *
 * ## Architecture
 *
 * This is the **Application Layer** in Clean Architecture:
 * - Depends on domain abstractions
 * - Provides use case orchestration
 * - Adds application-specific features
 *
 * ## Usage
 *
 * ```typescript
 * import { BaseHTTPClientService, HttpError, isHttpError } from "@services/http/core";
 *
 * const service = new BaseHTTPClientService(httpClient);
 * const response = await service.get<User[]>("/api/users");
 * ```
 */

// Re-export domain types for convenience
export type {
  HttpClient,
  HttpRequestConfig,
  HttpResponse,
  Result,
  HttpMethod,
  ResponseType,
  ContentTypeValue,
  ProgressEvent,
} from "@core/http";

// Re-export core implementations
export {
  ContentType,
  HttpError,
  isHttpError,
  ContentTypeUtils,
  FormDataBuilder,
  FileUploadHelper,
  RequestFactory,
  RequestBuilder,
  ResponseParser,
  ResponseFactory,
} from "@core/http";

export type { FileUploadConfig, MultiFileUploadConfig } from "@core/http";

// Application layer service
export { BaseHTTPClientService } from "./http.client.service";
