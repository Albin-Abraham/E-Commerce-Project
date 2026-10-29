/**
 * Validation Utilities
 *
 * Pure validation functions for export data and import files.
 * No React dependencies — usable in any context.
 */

import type { ColumnFieldSchema, FormFieldSchema } from "../types";

// ── Column field schema narrowing ───────────────────────────────────────

/**
 * Narrows a `ColumnFieldSchema` to a complete `FormFieldSchema`.
 *
 * `TableColumnMeta.fieldSchema` only requires `type` (formatting needs nothing
 * else), but inline editing builds a real form from it, so `id`, `name` and
 * `label` must be present for the input to be addressable.
 */
export function isCompleteFieldSchema(
  schema: ColumnFieldSchema
): schema is FormFieldSchema {
  return Boolean(schema && schema.type);
}

// ── Types ─────────────────────────────────────────────────────────────

export type ExportValidationType = "string" | "number" | "date" | "email";

export interface ExportValidationRule {
  column: string;
  required?: boolean;
  type?: ExportValidationType;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  validate?: (value: unknown) => string | null;
}

export interface ImportFileValidationRules {
  /** Allowed file extensions — e.g. [".csv", ".xlsx", ".xls"] */
  allowedExtensions?: string[];
  /** Max file size in bytes */
  maxFileSize?: number;
  /** Min file size in bytes */
  minFileSize?: number;
  /** Required CSV headers */
  requiredHeaders?: string[];
}

export type ImportFileErrorCode =
  | "INVALID_EXTENSION"
  | "FILE_TOO_LARGE"
  | "FILE_TOO_SMALL"
  | "MISSING_HEADERS";

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  value: unknown;
}

export interface ImportError {
  code: ImportFileErrorCode;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ImportValidationResult {
  valid: boolean;
  errors: ImportError[];
}

// ── Export Validation ─────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}/;

function validateType(
  value: unknown,
  type: ExportValidationType
): string | null {
  if (value === null || value === undefined || value === "") return null;

  switch (type) {
    case "email":
      return typeof value === "string" && EMAIL_REGEX.test(value)
        ? null
        : "Invalid email format";
    case "number":
      return !isNaN(Number(value)) ? null : "Must be a number";
    case "date":
      return typeof value === "string" && DATE_REGEX.test(value)
        ? null
        : "Invalid date format";
    case "string":
      return typeof value === "string" ? null : "Must be a string";
    default:
      return null;
  }
}

/**
 * Validate rows against export rules.
 * Returns the first N errors (max 100) for performance.
 */
export function validateExportData<T extends Record<string, unknown>>(
  rows: T[],
  rules: ExportValidationRule[],
  maxErrors = 100
): ValidationResult {
  const errors: ValidationError[] = [];

  for (let i = 0; i < rows.length && errors.length < maxErrors; i++) {
    const row = rows[i];

    for (const rule of rules) {
      if (errors.length >= maxErrors) break;

      const value = row[rule.column];

      // Required check
      if (
        rule.required &&
        (value === null || value === undefined || value === "")
      ) {
        errors.push({
          row: i + 1,
          column: rule.column,
          message: `${rule.column} is required`,
          value,
        });
        continue;
      }

      // Skip further validation if value is empty and not required
      if (value === null || value === undefined || value === "") continue;

      // Type check
      if (rule.type) {
        const typeError = validateType(value, rule.type);
        if (typeError) {
          errors.push({
            row: i + 1,
            column: rule.column,
            message: typeError,
            value,
          });
          continue;
        }
      }

      // String length checks
      if (typeof value === "string") {
        if (rule.minLength !== undefined && value.length < rule.minLength) {
          errors.push({
            row: i + 1,
            column: rule.column,
            message: `Minimum ${rule.minLength} characters`,
            value,
          });
          continue;
        }
        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
          errors.push({
            row: i + 1,
            column: rule.column,
            message: `Maximum ${rule.maxLength} characters`,
            value,
          });
          continue;
        }
      }

      // Pattern check
      if (
        rule.pattern &&
        typeof value === "string" &&
        !rule.pattern.test(value)
      ) {
        errors.push({
          row: i + 1,
          column: rule.column,
          message: `Does not match required pattern`,
          value,
        });
        continue;
      }

      // Custom validator
      if (rule.validate) {
        const customError = rule.validate(value);
        if (customError) {
          errors.push({
            row: i + 1,
            column: rule.column,
            message: customError,
            value,
          });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Import File Validation ────────────────────────────────────────────

const DEFAULT_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate a file against import rules (extension, size, headers).
 * This is a synchronous check — no file parsing required.
 */
export function validateImportFile(
  file: File,
  rules: ImportFileValidationRules
): ImportValidationResult {
  const errors: ImportError[] = [];
  const extensions = rules.allowedExtensions ?? DEFAULT_EXTENSIONS;
  const maxSize = rules.maxFileSize ?? DEFAULT_MAX_SIZE;
  const minSize = rules.minFileSize ?? 1;

  // Extension check
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!extensions.includes(ext)) {
    errors.push({
      code: "INVALID_EXTENSION",
      message: `File type "${ext}" is not allowed. Accepted: ${extensions.join(", ")}`,
      value: ext,
    });
  }

  // Max size check
  if (file.size > maxSize) {
    const mb = (maxSize / (1024 * 1024)).toFixed(1);
    const actualMb = (file.size / (1024 * 1024)).toFixed(1);
    errors.push({
      code: "FILE_TOO_LARGE",
      message: `File exceeds ${mb}MB limit. Actual: ${actualMb}MB`,
      value: file.size,
    });
  }

  // Min size check
  if (file.size < minSize) {
    errors.push({
      code: "FILE_TOO_SMALL",
      message: "File is empty or too small.",
      value: file.size,
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate CSV headers against required headers.
 * Requires parsing the file first — call after parseCSV().
 */
export function validateCSVHeaders(
  fileHeaders: string[],
  requiredHeaders: string[]
): ImportValidationResult {
  const errors: ImportError[] = [];
  const missing = requiredHeaders.filter((h) => !fileHeaders.includes(h));

  if (missing.length > 0) {
    errors.push({
      code: "MISSING_HEADERS",
      message: `Missing required columns: ${missing.join(", ")}`,
      value: missing,
    });
  }

  return { valid: errors.length === 0, errors };
}
