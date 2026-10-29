/**
 * @file paths.ts
 * @description Deep dot-notation path generation and type-safe value extraction.
 *
 * Provides autocomplete-friendly type utilities for nested form models, enabling
 * instant IDE suggestions for field names (e.g., "address.city", "users.0.email")
 * while strictly preserving backward compatibility for dynamic and untyped forms.
 *
 * @module DomainPaths
 */

/** Maximum recursive depth counter for path traversal to protect tsc performance */
type Prev = [never, 0, 1, 2, 3, 4, ...never[]];

/** Primitive types that must not be recursed into */
type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | undefined
  | null
  | Function
  | Date
  | RegExp;

/**
 * Recursively generates dot-delimited path strings for an object type T.
 * Supports nested objects, records, and array indices.
 *
 * @example
 * interface User {
 *   name: string;
 *   address: { city: string; zip: string };
 *   tags: string[];
 * }
 * // FieldPath<User> = "name" | "address" | "address.city" | "address.zip" | "tags" | `tags.${number}`
 */
export type FieldPath<T, Depth extends number = 3> = [Depth] extends [never]
  ? never
  : T extends Primitive
  ? never
  : T extends readonly (infer Element)[]
  ? `${number}` | (Element extends Primitive ? never : Element extends object ? `${number}.${FieldPath<Element, Prev[Depth]>}` : never)
  : T extends object
  ? {
      [K in keyof T & string]:
        | K
        | (T[K] extends Primitive
            ? never
            : T[K] extends readonly (infer Element)[]
            ? `${K}.${number}` | (Element extends Primitive ? never : Element extends object ? `${K}.${number}.${FieldPath<Element, Prev[Depth]>}` : never)
            : T[K] extends object
            ? `${K}.${FieldPath<T[K], Prev[Depth]>}`
            : never);
    }[keyof T & string]
  : never;

/**
 * Autocomplete-friendly field path allowing known schema paths with dynamic string fallback.
 * The `(string & {})` idiom prevents TypeScript from collapsing the union into `string`.
 */
export type AutocompletePath<T> = [FieldPath<T>] extends [never]
  ? string
  : FieldPath<T> | (string & {});

/**
 * Extracts the value type at a dot-delimited path P within object type T.
 *
 * @example
 * PathValue<User, "address.city"> // string
 * PathValue<User, "tags.0">       // string
 */
export type PathValue<T, P extends string> = P extends `${infer Key}.${infer Rest}`
  ? Key extends `${infer ArrayKey}[${number}]`
    ? ArrayKey extends keyof T
      ? T[ArrayKey] extends readonly (infer Item)[]
        ? PathValue<Item, Rest>
        : never
      : never
    : Key extends keyof T
    ? PathValue<T[Key], Rest>
    : Key extends `${number}`
    ? T extends readonly (infer Item)[]
      ? PathValue<Item, Rest>
      : never
    : unknown
  : P extends `${infer ArrayKey}[${number}]`
  ? ArrayKey extends keyof T
    ? T[ArrayKey] extends readonly (infer Item)[]
      ? Item
      : never
    : never
  : P extends keyof T
  ? T[P]
  : P extends `${number}`
  ? T extends readonly (infer Item)[]
    ? Item
    : never
  : unknown;
