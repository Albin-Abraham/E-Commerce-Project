/**
 * Platform Networking: API Error Envelope
 *
 * Normalizes all HTTP, network, validation, and authorization errors
 * into an auditable, type-safe error structure.
 */

export interface ApiValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiErrorDetails {
  status: number;
  code: string;
  message: string;
  validationErrors?: ApiValidationError[];
  requestId?: string;
  timestamp: string;
  originalError?: unknown;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly validationErrors?: ApiValidationError[];
  public readonly requestId?: string;
  public readonly timestamp: string;
  public readonly originalError?: unknown;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = "ApiError";
    this.status = details.status;
    this.code = details.code;
    this.validationErrors = details.validationErrors;
    this.requestId = details.requestId;
    this.timestamp = details.timestamp;
    this.originalError = details.originalError;

    // Maintain prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Determine if the error is considered transient/retryable.
   * HTTP 408 (Timeout), 429 (Rate Limited), 502, 503, 504 are transient.
   * Network offline / connection drops are transient.
   */
  public isTransient(): boolean {
    if (this.status === 0) return true; // Network disconnect / DNS failure
    if ([408, 429, 502, 503, 504].includes(this.status)) return true;
    return false;
  }

  /**
   * Factory method: Construct from standard Response
   */
  public static async fromResponse(response: Response): Promise<ApiError> {
    const status = response.status;
    const timestamp = new Date().toISOString();
    const requestId = response.headers.get("x-request-id") ?? undefined;

    let message = response.statusText || `HTTP ${status}`;
    let code = `HTTP_${status}`;
    let validationErrors: ApiValidationError[] | undefined;

    try {
      const data = await response.json();
      if (typeof data === "object" && data !== null) {
        if (typeof data.message === "string") message = data.message;
        if (typeof data.detail === "string") message = data.detail;
        if (typeof data.error === "string") message = data.error;
        if (typeof data.code === "string") code = data.code;

        // Parse DRF validation errors { "title": ["This field is required"] }
        if (status === 400 || status === 422) {
          const errors: ApiValidationError[] = [];
          for (const [field, val] of Object.entries(data)) {
            if (Array.isArray(val)) {
              errors.push({ field, message: val.join(", ") });
            } else if (typeof val === "string") {
              errors.push({ field, message: val });
            }
          }
          if (errors.length > 0) {
            validationErrors = errors;
          }
        }
      }
    } catch {
      // Body wasn't JSON or empty
    }

    return new ApiError({
      status,
      code,
      message,
      validationErrors,
      requestId,
      timestamp,
    });
  }

  /**
   * Factory method: Construct from a network / fetch exception
   */
  public static fromNetworkException(err: unknown): ApiError {
    const timestamp = new Date().toISOString();
    const message = err instanceof Error ? err.message : "Network request failed";

    return new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message,
      timestamp,
      originalError: err,
    });
  }
}
