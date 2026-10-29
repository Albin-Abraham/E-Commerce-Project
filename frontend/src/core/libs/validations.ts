/**
 * Centralized Verification Logic & RegExp Library
 * Single Source of Truth for Form Patterns and Rules
 */

export const PATTERNS = {
  // RFC 5322 Email Regex (from email-validator library)
  EMAIL:
    /^[-!#$%&'*+/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/,

  // International Phone Format (allows +, spaces, dashes, parens)
  // Matches: +1 (555) 123-4567, 555-123-4567, 1234567890
  PHONE: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,

  // URL containing protocol
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,

  // Alphanumeric
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,

  // Numeric only
  NUMERIC: /^[0-9]+$/,

  // UUID v4
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};

/**
 * Standardized Validator Functions
 * Can be used by ValidationProxy or external schemas
 */
export const VALIDATORS = {
  isValidEmail: (val: any) =>
    typeof val === "string" && PATTERNS.EMAIL.test(val),
  isValidPhone: (val: any) =>
    typeof val === "string" && PATTERNS.PHONE.test(val),
  isValidUrl: (val: any) => typeof val === "string" && PATTERNS.URL.test(val),
  isNumeric: (val: any) => !isNaN(parseFloat(val)) && isFinite(val),
};

/**
 * Helper to determine if a country-specific rule applies
 * @param countryCode e.g. "US", "IN"
 * @returns Specific regex pattern if available
 */
export function getPhonePatternForCountry(countryCode: string): RegExp {
  switch (countryCode.toUpperCase()) {
    case "IN": // India: +91 optional, 10 digits
      return /^(\+91[-\s]?)?[0]?(91)?[789]\d{9}$/;
    case "US": // US: (123) 456-7890
      return /^(\+1[-. ]?)?(\(?\d{3}\)?[-. ]?)?\d{3}[-. ]?\d{4}$/;
    default:
      return PATTERNS.PHONE;
  }
}
