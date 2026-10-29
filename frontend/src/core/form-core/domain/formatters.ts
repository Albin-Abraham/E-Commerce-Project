/**
 * @file formatters.ts
 * @description Framework-free domain value formatters for the form engine.
 *
 * Implements deterministic formatting for currencies, dates, numbers, booleans,
 * and options without dependencies on React, the DOM, or UI libraries.
 *
 * @module DomainFormatters
 */

/**
 * Formats a numeric value into a localized currency string.
 *
 * @param value - Raw scalar value (number or numeric string).
 * @param currency - ISO 4217 currency code (e.g., "USD", "EUR", "JPY", "INR"). Defaults to "USD".
 * @param locale - BCP 47 language tag (e.g., "en-US", "de-DE"). Defaults to "en-US".
 */
export function formatCurrencyValue(
  value: unknown,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num)) {
    return String(value);
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(num);
  } catch {
    // Fallback if invalid currency code was passed
    return `${currency} ${num.toFixed(2)}`;
  }
}

/**
 * Formats a date value into a localized date or datetime string.
 *
 * @param value - Date instance, timestamp number, or ISO date string.
 * @param format - Format style: "date" | "datetime" | "time" | string pattern.
 * @param locale - BCP 47 language tag. Defaults to "en-US".
 */
export function formatDateValue(
  value: unknown,
  format: string = "date",
  locale: string = "en-US"
): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value as string | number);
  if (isNaN(date.getTime())) {
    return String(value);
  }

  try {
    if (format === "datetime" || format === "timestamp") {
      return date.toLocaleString(locale);
    }
    if (format === "time") {
      return date.toLocaleTimeString(locale);
    }
    return date.toLocaleDateString(locale);
  } catch {
    return date.toLocaleDateString();
  }
}

/**
 * Formats a generic numeric value with precision and grouping.
 */
export function formatNumberValue(
  value: unknown,
  options?: Intl.NumberFormatOptions,
  locale: string = "en-US"
): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num)) {
    return String(value);
  }

  try {
    return new Intl.NumberFormat(locale, options).format(num);
  } catch {
    return String(num);
  }
}

/**
 * Formats a boolean value with semantic labels.
 */
export function formatBooleanValue(
  value: unknown,
  labels?: { trueLabel?: string; falseLabel?: string }
): { isTrue: boolean; label: string } {
  const isTrue =
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1" ||
    value === "yes";

  const label = isTrue
    ? labels?.trueLabel || "Yes"
    : labels?.falseLabel || "No";

  return { isTrue, label };
}

/**
 * Resolves the display label for a scalar value from a list of options.
 */
export function resolveOptionLabel(
  value: unknown,
  options?: ReadonlyArray<{ value: unknown; label: string | any }>
): string | undefined {
  if (!options || options.length === 0 || value === undefined || value === null) {
    return undefined;
  }

  const match = options.find((opt) => String(opt.value) === String(value));
  if (!match) return undefined;

  if (typeof match.label === "string") {
    return match.label;
  }

  if (typeof match.label === "object" && match.label !== null) {
    // If it is a localized object { en: "..." }
    const localized = (match.label as Record<string, string>).en || (match.label as Record<string, string>).default;
    if (localized) return localized;
  }

  return String(match.label ?? match.value);
}
