import {
  useFormFacade,
  type UseFormFacadeOptions,
  type UseFormFacadeResult,
} from "./useFormFacade";

/**
 * @file useMDAPForm.ts
 *
 * @deprecated Use `useFormFacade` (or `useFormFlow` for flow forms).
 * Kept as a semantic alias — same implementation, reasoned about via
 * `EntityDefinition<T>`.
 */
export const useMDAPForm = useFormFacade;
export type UseMDAPFormOptions<T extends Record<string, any>> =
  UseFormFacadeOptions<T>;
export type UseMDAPFormResult<T extends Record<string, any>> =
  UseFormFacadeResult<T>;

/**
 * useEntityForm
 *
 * @deprecated Alias of `useFormFacade`.
 * Ideal for developers reasoning in terms of `EntityDefinition<T>`.
 */
export const useEntityForm = useFormFacade;
export type UseEntityFormOptions<T extends Record<string, any>> =
  UseFormFacadeOptions<T>;
export type UseEntityFormResult<T extends Record<string, any>> =
  UseFormFacadeResult<T>;