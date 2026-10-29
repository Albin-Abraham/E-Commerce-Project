import { HttpError, isHttpError } from "./http.error";
import { getFriendlyErrorMessage } from "./http.error.registry";

/**
 * ApiErrorParser
 *
 * Wraps an HttpError and provides clean, typed access to server error details.
 * Bridges the gap between raw HTTP errors and application-level error handling.
 *
 * Use `ApiErrorParser.from(error)` to normalize any thrown value into a
 * consistent error object with structured field errors, non-field errors,
 * and friendly display messages.
 */
export class ApiErrorParser {
  private constructor(private error: HttpError) {}

  /** HTTP status code (0 for network errors) */
  get status(): number {
    return this.error.status;
  }

  /** Raw error message from server or transport */
  get message(): string {
    return this.error.message;
  }

  /** Application-level error code (e.g. "VALIDATION_ERROR") */
  get code(): string | undefined {
    return this.error.code;
  }

  /** Field-level validation errors: { fieldName: ["error 1", "error 2"] } */
  get fieldErrors(): Record<string, string[]> {
    return this.error.fieldErrors || {};
  }

  /** Non-field errors (e.g. "Invalid credentials") */
  get nonFieldErrors(): string[] {
    return this.error.nonFieldErrors || [];
  }

  /** Cross-field errors (e.g. "Password and confirmation do not match") */
  get crossFieldErrors(): string[] {
    return this.error.crossFieldErrors || [];
  }

  /** Contextual metadata: view, function, debug, issue */
  get meta(): Record<string, unknown> | undefined {
    return this.error.meta;
  }

  get isValidationError(): boolean {
    return this.error.isValidationError();
  }

  get isUnauthorized(): boolean {
    return this.error.isUnauthorized();
  }

  get isForbidden(): boolean {
    return this.error.isForbidden();
  }

  get isNotFound(): boolean {
    return this.error.isNotFound();
  }

  get isServerError(): boolean {
    return this.error.isServerError();
  }

  get isNetworkError(): boolean {
    return this.error.isConnectionError();
  }

  /** Friendly message from the error registry (e.g. "Server error, please try again") */
  getFriendlyMessage(): string {
    return getFriendlyErrorMessage(this.error);
  }

  /** Best message for user display: first non-field error, or friendly fallback */
  getDisplayMessage(): string {
    if (this.nonFieldErrors.length > 0) return this.nonFieldErrors[0];
    if (this.crossFieldErrors.length > 0) return this.crossFieldErrors[0];
    return this.getFriendlyMessage();
  }

  /**
   * Normalizes any thrown value into an ApiErrorParser.
   * - If already an ApiErrorParser, returns as-is
   * - If an HttpError, wraps it
   * - Otherwise, wraps in a new HttpError with status 0
   */
  static from(error: unknown): ApiErrorParser {
    if (error instanceof ApiErrorParser) return error;
    if (isHttpError(error)) return new ApiErrorParser(error);
    return new ApiErrorParser(
      new HttpError(
        error instanceof Error ? error.message : "Unknown error",
        0,
        "UNKNOWN",
        error,
        undefined,
        true
      )
    );
  }
}
