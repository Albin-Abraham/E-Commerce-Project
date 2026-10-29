import * as Papa from "papaparse";

/**
 * CSV Utilities
 *
 * Browser-compatible CSV parsing and generation using papaparse.
 * Ported from yafei-healthcare-frontend/src/utils/csv.ts.
 */

/** Characters that can trigger formula injection in spreadsheet apps */
const DANGEROUS_PREFIXES = /^[\s]*[=+\-@\t\r]/;

/**
 * Sanitize a CSV cell value to prevent formula injection.
 * Prefixes dangerous values with a single quote to neutralize them.
 * Reference: https://owasp.org/www-community/attacks/CSV_Injection
 */
function sanitizeCsvValue(value: unknown): string {
  const str = String(value ?? "");
  if (DANGEROUS_PREFIXES.test(str)) {
    return `'${str}`;
  }
  return str;
}

export function parseCSV<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as T[]),
      error: (error) => reject(error),
    });
  });
}

/** Sanitize all string values in a row for CSV injection safety */
function sanitizeRow(row: Record<string, unknown>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    sanitized[key] = sanitizeCsvValue(value);
  }
  return sanitized;
}

export function generateCSV(data: unknown[]): Promise<string> {
  return new Promise((resolve) => {
    const sanitized = data.map((row) =>
      typeof row === "object" && row !== null
        ? sanitizeRow(row as Record<string, unknown>)
        : sanitizeCsvValue(row)
    );
    resolve(Papa.unparse(sanitized));
  });
}

export function generateCSVFast(data: unknown[]): Promise<string> {
  return new Promise((resolve) => {
    const sanitized = data.map((row) =>
      typeof row === "object" && row !== null
        ? sanitizeRow(row as Record<string, unknown>)
        : sanitizeCsvValue(row)
    );
    resolve(
      Papa.unparse(sanitized, {
        header: true,
        skipEmptyLines: true,
      })
    );
  });
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
