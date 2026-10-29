// core/http/http.request.factory.ts
import type {
  ContentTypeValue,
  HttpMethod,
  HttpRequestConfig,
} from "@core/http";
import { ContentType } from "@core/http";

import { API_TIMEOUTS, type TimeoutProfile } from "@configs/api/axios/axios.constants";

import type {
  FileUploadConfig,
  MultiFileUploadConfig,
} from "./http.content-type";
import { FileUploadHelper } from "./http.utils";

/**
 * Request Builder
 *
 * Fluent builder for constructing HTTP request configurations.
 * Provides type-safe method chaining and integrates with file upload helpers.
 *
 * @template TData - Type of request body data
 */
export class RequestBuilder<TData = unknown> {
  private config: Partial<HttpRequestConfig> = {
    timeout: API_TIMEOUTS.DEFAULT,
  };

  constructor(url: string, method: HttpMethod) {
    this.config = { url, method, timeout: API_TIMEOUTS.DEFAULT };
  }

  /**
   * Set request body data (auto-detects content type)
   */
  withData(data: TData): this {
    this.config.data = data;
    return this;
  }

  /**
   * Set JSON request body
   */
  withJson(data: Record<string, unknown>): this {
    this.config.data = data;
    this.config.contentType = ContentType.JSON;
    return this;
  }

  /**
   * Add file upload (integrates with FileUploadHelper and auto-sets upload timeout)
   */
  withFile(config: FileUploadConfig): this {
    const formData = FileUploadHelper.createFormData(config);
    this.config.data = formData;
    this.config.contentType = ContentType.FORM_DATA;
    this.config.timeout = API_TIMEOUTS.UPLOAD;

    if (config.onProgress) {
      this.config.onUploadProgress = (event) =>
        config.onProgress!(event.percentage);
    }

    return this;
  }

  /**
   * Add multiple files (integrates with FileUploadHelper and auto-sets upload timeout)
   */
  withFiles(config: MultiFileUploadConfig): this {
    const formData = FileUploadHelper.createMultiFileFormData(config);
    this.config.data = formData;
    this.config.contentType = ContentType.FORM_DATA;
    this.config.timeout = API_TIMEOUTS.UPLOAD;

    if (config.onProgress) {
      this.config.onUploadProgress = (event) =>
        config.onProgress!(event.percentage);
    }

    return this;
  }

  /**
   * Add query parameters
   */
  withParams(
    params: Record<string, string | number | boolean | null | undefined>
  ): this {
    this.config.params = params;
    return this;
  }

  /**
   * Add request headers
   */
  withHeaders(headers: Record<string, string>): this {
    this.config.headers = { ...this.config.headers, ...headers };
    return this;
  }

  /**
   * Add authentication token
   */
  withAuth(token: string): this {
    return this.withHeaders({ Authorization: `Bearer ${token}` });
  }

  /**
   * Set request timeout using milliseconds or standard TimeoutProfile
   */
  withTimeout(msOrProfile: number | TimeoutProfile): this {
    this.config.timeout =
      typeof msOrProfile === "number"
        ? msOrProfile
        : API_TIMEOUTS[msOrProfile];
    return this;
  }

  /**
   * Configure for data export with export timeout profile
   */
  withExport(format: "blob" | "arraybuffer" = "blob"): this {
    this.config.responseType = format;
    this.config.timeout = API_TIMEOUTS.EXPORT;
    return this;
  }

  /**
   * Set content type
   */
  withContentType(contentType: ContentTypeValue | string): this {
    this.config.contentType = contentType;
    return this;
  }

  /**
   * Set response type
   */
  withResponseType(
    responseType: "json" | "blob" | "text" | "arraybuffer" | "document"
  ): this {
    this.config.responseType = responseType;
    return this;
  }

  /**
   * Enable request deduplication
   */
  deduplicate(): this {
    this.config.deduplicate = true;
    return this;
  }

  /**
   * Enable credentials (cookies) for cross-origin requests
   */
  withCredentials(): this {
    this.config.withCredentials = true;
    return this;
  }

  /**
   * Add validation before building
   */
  validate(validator: (config: Partial<HttpRequestConfig>) => void): this {
    validator(this.config);
    return this;
  }

  /**
   * Build final request configuration
   */
  build(): HttpRequestConfig {
    if (!this.config.url || !this.config.method) {
      throw new Error("RequestBuilder: URL and method are required");
    }

    return this.config as HttpRequestConfig;
  }
}

/**
 * Request Factory
 */
export class RequestFactory {
  static get(url: string): RequestBuilder {
    return new RequestBuilder(url, "GET");
  }

  static post<T = unknown>(url: string): RequestBuilder<T> {
    return new RequestBuilder<T>(url, "POST");
  }

  static put<T = unknown>(url: string): RequestBuilder<T> {
    return new RequestBuilder<T>(url, "PUT");
  }

  static patch<T = unknown>(url: string): RequestBuilder<T> {
    return new RequestBuilder<T>(url, "PATCH");
  }

  static delete(url: string): RequestBuilder {
    return new RequestBuilder(url, "DELETE");
  }

  static uploadFile(url: string, config: FileUploadConfig): HttpRequestConfig {
    return new RequestBuilder(url, "POST").withFile(config).build();
  }

  static uploadFiles(
    url: string,
    config: MultiFileUploadConfig
  ): HttpRequestConfig {
    return new RequestBuilder(url, "POST").withFiles(config).build();
  }
}
