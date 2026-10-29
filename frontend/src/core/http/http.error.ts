// core/http/http.error.ts

/**
 * HTTP Error Class
 *
 * Standardized error object for all HTTP failures.
 * This is now part of the Core Infrastructure/Logic layer.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly data?: unknown;
  readonly config?: unknown;
  readonly isNetworkError: boolean;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly nonFieldErrors?: string[];
  readonly crossFieldErrors?: string[];
  readonly meta?: Record<string, unknown>;

  constructor(
    message: string,
    status: number = 0,
    statusText: string = "",
    data?: unknown,
    config?: unknown,
    isNetworkError: boolean = false
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.config = config;
    this.isNetworkError = isNetworkError;

    // Parse structured data if present
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;

      // 1. Exception handler format: { error: { code, message, metadata } }
      if (d.error && typeof d.error === "object") {
        const err = d.error as Record<string, unknown>;
        this.code = err.code as string | undefined;
        if (err.metadata && typeof err.metadata === "object") {
          const meta = err.metadata as Record<string, unknown>;
          this.nonFieldErrors = meta.non_field_errors as string[] | undefined;
          this.fieldErrors = meta.field_errors as
            | Record<string, string[]>
            | undefined;
          this.crossFieldErrors = meta.cross_fields as string[] | undefined;
          // Backend may use metadata.detail or metadata.details for errors (e.g. invalid credentials)
          if (!this.nonFieldErrors && typeof meta.detail === "string") {
            this.nonFieldErrors = [meta.detail];
          } else if (!this.nonFieldErrors && Array.isArray(meta.details)) {
            this.nonFieldErrors = meta.details as string[];
          } else if (!this.nonFieldErrors && Array.isArray(meta.detail)) {
            this.nonFieldErrors = meta.detail as string[];
          }
          // Extract context meta: view, function, debug, issue
          if (meta.meta && typeof meta.meta === "object") {
            this.meta = meta.meta as Record<string, unknown>;
          }
          // Collect remaining field-level arrays (e.g. { email: ["invalid"], password: ["required"] })
          if (!this.fieldErrors) {
            const fieldEntries: Record<string, string[]> = {};
            for (const [key, val] of Object.entries(meta)) {
              if (
                key !== "non_field_errors" &&
                key !== "cross_fields" &&
                key !== "meta" &&
                key !== "detail" &&
                key !== "details" &&
                Array.isArray(val)
              ) {
                fieldEntries[key] = val as string[];
              }
            }
            if (Object.keys(fieldEntries).length > 0) {
              this.fieldErrors = fieldEntries;
            }
          }
        }
      }

      // 2. ResponseFactory format: { success: false, message, details: { errors } }
      else if (
        d.success === false &&
        d.details &&
        typeof d.details === "object"
      ) {
        const det = d.details as Record<string, unknown>;
        if (det.errors && typeof det.errors === "object") {
          const errs = det.errors as Record<string, unknown>;
          this.nonFieldErrors = errs.non_field_errors as string[] | undefined;
          this.fieldErrors = errs.field_errors as
            | Record<string, string[]>
            | undefined;
          // Collect any remaining field-level arrays (e.g. { email: ["invalid"], password: ["required"] })
          if (!this.fieldErrors) {
            const fieldEntries: Record<string, string[]> = {};
            for (const [key, val] of Object.entries(errs)) {
              if (key !== "non_field_errors" && Array.isArray(val)) {
                fieldEntries[key] = val as string[];
              }
            }
            if (Object.keys(fieldEntries).length > 0) {
              this.fieldErrors = fieldEntries;
            }
          }
        }
      }

      // 3. Legacy flat format: { code, field_errors, non_fields, ... }
      else if (d.code !== undefined || d.field_errors || d.non_fields) {
        this.code = d.code as string | undefined;
        this.fieldErrors = (d.FIELD_ERRORS || d.field_errors) as
          | Record<string, string[]>
          | undefined;
        this.nonFieldErrors = (d.NON_FIELDS || d.non_fields) as
          | string[]
          | undefined;
        this.crossFieldErrors = (d.CROSS_FIELDS_ERROR || d.cross_fields) as
          | string[]
          | undefined;
      }

      // 4. Unified envelope: { status, message, detail, meta }
      else if (
        typeof d.status === "number" &&
        d.detail !== undefined
      ) {
        if (d.meta && typeof d.meta === "object") {
          this.meta = d.meta as Record<string, unknown>;
        }
        if (typeof d.detail === "string") {
          this.nonFieldErrors = [d.detail];
        } else if (Array.isArray(d.detail)) {
          this.nonFieldErrors = d.detail as string[];
        } else if (d.detail && typeof d.detail === "object") {
          const det = d.detail as Record<string, unknown>;
          this.nonFieldErrors = (det.non_field_errors || det.nonFieldErrors) as
            | string[]
            | undefined;
          this.fieldErrors = (det.field_errors || det.fieldErrors) as
            | Record<string, string[]>
            | undefined;
          this.crossFieldErrors = (det.cross_fields || det.crossFields) as
            | string[]
            | undefined;

          // Backend may use detail.detail for single-string errors
          if (!this.nonFieldErrors && typeof det.detail === "string") {
            this.nonFieldErrors = [det.detail];
          } else if (!this.nonFieldErrors && Array.isArray(det.details)) {
            this.nonFieldErrors = det.details as string[];
          }

          // Collect field-level arrays (e.g. { email: ["invalid"], password: ["required"] })
          if (!this.fieldErrors) {
            const fieldEntries: Record<string, string[]> = {};
            for (const [key, val] of Object.entries(det)) {
              if (
                key !== "non_field_errors" &&
                key !== "nonFieldErrors" &&
                key !== "field_errors" &&
                key !== "fieldErrors" &&
                key !== "cross_fields" &&
                key !== "crossFields" &&
                key !== "meta" &&
                key !== "detail" &&
                key !== "details" &&
                Array.isArray(val)
              ) {
                fieldEntries[key] = val as string[];
              }
            }
            if (Object.keys(fieldEntries).length > 0) {
              this.fieldErrors = fieldEntries;
            }
          }
        }
      }

      // Global fallback for root-level meta
      if (!this.meta && d.meta && typeof d.meta === "object") {
        this.meta = d.meta as Record<string, unknown>;
      }
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }
  }

  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  isConnectionError(): boolean {
    return this.isNetworkError || this.status === 0;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isValidationError(): boolean {
    return (
      this.status === 422 ||
      (this.status === 400 &&
        ((!!this.fieldErrors && Object.keys(this.fieldErrors).length > 0) ||
          (!!this.nonFieldErrors && this.nonFieldErrors.length > 0) ||
          this.code === "VALIDATION_ERROR"))
    );
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusText: this.statusText,
      data: this.data,
      isNetworkError: this.isNetworkError,
      stack: this.stack,
    };
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof HttpError ||
    (typeof error === "object" &&
      error !== null &&
      ((error as any).name === "HttpError" ||
        (typeof (error as any).status === "number" &&
          (error as any).isClientError !== undefined)))
  );
}
