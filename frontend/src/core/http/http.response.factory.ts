import type { HttpResponse } from "@core/http";
import type { ApiEnvelope, FileDownload, PaginatedResponse } from "@core/http";

import { HttpError } from "./http.error";
import { getFriendlyErrorMessage } from "./http.error.registry";
import { HttpTransformer } from "./http.transformer";

/**
 * Result Parser for successful HTTP responses.
 */
export class ResponseParser<T> {
  constructor(private response: HttpResponse<unknown>) {}

  /**
   * Main Parsing Logic
   * @param options.transformer - Custom mapping function
   * @param options.casing - Target casing for the result
   */
  parse<R = T>(
    options: {
      transformer?: (data: unknown) => R;
      casing?: "camel" | "snake" | "none";
    } = {}
  ): R {
    let data = this.response.data;

    if (options.casing === "camel") {
      data = HttpTransformer.toCamelCase(data);
    } else if (options.casing === "snake") {
      data = HttpTransformer.toSnakeCase(data);
    }

    if (options.transformer) {
      return options.transformer(data);
    }
    return data as R;
  }

  parsePaginated<TItem>(
    options: { casing?: "camel" | "none" } = { casing: "camel" }
  ): PaginatedResponse<TItem> {
    const rawData = this.response.data as any;
    const data =
      options.casing === "camel"
        ? HttpTransformer.toCamelCase<any>(rawData)
        : rawData;

    // Support diverse pagination envelopes
    const items =
      data.results || data.items || data.data || data.detail || [];
    const total =
      data.count || data.total || data.totalCount || data.total_count || 0;
    const page = data.page || data.currentPage || data.current_page || 1;
    const pageSize =
      data.pageSize || data.page_size || data.perPage || data.per_page || 10;
    const hasNext = !!(data.next || data.hasNext || data.has_next);
    const hasPrevious = !!(
      data.previous ||
      data.hasPrevious ||
      data.has_previous
    );

    return {
      items,
      total,
      page,
      pageSize,
      hasNext,
      hasPrevious,
    };
  }

  parseEnvelope<TData>(
    options: { casing?: "camel" | "none" } = { casing: "camel" }
  ): ApiEnvelope<TData> {
    const rawData = this.response.data as any;
    const data =
      options.casing === "camel"
        ? HttpTransformer.toCamelCase<any>(rawData)
        : rawData;

    return {
      success: data.success ?? this.response.status < 400,
      data:
        data.data !== undefined
          ? data.data
          : data.detail !== undefined
          ? data.detail
          : data.results,
      message: data.message || data.msg,
      errors: data.errors || [],
      meta: {
        timestamp: data.timestamp || new Date().toISOString(),
        requestId: data.requestId || data.request_id,
        ...data.meta,
      },
    };
  }

  parseFile(): FileDownload {
    const blob = this.response.data as Blob;
    const contentDisposition = this.response.headers["content-disposition"];
    const filename = this.extractFilename(contentDisposition);

    return {
      blob,
      filename,
      mimeType: blob.type,
      size: blob.size,
      url: URL.createObjectURL(blob),
    };
  }

  private extractFilename(header?: string): string {
    if (!header) return "download";
    const filenameMatch = header.match(
      /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
    );
    if (filenameMatch && filenameMatch[1]) {
      return filenameMatch[1].replace(/['"]/g, "");
    }
    const filenameStarMatch = header.match(/filename\*=UTF-8''(.+)/);
    if (filenameStarMatch && filenameStarMatch[1]) {
      return decodeURIComponent(filenameStarMatch[1]);
    }
    return "download";
  }
}

/**
 * Modernized Response Factory
 * Handles both successful responses and HttpErrors.
 */
export class ResponseFactory {
  private error?: HttpError;

  constructor(errOrResp?: HttpError) {
    if (errOrResp instanceof HttpError) {
      this.error = errOrResp;
    }
  }

  // --- Static Success Utilities ---

  static parse<T>(response: HttpResponse<unknown>): ResponseParser<T> {
    return new ResponseParser<T>(response);
  }

  static unwrap<T>(response: HttpResponse<T>): T {
    return response.data;
  }

  /**
   * UnWrap Helper: Highly robust data extraction.
   * Automatically detects envelopes and performs recursive normalization.
   *
   * @param payload - Raw response or envelope
   * @param options.casing - Target casing (default: camel)
   * @param options.autoEnvelope - If true, strips { data: T } wrappers automatically
   */
  static UnWrap<T, R = T>(
    payload: HttpResponse<T> | T,
    options: {
      casing?: "camel" | "snake" | "none";
      autoEnvelope?: boolean;
      dataPath?: string; // Explicit path to data (e.g. "results" or "data.items")
      transformer?: (data: any) => R;
    } = {}
  ): R {
    const casing = options.casing ?? "camel";
    const autoEnvelope = options.autoEnvelope ?? true;
    const dataPath = options.dataPath;
    const transformer = options.transformer;

    // 1. Extract raw data from Response object if present
    const isHttpResponse =
      payload &&
      typeof payload === "object" &&
      "data" in (payload as any) &&
      ("headers" in (payload as any) ||
        "config" in (payload as any) ||
        "statusText" in (payload as any));

    let raw = isHttpResponse
      ? (payload as HttpResponse<T>).data
      : (payload as T);

    // 2. Data Extraction
    // If dataPath is provided, use it. Otherwise, use autoEnvelope logic.
    if (dataPath) {
      const parts = dataPath.split(".");
      raw = parts.reduce(
        (acc, part) => (acc ? acc[part] : undefined),
        raw as any
      );
    } else if (
      autoEnvelope &&
      raw &&
      typeof raw === "object" &&
      !Array.isArray(raw)
    ) {
      const unwrapped = HttpTransformer.unwrapEnvelope(raw);
      raw = unwrapped.data;
    }

    let processed: any = raw;
    if (casing === "camel") {
      processed = HttpTransformer.toCamelCase(raw);
    } else if (casing === "snake") {
      processed = HttpTransformer.toSnakeCase(raw);
    }

    // 4. Custom Transformation
    if (transformer) {
      if (Array.isArray(processed)) {
        return processed.map(transformer) as any;
      }
      return transformer(processed);
    }

    return processed as R;
  }

  /**
   * Wrap Helper: Formats request bodies for backend compatibility.
   */
  static Wrap<T, R = T>(
    data: T,
    options: {
      casing?: "snake" | "camel" | "none";
      transformer?: (data: T) => R;
    } = {}
  ): R {
    const casing = options.casing ?? "snake";
    const transformer = options.transformer;

    let processed: any = data;

    if (casing === "snake") {
      processed = HttpTransformer.toSnakeCase(data);
    } else if (casing === "camel") {
      processed = HttpTransformer.toCamelCase(data);
    }

    if (transformer) {
      return transformer(processed);
    }

    return processed as R;
  }

  /**
   * Specialized UnWrap to extract IDs from potentially unorganized responses.
   */
  static ExtractId(data: any): string | number {
    return data?.id ?? data?._id ?? data?.uuid ?? data?.pk;
  }

  // --- Error Parsing Methods ---

  getErrorCode(): string | undefined {
    return this.error?.code;
  }

  getFriendlyMessage(): string {
    if (!this.error) return "";
    return getFriendlyErrorMessage(this.error);
  }

  getNonFieldErrors(): string[] {
    return this.error?.nonFieldErrors || [];
  }

  getCrossFieldErrors(): string[] {
    return this.error?.crossFieldErrors || [];
  }

  getFieldErrors(field?: string): string[] | Record<string, string[]> {
    const errors = this.error?.fieldErrors || {};
    if (field) {
      return errors[field] || [];
    }
    return errors;
  }

  /**
   * Returns a flattened view of all field errors.
   */
  getAllFieldErrors(): string[] {
    const errors = this.error?.fieldErrors || {};
    return Object.values(errors).flat();
  }
}
