import { useCallback, useRef } from "react";

import type { FileUploadConfig } from "@core/http";
import { HttpError } from "@core/http";
import type { HttpResponse } from "@core/http";

import { LoaderFactory } from "@services/helpers/loading-factory";
import { UIScope } from "@services/helpers/loading-ui.enum";
import { useLoader } from "@services/helpers/loading.hook";
import { httpClient } from "@services/http.instance";

/**
 * File upload options with loading context integration
 */
export interface UseFileUploadOptions<T> {
  /** Unique key for loading state */
  loaderKey: string;

  /** UI scope for loading context */
  scope?: UIScope;

  /** Request timeout in milliseconds */
  timeout?: number;

  /** Retry failed uploads */
  retry?: boolean | number;

  /** Retry delay in milliseconds */
  retryDelay?: number;

  /** Success callback */
  onSuccess?: (data: HttpResponse<T>) => void;

  /** Error callback */
  onError?: (error: HttpError) => void;

  /** Progress callback */
  onProgress?: (percentage: number) => void;
}

/**
 * File upload result with loading context
 */
export interface UseFileUploadResult<T> {
  data: T | null;
  error: HttpError | null;
  isUploading: boolean;
  isError: boolean;
  isSuccess: boolean;
  progress: number;
  upload: (
    file: File,
    config?: Partial<FileUploadConfig>
  ) => Promise<HttpResponse<T>>;
  reset: () => void;
}

/**
 * Hook for file uploads with integrated loading context
 *
 * Uses the existing LoadingContext system with "Submitting" state for uploads.
 *
 * @example
 * ```tsx
 * const { upload, isUploading, progress } = useFileUpload<UploadResponse>(
 *   "/api/upload",
 *   {
 *     loaderKey: "FILE_UPLOAD",
 *     scope: UIScope.Form,
 *     onProgress: (percentage) => console.log(`${percentage}%`),
 *     onSuccess: (response) => console.log("Uploaded:", response.data)
 *   }
 * );
 *
 * const handleFileChange = (e) => {
 *   const file = e.target.files[0];
 *   upload(file, { fields: { userId: 123 } });
 * };
 * ```
 */
export function useFileUpload<T = unknown>(
  url: string,
  options: UseFileUploadOptions<T>
): UseFileUploadResult<T> {
  const {
    loaderKey,
    scope,
    timeout,
    retry = false,
    retryDelay = 1000,
    onSuccess,
    onError,
    onProgress,
  } = options;

  // Use existing loading context
  const loader = LoaderFactory.create(loaderKey, scope);
  const { isSubmitting, isSuccess, isError } = useLoader(loaderKey);

  // Store data, error, and progress in refs
  const dataRef = useRef<T | null>(null);
  const errorRef = useRef<HttpError | null>(null);
  const progressRef = useRef<number>(0);
  const retryCountRef = useRef(0);

  const upload = useCallback(
    async (
      file: File,
      config: Partial<FileUploadConfig> = {}
    ): Promise<HttpResponse<T>> => {
      loader.submitting("Uploading file...");
      errorRef.current = null;
      progressRef.current = 0;
      retryCountRef.current = 0;

      const attemptUpload = async (): Promise<HttpResponse<T>> => {
        try {
          const response = await httpClient.auth.uploadFile<T>(url, {
            file,
            ...config,
            onProgress: (percentage: number) => {
              progressRef.current = percentage;
              onProgress?.(percentage);
            },
          });

          dataRef.current = response.data;
          progressRef.current = 100;
          loader.success("Upload complete");

          onSuccess?.(response);
          return response;
        } catch (error) {
          const httpError =
            error instanceof HttpError
              ? error
              : new HttpError(
                  error instanceof Error ? error.message : "Upload failed",
                  0,
                  "",
                  error,
                  { url, method: "POST" },
                  true
                );

          // Retry logic with exponential backoff
          if (retry) {
            const maxRetries = typeof retry === "number" ? retry : 3;
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++;
              const delay = retryDelay * Math.pow(2, retryCountRef.current - 1);

              loader.submitting(
                `Retrying upload (${retryCountRef.current}/${maxRetries})...`
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
              return attemptUpload();
            }
          }

          errorRef.current = httpError;
          progressRef.current = 0;
          loader.error(httpError.message);

          onError?.(httpError);
          throw httpError;
        }
      };

      return attemptUpload();
    },
    [url, timeout, retry, retryDelay, onSuccess, onError, onProgress, loader]
  );

  const reset = useCallback(() => {
    dataRef.current = null;
    errorRef.current = null;
    progressRef.current = 0;
    loader.reset();
  }, [loader]);

  return {
    data: dataRef.current,
    error: errorRef.current,
    isUploading: isSubmitting,
    isError,
    isSuccess,
    progress: progressRef.current,
    upload,
    reset,
  };
}
