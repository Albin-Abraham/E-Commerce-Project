/**
 * @file validation-registry.ts
 * @description Strategy registry for built-in field validation rules.
 *
 * ## Pattern: Strategy + Registry (GoF)
 * Each validation rule type (`"required"`, `"min"`, `"email"`, etc.) is implemented
 * as a `ValidationStrategy` object with two responsibilities:
 * - `validate()` — returns `true` if the value is valid, `false` otherwise.
 * - `defaultMessage()` — returns the human-readable error string for this rule.
 *
 * Strategies are registered in `ValidationRegistry` (a plain object map) and
 * looked up by rule type at runtime by {@link ValidationProxy}.
 *
 * ## Extension via OCP
 * New rule types can be added at runtime without touching this file:
 * ```ts
 * registerValidationStrategy("phone", {
 *   validate: (value) => PATTERNS.PHONE.test(value),
 *   defaultMessage: (rule, field) => `${field.label} must be a valid phone number`
 * });
 * ```
 *
 * ## Built-in strategies
 * | Key         | Alias for | Behaviour                                        |
 * |-------------|-----------|--------------------------------------------------|
 * | `required`  | —         | Value must be non-null, non-undefined, non-empty |
 * | `min`       | —         | String/array length ≥ N, or number ≥ N           |
 * | `minLength` | `min`     | Alias for `min`                                  |
 * | `max`       | —         | String/array length ≤ N, or number ≤ N           |
 * | `maxLength` | `max`     | Alias for `max`                                  |
 * | `email`     | —         | Must match `PATTERNS.EMAIL` regex                |
 * | `pattern`   | —         | Must match a named PATTERN or literal regex      |
 */
import * as EmailValidator from "email-validator";
import isAlpha from "validator/lib/isAlpha";
import isAlphanumeric from "validator/lib/isAlphanumeric";
import isIP from "validator/lib/isIP";
import isNumeric from "validator/lib/isNumeric";
import isPostalCode from "validator/lib/isPostalCode";
import isURL from "validator/lib/isURL";

import { PATTERNS } from "@libs/validations";

import type { FormField, ValidationRule } from "./domain";

// ============================================================================
//  STRATEGY INTERFACE
// ============================================================================

/**
 * Contract for a single validation rule strategy.
 *
 * Implementations are stateless objects — they receive all context via
 * parameters and return a boolean/string with no side effects.
 *
 * @example
 * const PhoneStrategy: ValidationStrategy = {
 *   validate: (value) => !value || PATTERNS.PHONE.test(value),
 *   defaultMessage: (rule, field) => `${field.label} must be a valid phone number`,
 * };
 */
export interface ValidationStrategy {
  /**
   * Checks whether a value satisfies this rule.
   *
   * @param value  - The current field value.
   * @param rule   - The full rule definition (includes `type`, `value`, optional `message`).
   * @param field  - The full field definition (useful for label in error messages).
   * @param values - **[2E]** The full form values snapshot (optional). Available for
   *   strategies that need to compare against sibling fields (e.g., `matches`).
   * @returns `true` if the value is valid; `false` if the rule is violated.
   */
  validate: (
    value: any,
    rule: ValidationRule,
    field: FormField,
    values?: any
  ) => boolean | Promise<boolean>;

  /**
   * Returns the default error message for a rule violation.
   *
   * @param rule  - The rule definition (carries e.g. `min` value for the message).
   * @param field - The field definition (provides `label` or `name` for the message).
   * @returns Human-readable error string shown to the user.
   */
  defaultMessage: (rule: ValidationRule, field: FormField) => string;

  /**
   * Optional sanitizer, applied to a candidate value *before* it is written to
   * form state when `disableDeferredValidation` is enabled.
   *
   * Only implement this for rules whose allowed character set is well defined
   * and safely invertible — character-class rules such as `alphanumeric`,
   * `digitsOnly` and `alphaOnly`. Arbitrary-regex rules (e.g. `pattern`) should
   * omit it, because a regex cannot be reliably inverted into a filter.
   *
   * @param value  - The incoming value, before any write.
   * @param rule   - The full rule definition (carries `value`, e.g. `ignore` chars).
   * @param field  - The full field definition.
   * @returns The sanitized value to store. Returning `value` unchanged is valid.
   */
  sanitize?: (value: any, rule: ValidationRule, field: FormField) => any;
}

// ============================================================================
//  SHARED HELPER
// ============================================================================

/**
 * Checks whether a value is considered "present" (non-null, non-undefined, non-empty-string).
 * Used consistently across strategies to avoid duplicating the empty-check logic.
 *
 * @param value - Any form field value.
 * @returns `true` if the value is meaningfully present.
 */
const hasValue = (value: any): boolean => {
  return value !== null && value !== undefined && value !== "";
};

// ============================================================================
//  BUILT-IN STRATEGIES
// ============================================================================

/**
 * **`required`** — Fails if the value is null, undefined, or empty string.
 * Also used implicitly when `field.required === true` (shorthand).
 */
const RequiredStrategy: ValidationStrategy = {
  validate: (value) => hasValue(value),
  defaultMessage: (_rule, field) => `${field.label || field.name} is required`,
};

/**
 * **`min` / `minLength`** — Enforces a minimum value or length.
 *
 * Behaviour by value type:
 * - `string` → minimum character count (`.length >= rule.value`)
 * - `Array`  → minimum item count (`.length >= rule.value`)
 * - `number` → minimum numeric value (`>= rule.value`)
 * - `null/undefined` → treated as 0 for numeric context, or fails for others
 */
const MinStrategy: ValidationStrategy = {
  validate: (value, rule) => {
    // No value: treat as length 0 for string/array context, or 0 for numeric
    if (!hasValue(value)) {
      if (typeof rule.value === "number") {
        return 0 >= rule.value; // e.g. min: 0 → still valid
      }
      return false; // Empty string/null fails min check for non-numeric
    }

    if (typeof value === "string" || Array.isArray(value)) {
      return value.length >= rule.value;
    }
    if (typeof value === "number") {
      return value >= rule.value;
    }
    return true; // Unknown types pass silently
  },
  defaultMessage: (rule, field) => {
    return `${field.label || field.name} must be at least ${rule.value}`;
  },
};

/**
 * **`max` / `maxLength`** — Enforces a maximum value or length.
 *
 * Behaviour by value type:
 * - `string` → maximum character count (`.length <= rule.value`)
 * - `Array`  → maximum item count (`.length <= rule.value`)
 * - `number` → maximum numeric value (`<= rule.value`)
 * - Empty/null values **pass** this check (use `required` to enforce presence).
 */
const MaxStrategy: ValidationStrategy = {
  validate: (value, rule) => {
    // Empty values pass max — max is about "not too much", not "must have something"
    if (!hasValue(value)) return true;

    if (typeof value === "string" || Array.isArray(value)) {
      return value.length <= rule.value;
    }
    if (typeof value === "number") {
      return value <= rule.value;
    }
    return true;
  },
  defaultMessage: (rule, field) =>
    `${field.label || field.name} must be at most ${rule.value}`,
};

/**
 * **`email`** — Value must be a syntactically valid email address.
 *
 * Uses `PATTERNS.EMAIL` from the shared validations library.
 * Empty values **pass** this check (combine with `required` to enforce presence).
 */
const EmailStrategy: ValidationStrategy = {
  validate: (value) => {
    // Empty is OK — combine with `required` if email is mandatory
    if (!hasValue(value)) return true;
    return typeof value === "string" && EmailValidator.validate(value);
  },
  defaultMessage: (_rule, field) =>
    `${field.label || field.name} must be a valid email`,
};

/**
 * **`phone`** — Value must be a valid phone number.
 * Uses `PATTERNS.PHONE` from the shared validations library.
 */
const PhoneStrategy: ValidationStrategy = {
  validate: async (value) => {
    if (!hasValue(value)) return true;
    try {
      // Dynamic import for modern, lightweight, tree-shaken library
      const { isValidPhoneNumber } = await import("libphonenumber-js");
      return isValidPhoneNumber(String(value), "US");
    } catch {
      return false;
    }
  },
  defaultMessage: (_rule, field) =>
    `${field.label || field.name} must be a valid phone number`,
};

/**
 * **`pattern`** — Value must match a regex pattern.
 *
 * `rule.value` can be:
 * 1. A **named pattern key** from `PATTERNS` (e.g., `"PHONE"`, `"EMAIL"`)
 *    → looked up from the `PATTERNS` object.
 * 2. A **raw regex string** (e.g., `"^[A-Z]+"`)
 *    → wrapped in `new RegExp(rule.value)`.
 *
 * Empty values **pass** this check.
 *
 * @example
 * // Named pattern:
 * { type: "pattern", value: "PHONE" }
 *
 * // Raw regex:
 * { type: "pattern", value: "^[A-Z]{2,4}$" }
 */
const PatternStrategy: ValidationStrategy = {
  validate: (value, rule) => {
    // Empty is OK — combine with `required` if presence is mandatory
    if (!hasValue(value)) return true;

    let regex: RegExp;

    // 1. Try named pattern from lib
    if (
      typeof rule.value === "string" &&
      PATTERNS[rule.value as keyof typeof PATTERNS]
    ) {
      regex = PATTERNS[rule.value as keyof typeof PATTERNS];
    } else {
      // 2. Treat as raw regex string
      regex = new RegExp(rule.value);
    }

    return regex.test(String(value));
  },
  defaultMessage: () => "Invalid format",
};

/**
 * **`alphanumeric`** — Value must contain only letters and numbers.
 *
 * `sanitize` strips everything else (`_`, `,`, `#`, punctuation, whitespace),
 * so `J0hn_Doe,#` is stored as `J0hnDoe`.
 */
const AlphanumericStrategy: ValidationStrategy = {
  validate: (value) => {
    if (!hasValue(value)) return true;
    return isAlphanumeric(String(value));
  },

  sanitize: (value) =>
    hasValue(value) ? String(value).replace(/[^\p{L}\p{N}]/gu, "") : value,
  defaultMessage: (_rule, field) =>
    `${field.label || field.name} must contain only letters and numbers`,
};

/**
 * **`digitsOnly`** — Value must contain only numbers.
 */
const DigitsOnlyStrategy: ValidationStrategy = {
  validate: (value) => {
    if (!hasValue(value)) return true;
    return isNumeric(String(value), { no_symbols: true });
  },
  sanitize: (value) =>
    hasValue(value) ? String(value).replace(/\D/g, "") : value,
  defaultMessage: (_rule, field) =>
    `${field.label || field.name} must contain only digits`,
};

/**
 * **`alphaOnly`** — Value must contain only letters.
 */
const AlphaOnlyStrategy: ValidationStrategy = {
  validate: (value, rule) => {
    if (!hasValue(value)) return true;
    // Allow passing characters to ignore (like spaces for names) via rule.value
    const ignore = typeof rule.value === "string" ? rule.value : undefined;
    return isAlpha(String(value), "en-US", { ignore });
  },
  // Mirrors `ignore` from validate() so a space is kept for names when allowed.
  sanitize: (value, rule) => {
    if (!hasValue(value)) return value;
    const ignore = typeof rule.value === "string" ? rule.value : "";
    const allowed = ignore.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
    return String(value).replace(new RegExp(`[^\\p{L}${allowed}]`, "gu"), "");
  },
  defaultMessage: (_rule, field) =>
    `${field.label || field.name} must contain only letters`,
};

/**
 * **`url`** — Value must be a valid URL.
 */
const UrlStrategy: ValidationStrategy = {
  validate: (value) => {
    if (!hasValue(value)) return true;
    return isURL(String(value));
  },
  defaultMessage: (_rule, field) =>
    `${field.label || field.name} must be a valid URL`,
};

/**
 * **`ip`** — Value must be a valid IP address (v4 or v6).
 */
const IpStrategy: ValidationStrategy = {
  validate: (value) => {
    if (!hasValue(value)) return true;
    return isIP(String(value));
  },
  defaultMessage: (_rule, field) =>
    `${field.label || field.name} must be a valid IP address`,
};

/**
 * **`postalCode`** — Value must be a valid postal code.
 */
const PostalCodeStrategy: ValidationStrategy = {
  validate: (value) => {
    if (!hasValue(value)) return true;
    // Default to 'any' locale if not specified
    return isPostalCode(String(value), "any");
  },
  defaultMessage: (_rule, field) =>
    `${field.label || field.name} must be a valid postal code`,
};

/**
 * **`date`** — Value must be a valid date string (ISO 8601 or parseable by Date).
 *
 * `rule.value` can be an optional format hint (e.g., `"YYYY-MM-DD"`).
 * Empty values pass this check.
 */
const DateStrategy: ValidationStrategy = {
  validate: (value) => {
    if (!hasValue(value)) return true;
    const str = String(value);
    // ISO 8601 date regex: YYYY-MM-DD (with optional time)
    const isoDateRegex =
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
    if (isoDateRegex.test(str)) {
      const parsed = new Date(str);
      return !isNaN(parsed.getTime());
    }
    // Fallback: try Date.parse
    const parsed = Date.parse(str);
    return !isNaN(parsed);
  },
  defaultMessage: (_rule, field) =>
    `${field.label || field.name} must be a valid date`,
};

/**
 * **`time`** — Value must be a valid time string (HH:MM, 24-hour format).
 * Empty values pass this check.
 */
const TimeStrategy: ValidationStrategy = {
  validate: (value) => {
    if (!hasValue(value)) return true;
    const str = String(value);
    // HH:MM or HH:MM:SS
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
    return timeRegex.test(str);
  },
  defaultMessage: (_rule, field) =>
    `${field.label || field.name} must be a valid time (HH:MM)`,
};

/**
 * **`custom`** — Escape hatch for rule logic the registry does not cover.
 *
 * Runs {@link ValidationRule.fn}, which may be sync or async and may return a
 * boolean or a string (a string is treated as failure). A rule with no `fn`
 * passes, so a malformed rule never blocks a form.
 */
const CustomStrategy: ValidationStrategy = {
  validate: async (value, rule, field, values) => {
    const fn = rule.fn;
    if (typeof fn !== "function") return true;
    try {
      const result = await fn(value, values);
      // A returned string is treated as failure carrying its own message.
      return typeof result === "string" ? false : result !== false;
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          `[ValidationRegistry] custom rule for "${field?.name}" threw:`,
          e
        );
      }
      return false;
    }
  },
  defaultMessage: (_rule, field) =>
    `${field.label || field.name} failed custom validation`,
};

/**
 * **`uuid`** — Value must be a valid UUID v4.
 * Empty values pass this check.
 */
const UuidStrategy: ValidationStrategy = {
  validate: (value) => {
    if (!hasValue(value)) return true;
    const str = String(value);
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  },
  defaultMessage: (_rule, field) =>
    `${field.label || field.name} must be a valid UUID`,
};

/**
 * **`fileSize`** — File value must be within the size limit.
 *
 * `rule.value` is the maximum size in bytes.
 * Works with `File` objects or numeric byte values.
 * Empty values pass this check.
 */
const FileSizeStrategy: ValidationStrategy = {
  validate: (value, rule) => {
    if (!hasValue(value)) return true;
    const maxBytes = Number(rule.value);
    if (Number.isNaN(maxBytes)) return true;
    // Handle File objects (browser)
    if (typeof File !== "undefined" && value instanceof File) {
      return value.size <= maxBytes;
    }
    // Handle numeric byte values
    if (typeof value === "number") {
      return value <= maxBytes;
    }
    return true;
  },
  defaultMessage: (rule, field) => {
    const bytes = Number(rule.value);
    if (bytes >= 1048576) {
      return `${field.label || field.name} must be at most ${(bytes / 1048576).toFixed(1)} MB`;
    }
    if (bytes >= 1024) {
      return `${field.label || field.name} must be at most ${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${field.label || field.name} must be at most ${bytes} bytes`;
  },
};

/**
 * **`fileType`** — File value must have an allowed MIME type.
 *
 * `rule.value` is a comma-separated list of allowed MIME types
 * (e.g., `"image/png,image/jpeg,application/pdf"`)
 * or file extensions (e.g., `".png,.jpg,.pdf"`).
 *
 * Works with `File` objects (browser).
 * Empty values pass this check.
 */
const FileTypeStrategy: ValidationStrategy = {
  validate: (value, rule) => {
    if (!hasValue(value)) return true;
    if (typeof File === "undefined" || !(value instanceof File)) return true;
    const allowed = String(rule.value || "")
      .split(",")
      .map((s) => s.trim().toLowerCase());
    if (allowed.length === 0) return true;
    const fileType = value.type?.toLowerCase() || "";
    const fileName = value.name?.toLowerCase() || "";
    return allowed.some((accept) => {
      if (accept.startsWith(".")) {
        return fileName.endsWith(accept);
      }
      if (accept.endsWith("/*")) {
        const prefix = accept.slice(0, -2);
        return fileType.startsWith(prefix + "/");
      }
      return fileType === accept;
    });
  },
  defaultMessage: (_rule, field) =>
    `${field.label || field.name} has an invalid file type`,
};

/**
 * **`matches` / `match`** — Value must match the value of a target field (sibling field).
 *
 * Commonly used for password confirmation (e.g. `confirmPassword` matching `password`).
 * `rule.value` is the target field name (e.g. `"password"`).
 * If `rule.value` is a RegExp, it tests regex.
 */
const MatchesStrategy: ValidationStrategy = {
  validate: (value, rule, _field, values) => {
    if (!hasValue(value)) return true;
    if (
      typeof rule.value === "string" &&
      values &&
      typeof values === "object"
    ) {
      const targetValue = values[rule.value];
      return value === targetValue;
    }
    if (rule.value instanceof RegExp) {
      return rule.value.test(String(value));
    }
    return true;
  },
  defaultMessage: (rule, field) => {
    const target =
      typeof rule.value === "string" ? rule.value : "matching field";
    return `${field.label || field.name} must match ${target}`;
  },
};

// ============================================================================
//  REGISTRY
// ============================================================================

/**
 * The central registry mapping rule type strings to their `ValidationStrategy` implementations.
 *
 * Populated with built-in strategies at module load time.
 * Extended at runtime via {@link registerValidationStrategy}.
 *
 * Looked up in:
 * - {@link ValidationProxy.getMessage} — to get the default message.
 * - {@link ValidationProxy.validate} — to call the strategy's `validate()` function.
 */
export const ValidationRegistry: Record<string, ValidationStrategy> = {
  required: RequiredStrategy,
  min: MinStrategy,
  minLength: MinStrategy, // Alias: schema authors may use either
  max: MaxStrategy,
  maxLength: MaxStrategy, // Alias: schema authors may use either
  email: EmailStrategy,
  phone: PhoneStrategy,
  pattern: PatternStrategy,
  alphanumeric: AlphanumericStrategy,
  digitsOnly: DigitsOnlyStrategy,
  alphaOnly: AlphaOnlyStrategy,
  url: UrlStrategy,
  ip: IpStrategy,
  postalCode: PostalCodeStrategy,
  date: DateStrategy,
  time: TimeStrategy,
  uuid: UuidStrategy,
  fileSize: FileSizeStrategy,
  fileType: FileTypeStrategy,
  matches: MatchesStrategy,
  match: MatchesStrategy,
  custom: CustomStrategy,
};

// ============================================================================
//  PUBLIC EXTENSION API
// ============================================================================

/**
 * Registers a custom validation strategy under a new or existing rule type key.
 *
 * Follows the **Open/Closed Principle** — add new rules without modifying this file.
 * Call this once at app initialization (e.g., in your form bootstrap or plugin setup).
 *
 * @param name     - The rule type string used in your field schema (e.g., `"phone"`, `"ssn"`).
 * @param strategy - The {@link ValidationStrategy} implementation for this rule.
 *
 * @example
 * registerValidationStrategy("phone", {
 *   validate: (value) => !value || /^\+?[\d\s\-()]{7,15}$/.test(value),
 *   defaultMessage: (rule, field) => `${field.label} must be a valid phone number`
 * });
 *
 * // Then in your field schema:
 * { type: "phone", message: "Custom phone message (optional)" }
 */
export function registerValidationStrategy(
  name: string,
  strategy: ValidationStrategy
) {
  ValidationRegistry[name] = strategy;
}
