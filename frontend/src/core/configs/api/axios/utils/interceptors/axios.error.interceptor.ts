// src/configs/api/axios/interceptor/axios.error.interceptor.ts
import axios, { type AxiosError, type AxiosInstance } from "axios";

import { parseAxiosError } from "@configs/api/axios/utils/axios.parse-error";
import type { PluginModule } from "@configs/type/interceptor";

/**
 * Error Interceptor Plugin
 *
 * Attaches a global response error interceptor that logs structured error info.
 */
export const ErrorInterceptorPlugin: PluginModule = {
  name: "ErrorInterceptor",

  enabled: () => import.meta.env.MODE === "development",

  apply: (axiosInstance: AxiosInstance) => {
    axiosInstance.interceptors.response.use(
      (response) => response,
      (axiosError: AxiosError) => {
        // 1. Silently handle request cancellation (prevents uncaught promise noise)
        if (axios.isCancel(axiosError)) {
          return Promise.reject(axiosError);
        }

        try {
          const parsed = parseAxiosError(axiosError);

          console.error(`[API Error] ${parsed.message}`, {
            endpoint: parsed.endpoint,
            method: parsed.method,
            status: parsed.status,
            details: parsed.details,
            isNetworkError: parsed.isNetworkError,
            timestamp: parsed.timestamp.toISOString(),
          });
        } catch (logError) {
          console.warn("⚠️ Failed to parse/log Axios error", logError);
        }

        return Promise.reject(axiosError);
      }
    );
  },
};
