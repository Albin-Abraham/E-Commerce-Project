import {
  formatBooleanValue,
  formatCurrencyValue,
  formatDateValue,
  resolveOptionLabel,
} from "@form-core/domain/formatters";

import type { NormalizedDisplayModel } from "../types";

/**
 * Strict protocol allowlist for user/entity-provided links.
 * Blocks dangerous schemes like javascript:, data:, vbscript: to prevent XSS.
 */
export function isSafeUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed || trimmed.startsWith("//")) return false;
  // Relative internal URLs starting with / (e.g. /profile/123) are safe
  if (trimmed.startsWith("/")) return true;
  // Absolute URLs must be valid and use http: or https:
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates email strings to prevent CRLF injection and malicious payloads in mailto links.
 */
export function isSafeEmail(val: unknown): boolean {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  return !/[\r\n<>"\s]/.test(trimmed) && trimmed.includes("@");
}

/**
 * Validates phone strings for tel: links.
 */
export function isSafePhone(val: unknown): boolean {
  if (typeof val !== "string") return false;
  return /^[+0-9\s()./-]+$/.test(val.trim());
}

/**
 * Pure domain normalizer for display values.
 * Maps raw entity values and metadata into a typed NormalizedDisplayModel
 * with zero UI coupling, enabling direct unit testability.
 */
export function normalizeDisplayModel(
  value: unknown,
  type?: string,
  options?: readonly any[],
  format?: string,
  currency?: string,
  locale: string = "en-US",
  emptyPlaceholder: string = "—"
): NormalizedDisplayModel {
  if (value === null || value === undefined || value === "") {
    return { kind: "empty", text: emptyPlaceholder };
  }

  // 1. Boolean format
  if (
    typeof value === "boolean" ||
    type === "checkbox" ||
    type === "switch"
  ) {
    const { isTrue } = formatBooleanValue(value);
    return { kind: "boolean", value: Boolean(value), isTrue };
  }

  // 2. Select / Radio option mapping
  if (options && options.length > 0) {
    const selectedOption = options.find(
      (opt: any) => String(opt.value) === String(value)
    );
    const resolved = resolveOptionLabel(value, options);
    if (resolved !== undefined) {
      return {
        kind: "option",
        label: resolved,
        icon: selectedOption?.icon,
      };
    }
  }

  // 3. Email link
  if (type === "email" || format === "email") {
    const str = String(value);
    return {
      kind: "email",
      href: `mailto:${str}`,
      label: str,
      isSafe: isSafeEmail(str),
    };
  }

  // 4. Phone link
  if (type === "phone" || format === "phone") {
    const str = String(value);
    return {
      kind: "phone",
      href: `tel:${str}`,
      label: str,
      isSafe: isSafePhone(str),
    };
  }

  // 5. URL link
  if (type === "url" || type === "link" || format === "url") {
    const str = String(value);
    return {
      kind: "url",
      href: str,
      label: str,
      isSafe: isSafeUrl(str),
    };
  }

  // 6. Image / Avatar preview
  if (type === "image" || type === "avatar") {
    return { kind: "image", src: String(value) };
  }

  // 7. Array of items / tags
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { kind: "empty", text: emptyPlaceholder };
    }
    return { kind: "array", items: value };
  }

  // 8. Currency
  if (type === "currency" || format === "currency") {
    const formatted = formatCurrencyValue(value, currency || "USD", locale);
    return { kind: "currency", text: formatted };
  }

  // 9. Date
  if (type === "date" || format === "date") {
    const formatted = formatDateValue(value, "date", locale);
    return { kind: "date", text: formatted };
  }

  // Default string/number
  return { kind: "text", text: String(value) };
}
