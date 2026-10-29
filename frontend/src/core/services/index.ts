// Barrel export for services
export { httpClient } from "./http.instance";
export * from "@features/auth/services/auth-manager";

// Domain & Core HTTP
export type {
  HttpClient,
  HttpRequestConfig,
  HttpResponse,
  Result,
  HttpMethod,
  ResponseType,
  ContentTypeValue,
  ProgressEvent,
  FileUploadConfig,
  MultiFileUploadConfig,
} from "@core/http";

export {
  ContentType,
  HttpError,
  isHttpError,
  ContentTypeUtils,
  FormDataBuilder,
  FileUploadHelper,
} from "@core/http";

// Application HTTP Helpers
export { BaseHTTPClientService } from "./http/core/http.client.service";
export { BaseServiceRequest } from "./core/base-service-request";

export { mapSelectOptions, handleSubmit } from "./http/helpers";

// Export hooks (all use LoadingContext)
export {
  useQuery,
  useMutation,
  useFileUpload,
  useDebounce,
  useThrottle,
  usePrevious,
  useIsMounted,
  type UseQueryOptions,
  type UseQueryResult,
  type UseMutationOptions,
  type UseMutationResult,
  type UseFileUploadOptions,
  type UseFileUploadResult,
} from "@hooks";
