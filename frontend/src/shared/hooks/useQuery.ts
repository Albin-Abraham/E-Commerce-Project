// services/hooks/useQuery.ts
import { useMemo } from "react";

import { HttpError } from "@core/http";
import type { HttpResponse } from "@core/http";
import { useQuery as useTanStackQuery } from "@tanstack/react-query";
import { z } from "zod";

import { LoaderFactory } from "@services/helpers/loading-factory";
import { UIScope } from "@services/helpers/loading-ui.enum";
import { httpClient } from "@services/http.instance";

export interface UseQueryOptions<T> {
  loaderKey: string;
  scope?: UIScope;
  enabled?: boolean;
  staleTime?: number;
  timeout?: number;
  retry?: boolean | number;
  retryDelay?: number;
  params?: Record<string, any>;
  onSuccess?: (data: T) => void;
  onError?: (error: HttpError) => void;
  select?: (data: HttpResponse<T>) => T;
  schema?: z.ZodType<T>;
}

export interface UseQueryResult<T> {
  data: T | null;
  error: HttpError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<any>;
  cancel: () => void;
}

/**
 * Elite useQuery Hook
 *
 * A thin, Zenith-flavored wrapper around TanStack Query.
 * Offloads lifecycle, caching, and deduplication to the library while
 * maintaining the project's LoadingContext and Zod validation patterns.
 */
export function useQuery<T = unknown>(
  url: string | null,
  options: UseQueryOptions<T>
): UseQueryResult<T> {
  const {
    loaderKey,
    scope,
    enabled = true,
    staleTime = 0,
    retry = 3,
    params,
    schema,
    select,
  } = options;

  // 1. Stable Query Key (Industry Standard)
  const queryKey = useMemo(() => [url, params], [url, params]);

  // 2. TanStack Orchestration
  const query = useTanStackQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const loader = LoaderFactory.create(loaderKey, scope);
      loader.start();

      try {
        const response = await httpClient.auth.get<T>(url!, {
          params,
          signal,
          timeout: options.timeout,
        });

        let data = select ? select(response) : response.data;

        // 3. Zenith Validation Layer
        if (schema) {
          data = schema.parse(data);
        }

        loader.success();
        options.onSuccess?.(data);
        return data;
      } catch (err) {
        const httpError = err as HttpError;
        loader.error(httpError.message);
        options.onError?.(httpError);
        throw httpError;
      }
    },
    enabled: enabled && !!url,
    staleTime,
    retry,
  });

  // 4. Sync with legacy cancel pattern if needed
  const cancel = () => {
    // TanStack handles cancellation via AbortSignal automatically
  };

  return {
    data: query.data ?? null,
    error: (query.error as HttpError) ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
    cancel,
  };
}
