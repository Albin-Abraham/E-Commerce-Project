import type { AxiosError, AxiosRequestConfig } from "axios";

import type { ParsedAxiosError } from "@configs/type/error";

/**
 * ✅ Parse an AxiosError into a fully normalized object.
 */
export const parseAxiosError = (axiosError: AxiosError): ParsedAxiosError => {
  const config: AxiosRequestConfig = axiosError?.config ?? {};
  const method = config.method?.toUpperCase() ?? "UNKNOWN";
  const endpoint = config.url ?? "UNKNOWN";
  const response = axiosError.response;

  // Always compute status before statusText
  const status = response?.status ?? 0;

  // Cast to ApiErrorResponse (safe flexible typing)
  const data = (response?.data ?? undefined) as Record<string, any> | undefined;

  // Prefer API-provided message, fallback to Axios message
  const message =
    data?.message ||
    data?.detail?.message ||
    axiosError.message ||
    "An unexpected error occurred";

  // Capture details in multiple API formats
  const detailsSource =
    data?.errors ?? data?.detail?.errors ?? data?.detail ?? data ?? null;

  // Normalize into array
  const details: (Record<string, unknown> | string)[] = Array.isArray(
    detailsSource
  )
    ? (detailsSource as (Record<string, unknown> | string)[])
    : detailsSource
      ? [detailsSource as Record<string, unknown> | string]
      : [];

  return {
    message,
    details,
    method,
    endpoint,
    status,
    isNetworkError: !response,
    timestamp: new Date(),
  };
};

/**
 * ✅ Standardized client error object for easier consumption
 * in hooks, forms, or API responses.
 */
export const catchAxiosError = (axiosError: AxiosError): ParsedAxiosError => {
  return parseAxiosError(axiosError);
};

/**
 * ✅ Type guard for ParsedAxiosError
 */
export const isParsedAxiosError = (
  error: unknown
): error is ParsedAxiosError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "status" in error &&
    "isNetworkError" in error
  );
};
