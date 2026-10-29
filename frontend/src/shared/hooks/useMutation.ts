import { HttpError } from "@core/http";
import type { HttpRequestConfig, HttpResponse } from "@core/http";
import {
  useQueryClient,
  useMutation as useTanStackMutation,
} from "@tanstack/react-query";

import { LoaderFactory } from "@services/helpers/loading-factory";
import { UIScope } from "@services/helpers/loading-ui.enum";
import { httpClient } from "@services/http.instance";

export interface UseMutationOptions<TData, TVariables, TContext = any> {
  loaderKey: string;
  scope?: UIScope;
  timeout?: number;
  invalidateKeys?: readonly unknown[][];
  optimisticUpdate?: (variables: TVariables, currentCache: any) => any;
  queryKeyToUpdate?: readonly unknown[];
  onSuccess?: (data: HttpResponse<TData>, variables: TVariables) => void;
  onError?: (
    error: HttpError,
    variables: TVariables,
    context?: TContext
  ) => void;
  onMutate?: (
    variables: TVariables
  ) => Promise<TContext | undefined> | TContext | undefined | void;
  onSettled?: (
    data: HttpResponse<TData> | null,
    error: HttpError | null,
    variables: TVariables,
    context?: TContext
  ) => void;
}

export interface UseMutationResult<TData, TVariables> {
  data: TData | null;
  error: HttpError | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isError: boolean;
  isSuccess: boolean;
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<HttpResponse<TData>>;
  reset: () => void;
}

/**
 * Elite useMutation Hook (V2)
 *
 * A thin wrapper around TanStack Query's useMutation.
 * Synchronizes with the project's LoadingContext while leveraging
 * TanStack's robust mutation lifecycle, supporting optimistic cache sets,
 * automatic cache invalidations, and automatic rollback triggers.
 */
export function useMutation<
  TData = unknown,
  TVariables = unknown,
  TContext = any,
>(
  mutationFn: (variables: TVariables) => HttpRequestConfig,
  options: UseMutationOptions<TData, TVariables, TContext>
): UseMutationResult<TData, TVariables> {
  const {
    loaderKey,
    scope,
    onMutate,
    onSuccess,
    onError,
    onSettled,
    invalidateKeys,
    optimisticUpdate,
    queryKeyToUpdate,
  } = options;

  const queryClient = useQueryClient();

  const mutation = useTanStackMutation<
    HttpResponse<TData>,
    HttpError,
    TVariables,
    TContext
  >({
    mutationFn: async (variables: TVariables) => {
      const loader = LoaderFactory.create(loaderKey, scope);
      loader.submitting();

      try {
        const config = mutationFn(variables);
        const response = await httpClient.auth.request<TData>({
          ...config,
          timeout: options.timeout,
        });

        loader.success();
        return response;
      } catch (err) {
        const httpError = err as HttpError;
        loader.error(httpError.message);
        throw httpError;
      }
    },
    onMutate: async (variables) => {
      let customContext: any = undefined;
      if (onMutate) {
        customContext = await onMutate(variables);
      }

      if (queryKeyToUpdate) {
        // Cancel outgoing queries for target key to prevent race conditions
        await queryClient.cancelQueries({ queryKey: queryKeyToUpdate });

        // Snapshot current cache state
        const previousData = queryClient.getQueryData(queryKeyToUpdate);

        // Optimistically set the cache
        if (optimisticUpdate) {
          queryClient.setQueryData(queryKeyToUpdate, (old: any) =>
            optimisticUpdate(variables, old)
          );
        }

        return { ...customContext, previousData } as any;
      }

      return customContext;
    },
    onSuccess: (response, variables) => onSuccess?.(response, variables),
    onError: (error, variables, context) => {
      // Rollback to prior data snapshot if error occurs
      if (
        queryKeyToUpdate &&
        context &&
        (context as any).previousData !== undefined
      ) {
        queryClient.setQueryData(
          queryKeyToUpdate,
          (context as any).previousData
        );
      }
      onError?.(error, variables, context);
    },
    onSettled: async (data, error, variables, context) => {
      // Auto-invalidate declared keys
      if (invalidateKeys && invalidateKeys.length > 0) {
        await Promise.all(
          invalidateKeys.map((key) =>
            queryClient.invalidateQueries({ queryKey: key })
          )
        );
      }
      onSettled?.(data ?? null, error, variables, context);
    },
  });

  return {
    data: mutation.data?.data ?? null,
    error: (mutation.error as HttpError) ?? null,
    isLoading: mutation.isPending,
    isSubmitting: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    reset: mutation.reset,
  };
}
