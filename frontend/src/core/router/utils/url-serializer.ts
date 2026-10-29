/**
 * @file url-serializer.ts
 * @description Domain-driven URL query string serialization and deserialization.
 *
 * Clean Architecture (Port & Adapters):
 * - Core domain logic and UI components consume this adapter interface.
 * - ZERO native JSON.stringify or JSON.parse in query parameter handling.
 * - Keeps `:` and brackets human-readable (`encodeValuesOnly: true`).
 * - Safe primitive decoding: parses boolean ("true"/"false"), numbers, and arrays while preserving string codes.
 * - Prototype pollution defense enabled (`allowPrototypes: false`).
 */

export interface SerializeOptions {
  /** Mode for array serialization: 'repeat' (`a=1&a=2`), 'brackets' (`a[]=1`), or 'comma' (`a=1,2`). Default: 'repeat'. */
  arrayFormat?: "repeat" | "brackets" | "comma";
  /** Optional namespace prefix to prepend to all keys (e.g. `filters`). */
  prefix?: string;
  /** Skip null or undefined properties (default: true). */
  skipNulls?: boolean;
}

export interface DeserializeOptions {
  /** Mode for array deserialization: automatically splits comma strings if true. Default: true. */
  splitCommas?: boolean;
  /** Optional namespace prefix to strip when reading. */
  prefix?: string;
}

export interface QueryStringifyOptions {
  encodeValuesOnly?: boolean;
  skipNulls?: boolean;
  arrayFormat?: "repeat" | "brackets" | "comma";
  [key: string]: unknown;
}

export interface QueryParseOptions {
  ignoreQueryPrefix?: boolean;
  allowPrototypes?: boolean;
  splitCommas?: boolean;
  [key: string]: unknown;
}

/**
 * Coerces a raw URL string into a JavaScript primitive without JSON.parse.
 * Preserves leading zeroes for string codes (e.g. "007" remains string "007").
 */
export function parseQueryPrimitive(raw: string): string | number | boolean {
  if (raw === "true") return true;
  if (raw === "false") return false;

  // Strict integer or decimal pattern (disallows leading zeros for multi-digit integers to preserve codes)
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(raw)) {
    const num = Number(raw);
    if (!Number.isNaN(num) && Number.isFinite(num)) {
      return num;
    }
  }

  return raw;
}

/**
 * Parses a comma-delimited string or multi-value array into an array of typed primitives.
 */
export function parseQueryArray(
  raw: string | string[]
): (string | number | boolean)[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => parseQueryPrimitive(item));
  }
  if (!raw || raw.trim() === "") return [];
  return raw.split(",").map((item) => parseQueryPrimitive(item.trim()));
}

/**
 * Serializes a single primitive value into a URL-safe string representation.
 * Returns null for empty/null/undefined to indicate removal.
 */
export function serializeQueryPrimitive(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return String(value);
  }
  return String(value);
}

/**
 * High-level stringifier.
 * Keeps `:` and brackets unencoded for clean readability.
 */
export function stringifyQuery(
  obj: Record<string, any>,
  options: QueryStringifyOptions = {}
): string {
  const { skipNulls = true, arrayFormat = "repeat" } = options;
  const entries = serializeObjectToEntries(obj, { skipNulls, arrayFormat });
  const searchParams = new URLSearchParams();

  Object.entries(entries).forEach(([key, val]) => {
    if (val === null || val === undefined) return;
    if (Array.isArray(val)) {
      val.forEach((item) => {
        if (item !== null && item !== undefined) searchParams.append(key, String(item));
      });
    } else {
      searchParams.append(key, String(val));
    }
  });

  // Decode brackets and colons for human-readable URLs
  return searchParams
    .toString()
    .replace(/%5B/gi, "[")
    .replace(/%5D/gi, "]")
    .replace(/%3A/gi, ":");
}

/**
 * High-level parser.
 * Automatically decodes primitives into boolean, numbers, and strings with prototype pollution protection.
 */
export function parseQuery<T = Record<string, any>>(
  queryString: string | URLSearchParams,
  options: QueryParseOptions = {}
): T {
  const raw =
    queryString instanceof URLSearchParams
      ? queryString.toString()
      : typeof queryString === "string"
        ? queryString.startsWith("?") && options.ignoreQueryPrefix !== false
          ? queryString.slice(1)
          : queryString
        : "";

  const params = new URLSearchParams(raw);
  return deserializeEntriesToObject(params, {
    splitCommas: options.splitCommas ?? true,
  }) as T;
}

/**
 * Recursively flattens an object or state record into URL parameter entries using bracket notation.
 * Used by PlatformUrlPort.set() to merge state updates non-destructively.
 */
export function serializeObjectToEntries(
  obj: Record<string, any>,
  options: SerializeOptions = {}
): Record<string, string | string[] | null> {
  const result: Record<string, string | string[] | null> = {};
  const { arrayFormat = "repeat", prefix = "" } = options;

  function flatten(current: any, propPath: string) {
    if (current === null || current === undefined || current === "") {
      if (propPath) result[propPath] = null;
      return;
    }

    if (Array.isArray(current)) {
      if (current.length === 0) {
        result[propPath] = null;
        return;
      }
      if (arrayFormat === "comma") {
        const joined = current
          .map((item) => serializeQueryPrimitive(item))
          .filter((v): v is string => v !== null)
          .join(",");
        result[propPath] = joined || null;
      } else {
        result[propPath] = current
          .map((item) => serializeQueryPrimitive(item))
          .filter((v): v is string => v !== null);
      }
      return;
    }

    if (typeof current === "object" && !(current instanceof Date)) {
      Object.entries(current).forEach(([k, v]) => {
        // Defense against prototype pollution
        if (k === "__proto__" || k === "constructor" || k === "prototype") return;
        const nextPath = propPath ? `${propPath}[${k}]` : k;
        flatten(v, nextPath);
      });
      return;
    }

    // Primitive value
    const serialized = serializeQueryPrimitive(current);
    if (propPath) {
      result[propPath] = serialized;
    }
  }

  flatten(obj, prefix);
  return result;
}

/**
 * Reconstructs a nested object from URLSearchParams supporting bracket notation and typed primitives.
 */
export function deserializeEntriesToObject(
  params: URLSearchParams,
  options: DeserializeOptions = {}
): Record<string, any> {
  const { splitCommas = true, prefix = "" } = options;
  const result: Record<string, any> = {};

  params.forEach((value, key) => {
    let effectiveKey = key;
    if (prefix) {
      if (!key.startsWith(`${prefix}[`) && !key.startsWith(`${prefix}_`) && key !== prefix) {
        return;
      }
      if (key.startsWith(`${prefix}[`)) {
        effectiveKey = key.slice(prefix.length);
        if (effectiveKey.startsWith("[") && effectiveKey.endsWith("]")) {
          effectiveKey = effectiveKey.slice(1, -1);
        }
      } else if (key.startsWith(`${prefix}_`)) {
        effectiveKey = key.slice(prefix.length + 1);
      }
    }

    // Defense against prototype pollution
    if (effectiveKey.includes("__proto__") || effectiveKey.includes("constructor") || effectiveKey.includes("prototype")) {
      return;
    }

    const parsedValue =
      splitCommas && value.includes(",")
        ? parseQueryArray(value)
        : parseQueryPrimitive(value);

    // Handle bracket paths e.g. "filter[status]" or "users[0][name]"
    const parts = effectiveKey.split(/\[|\]/).filter(Boolean);
    if (parts.length === 0) return;

    let target = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part === "__proto__" || part === "constructor" || part === "prototype") return;
      if (!(part in target) || typeof target[part] !== "object" || target[part] === null) {
        const nextPart = parts[i + 1];
        target[part] = /^\d+$/.test(nextPart) ? [] : {};
      }
      target = target[part];
    }

    const lastPart = parts[parts.length - 1];
    if (lastPart === "__proto__" || lastPart === "constructor" || lastPart === "prototype") return;

    if (lastPart in target) {
      if (Array.isArray(target[lastPart])) {
        target[lastPart].push(parsedValue);
      } else {
        target[lastPart] = [target[lastPart], parsedValue];
      }
    } else {
      target[lastPart] = parsedValue;
    }
  });

  return result;
}
