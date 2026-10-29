// core/http/http.error.registry.ts
import type { HttpError } from "./http.error";

/**
 * Central Registry of API Error Codes
 */
export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  SERVER_ERROR: "SERVER_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",

  // Domain Specific Codes
  EMAIL_INVALID: "EMAIL_INVALID",
  PASSWORD_TOO_SHORT: "PASSWORD_TOO_SHORT",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Mapping of Error Codes to Friendly Messages
 * Supports static strings and dynamic functions using HttpError data.
 */
export const ErrorMessages: Record<
  string,
  string | ((err: HttpError) => string)
> = {
  [ErrorCodes.VALIDATION_ERROR]: "Please fix the highlighted errors.",
  [ErrorCodes.UNAUTHORIZED]: "Your session has expired. Please log in again.",
  [ErrorCodes.FORBIDDEN]: "You do not have permission to perform this action.",
  [ErrorCodes.NOT_FOUND]: "The requested resource was not found.",
  [ErrorCodes.SERVER_ERROR]: "A server error occurred. Please try again later.",
  [ErrorCodes.NETWORK_ERROR]:
    "Network connection lost. Please check your internet.",
  [ErrorCodes.TIMEOUT_ERROR]: "The request timed out. Please try again.",

  // Dynamic Message Examples
  [ErrorCodes.EMAIL_INVALID]: "Please enter a valid email address.",
  [ErrorCodes.PASSWORD_TOO_SHORT]: (err: HttpError) => {
    const minLength = (err.data as any)?.minLength ?? 8;
    return `Password must be at least ${minLength} characters long.`;
  },
};

/**
 * Helper to get a friendly message for an error using the registry
 */
export function getFriendlyErrorMessage(err: HttpError): string {
  const code = err.code || "";
  const messageOrFn = ErrorMessages[code];

  if (typeof messageOrFn === "function") {
    return messageOrFn(err);
  }

  return messageOrFn || err.message || "An unexpected error occurred.";
}
