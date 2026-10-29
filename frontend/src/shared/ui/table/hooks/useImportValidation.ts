import { useCallback, useMemo, useState } from "react";

import { parseCSV } from "@ui/table/utils/csv";
import {
  type ImportError,
  type ImportFileValidationRules,
  validateCSVHeaders,
  validateImportFile,
} from "@ui/table/utils/validation";

/**
 * useImportValidation
 *
 * Pre-upload file validation hook.
 * Validates file extension, size, MIME type, and optional CSV headers.
 */

export interface UseImportValidationOptions {
  /** Allowed file extensions — default: [".csv", ".xlsx", ".xls"] */
  allowedExtensions?: string[];
  /** Max file size in bytes — default: 10MB */
  maxFileSize?: number;
  /** Min file size in bytes — default: 1 */
  minFileSize?: number;
  /** Required CSV headers — validated after parsing */
  requiredHeaders?: string[];
}

export function useImportValidation(options: UseImportValidationOptions = {}) {
  const [errors, setErrors] = useState<ImportError[]>([]);

  const rules: ImportFileValidationRules = useMemo(
    () => ({
      allowedExtensions: options.allowedExtensions,
      maxFileSize: options.maxFileSize,
      minFileSize: options.minFileSize,
      requiredHeaders: options.requiredHeaders,
    }),
    [
      options.allowedExtensions,
      options.maxFileSize,
      options.minFileSize,
      options.requiredHeaders,
    ]
  );

  /**
   * Validate a file. Returns the validation result.
   * For CSV files with requiredHeaders, parses the file to check headers.
   */
  const validateFile = useCallback(
    async (file: File): Promise<{ valid: boolean; errors: ImportError[] }> => {
      // Step 1: Synchronous checks (extension, size)
      const result = validateImportFile(file, rules);
      setErrors(result.errors);

      if (!result.valid) return result;

      // Step 2: CSV header check (async — requires parsing)
      if (rules.requiredHeaders && rules.requiredHeaders.length > 0) {
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (ext === ".csv") {
          try {
            const rows = await parseCSV<Record<string, unknown>>(file);
            if (rows.length > 0) {
              const fileHeaders = Object.keys(rows[0]);
              const headerResult = validateCSVHeaders(
                fileHeaders,
                rules.requiredHeaders
              );
              if (!headerResult.valid) {
                setErrors(headerResult.errors);
                return headerResult;
              }
            }
          } catch {
            // Parse error — let the server handle detailed validation
          }
        }
      }

      setErrors([]);
      return { valid: true, errors: [] };
    },
    [rules]
  );

  /** Clear all validation errors */
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  /** Quick check: is the file valid? */
  const isValid = errors.length === 0;

  return useMemo(
    () => ({
      validateFile,
      errors,
      isValid,
      clearErrors,
    }),
    [validateFile, errors, isValid, clearErrors]
  );
}
