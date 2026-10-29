// domain/http/index.ts

/**
 * HTTP Domain Layer
 */

// Core interfaces
export type { HttpClient } from "./http.client.interface";

// Re-export core implementations
export { HttpError, isHttpError } from "./http.error";
export { TokenRefreshQueue, authRefreshQueue } from "./http.auth-queue";

export { ApiErrorParser } from "./api-error-parser";

export {
  ContentTypeUtils,
  FormDataBuilder,
  FileUploadHelper,
} from "./http.utils";

export { RequestFactory, RequestBuilder } from "./http.request.factory";

export { ResponseFactory, ResponseParser } from "./http.response.factory";
export { HttpTransformer, unwrapEnvelope } from "./http.transformer";

// Types and constants
export type {
  HttpMethod,
  ResponseType,
  ContentTypeValue,
  HttpRequestConfig,
  HttpResponse,
  ProgressEvent,
  Result,
} from "./http.types";

export { ContentType } from "./http.types";

// Content-type types
export type {
  FileUploadConfig,
  MultiFileUploadConfig,
} from "./http.content-type";

// DTO types
export type {
  BaseDTO,
  BaseModel,
  PaginatedResponse,
  ApiEnvelope,
  FileDownload,
  ValidationResult,
  ValidationError,
} from "./http.dto.types";

// Headers
export { AppHeaders, ContentHeaders } from "./http.headers";
