import type { ParseError, ParseResult } from "@ui/table/types";

/**
 * ParseResult helpers
 *
 * Every URL parser returns ParseResult<T> — a discriminated union.
 * Never throws. Never returns null.
 */

export function ok<T>(value: T): ParseResult<T> {
  return { ok: true, value };
}

export function fail(
  field: string,
  raw: string,
  code: ParseError["code"],
  message?: string
): ParseResult<never> {
  return {
    ok: false,
    error: {
      code,
      field,
      raw,
      message: message ?? `[TableUrl.${field}] ${code}: "${raw}"`,
    },
  };
}

export type { ParseResult, ParseError };
