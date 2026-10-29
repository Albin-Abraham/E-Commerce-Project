// domain/http/http.dto.types.ts

/**
 * DTO (Data Transfer Object) Types
 *
 * Common response structures and data transfer objects used across the application.
 * These types standardize API response formats and provide type safety for parsing.
 *
 * @module domain/http/dto-types
 */

/**
 * Base DTO Interface (Backend/Snake Case)
 */
export interface BaseDTO {
  id: string | number;
  created_at?: string;
  updated_at?: string;
  created_by?: string | number;
  updated_by?: string | number;
  [key: string]: any;
}

/**
 * Base Model Interface (Frontend/Camel Case)
 */
export interface BaseModel {
  id: string | number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | number;
  updatedBy?: string | number;
  [key: string]: any;
}

/**
 * Paginated Response DTO
 *
 * Standard structure for paginated API responses.
 * Supports various backend pagination formats (Django, Laravel, custom).
 *
 * @template T - Type of items in the paginated list
 *
 * @example
 * ```typescript
 * const response: PaginatedResponse<User> = {
 *   items: [{ id: "1", name: "John" }],
 *   total: 100,
 *   page: 1,
 *   pageSize: 10,
 *   hasNext: true,
 *   hasPrevious: false
 * };
 * ```
 */
export interface PaginatedResponse<T> {
  /** Array of items for current page */
  items: T[];

  /** Total number of items across all pages */
  total: number;

  /** Current page number (1-indexed) */
  page: number;

  /** Number of items per page */
  pageSize: number;

  /** Whether there is a next page */
  hasNext: boolean;

  /** Whether there is a previous page */
  hasPrevious: boolean;
}

/**
 * API Envelope DTO
 *
 * Standard wrapper for API responses that follow the envelope pattern.
 * Common in REST APIs that wrap all responses in a consistent structure.
 *
 * @template T - Type of the actual data payload
 *
 * @example
 * ```typescript
 * const envelope: ApiEnvelope<User> = {
 *   success: true,
 *   data: { id: "1", name: "John" },
 *   message: "User retrieved successfully",
 *   errors: [],
 *   meta: {
 *     timestamp: "2024-01-01T00:00:00Z",
 *     requestId: "req-123"
 *   }
 * };
 * ```
 */
export interface ApiEnvelope<T> {
  /** Whether the request was successful */
  success: boolean;

  /** The actual response data */
  data: T;

  /** Optional message from the server */
  message?: string;

  /** Array of error messages (if any) */
  errors?: string[];

  /** Additional metadata about the response */
  meta?: {
    /** ISO timestamp of when response was generated */
    timestamp: string;

    /** Unique request identifier for tracing */
    requestId?: string;

    /** Additional custom metadata */
    [key: string]: unknown;
  };
}

/**
 * File Download DTO
 *
 * Metadata and utilities for downloaded files.
 * Includes blob data, filename, MIME type, and object URL for browser usage.
 *
 * @example
 * ```typescript
 * const download: FileDownload = {
 *   blob: new Blob([data], { type: "application/pdf" }),
 *   filename: "report.pdf",
 *   mimeType: "application/pdf",
 *   size: 1024000,
 *   url: "blob:http://localhost:3000/abc-123"
 * };
 *
 * // Trigger download
 * const link = document.createElement('a');
 * link.href = download.url;
 * link.download = download.filename;
 * link.click();
 * ```
 */
export interface FileDownload {
  /** Blob containing the file data */
  blob: Blob;

  /** Filename (extracted from Content-Disposition or default) */
  filename: string;

  /** MIME type of the file */
  mimeType: string;

  /** File size in bytes */
  size: number;

  /** Object URL for the blob (can be used in <a> or <img> tags) */
  url: string;
}

/**
 * Validation Result DTO
 *
 * Structure for validation responses from the server.
 * Used when API returns field-level validation errors.
 *
 * @example
 * ```typescript
 * const result: ValidationResult = {
 *   valid: false,
 *   errors: [
 *     { field: "email", message: "Invalid email format", code: "INVALID_EMAIL" },
 *     { field: "password", message: "Too short", code: "MIN_LENGTH" }
 *   ]
 * };
 * ```
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Array of validation errors */
  errors: ValidationError[];
}

/**
 * Validation Error DTO
 *
 * Individual field validation error.
 *
 * @example
 * ```typescript
 * const error: ValidationError = {
 *   field: "email",
 *   message: "Email is required",
 *   code: "REQUIRED_FIELD"
 * };
 * ```
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string;

  /** Human-readable error message */
  message: string;

  /** Optional error code for programmatic handling */
  code?: string;
}
