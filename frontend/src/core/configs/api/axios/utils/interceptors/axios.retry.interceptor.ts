// src/core/configs/api/axios/utils/interceptors/axios.retry.interceptor.ts
import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

import type { PluginModule } from "@configs/type/interceptor";

import { getRetryConfig } from "../../axios.retry.config";
import { retryCondition } from "../retryCondition";

interface RetryExtendedConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

/**
 * Retry Interceptor Plugin
 *
 * Automatically retries idempotent failed network requests with exponential backoff.
 */
export const RetryInterceptorPlugin: PluginModule = {
  name: "retry",

  enabled: () => true,

  apply: (axiosInstance: AxiosInstance) => {
    const config = getRetryConfig();

    axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Do not retry cancelled requests
        if (axios.isCancel(error)) {
          return Promise.reject(error);
        }

        const reqConfig = error.config as RetryExtendedConfig | undefined;
        if (!reqConfig || !retryCondition(error)) {
          return Promise.reject(error);
        }

        reqConfig.__retryCount = reqConfig.__retryCount || 0;
        if (reqConfig.__retryCount >= config.maxRetries) {
          return Promise.reject(error);
        }

        reqConfig.__retryCount += 1;

        // Exponential backoff delay
        const delay = Math.min(
          config.baseDelay * Math.pow(2, reqConfig.__retryCount - 1),
          config.maxDelay
        );

        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[AxiosRetry] Retrying ${reqConfig.method?.toUpperCase()} ${reqConfig.url} (Attempt ${reqConfig.__retryCount}/${config.maxRetries}) after ${delay}ms`
          );
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        return axiosInstance(reqConfig);
      }
    );
  },
};
