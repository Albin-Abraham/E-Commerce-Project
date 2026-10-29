import { z } from "zod";

/**
 * Zod-Driven URL Search Parameter Codec Utility
 *
 * Safely parses, validates, and serializes search parameters to achieve
 * resilient deep-linking and URL-synced UI state machines.
 */

/**
 * Parses and validates search params against a Zod schema with safety fallbacks.
 * Handles arrays, numbers, booleans, and empty/default states gracefully.
 *
 * @param schema Zod object schema representing the expected parameters
 * @param searchParams URLSearchParams object (e.g. from react-router-dom)
 */
export function parseSearchParams<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  searchParams: URLSearchParams
): z.infer<z.ZodObject<T>> {
  const paramsObj: Record<string, any> = {};

  searchParams.forEach((value, key) => {
    // If param already exists, treat it as an array
    if (paramsObj[key]) {
      if (Array.isArray(paramsObj[key])) {
        paramsObj[key].push(value);
      } else {
        paramsObj[key] = [paramsObj[key], value];
      }
    } else {
      paramsObj[key] = value;
    }
  });

  const result = schema.safeParse(paramsObj);
  if (!result.success) {
    console.warn(
      "⚠️ [URL Param Validation Failed]: falling back to defaults",
      result.error.format()
    );
    // Safe recovery fallback by returning the schema's default parser result
    try {
      return schema.parse({});
    } catch {
      // If schema has no defaults defined, extract individual element fallbacks or throw a safe empty object
      return {} as any;
    }
  }

  return result.data;
}

/**
 * Safely serializes an object into URLSearchParams matching a Zod schema.
 * Filters out null, undefined, and empty string values to prevent URL bloat.
 *
 * @param params Flat key-value object containing search param states
 */
export function serializeSearchParams<T extends Record<string, any>>(
  params: T
): URLSearchParams {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null && v !== "") {
          search.append(key, String(v));
        }
      });
    } else {
      search.set(key, String(value));
    }
  });

  return search;
}
