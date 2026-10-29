// core/http/http.transformer.ts

/**
 * HTTP Payload Transformer
 *
 * Provides recursive utilities for converting object keys between different casing styles.
 * Essential for bridging CamelCase (Frontend) and snake_case (Backend) architectures.
 */

const toCamel = (s: string) => {
  return s.replace(/([-_][a-z])/gi, ($1) => {
    return $1.toUpperCase().replace(/-/g, "").replace(/_/g, "");
  });
};

const toSnake = (s: string) => {
  return s.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

const isObject = (o: unknown) => {
  return o === Object(o) && !Array.isArray(o) && typeof o !== "function";
};

/**
 * Recursively converts object keys to camelCase.
 *
 * @param data - The data to transform
 * @param options.deep - Whether to transform nested objects (default: true)
 * @param options.maxDepth - Maximum depth for recursion (default: 10)
 */
export const toCamelCase = <T>(
  data: any,
  options: { deep?: boolean; maxDepth?: number; depth?: number } = {}
): T => {
  const { deep = true, maxDepth = 10, depth = 0 } = options;

  if (depth > maxDepth) return data;
  if (!data || (!isObject(data) && !Array.isArray(data))) return data;

  if (Array.isArray(data)) {
    return data.map((v) =>
      toCamelCase(v, { deep, maxDepth, depth: depth + 1 })
    ) as any;
  }

  const n: any = {};
  Object.keys(data).forEach((k) => {
    const value = data[k];
    const newKey = toCamel(k);

    if (deep && (isObject(value) || Array.isArray(value))) {
      n[newKey] = toCamelCase(value, { deep, maxDepth, depth: depth + 1 });
    } else {
      n[newKey] = value;
    }
  });

  return n;
};

/**
 * Recursively converts object keys to snake_case.
 */
export const toSnakeCase = <T>(data: any): T => {
  if (Array.isArray(data)) {
    return data.map((v) => toSnakeCase(v)) as any;
  }

  if (isObject(data)) {
    const n: any = {};

    Object.keys(data).forEach((k) => {
      n[toSnake(k)] = toSnakeCase(data[k]);
    });

    return n;
  }

  return data;
};

/**
 * Automatically unwraps standard API Envelopes (e.g. { data: [...], meta: {...}, status: "success" })
 * This prevents developers from having to manually type `response.data.data.products`.
 *
 * @param responseData The raw response body from the server
 */
export const unwrapEnvelope = (
  responseData: any
): { data: any; meta?: any } => {
  if (
    isObject(responseData) &&
    ("data" in responseData ||
      "detail" in responseData ||
      "results" in responseData ||
      "items" in responseData ||
      "meta" in responseData)
  ) {
    const data =
      responseData.data !== undefined
        ? responseData.data
        : responseData.detail !== undefined
        ? responseData.detail
        : responseData.results !== undefined
        ? responseData.results
        : responseData.items !== undefined
        ? responseData.items
        : responseData;

    return {
      data,
      meta: responseData.meta,
    };
  }
  return { data: responseData };
};

export const HttpTransformer = {
  toCamelCase,
  toSnakeCase,
  unwrapEnvelope,
};
