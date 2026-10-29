// src/configs/api/axios/interceptor/axios.log.interceptor.ts
import type { AxiosInstance } from "axios";

import type { PluginModule } from "@configs/type/interceptor";

/**
 * A plugin module for logging Axios requests, responses, and errors.
 *
 * This interceptor plugin conditionally logs different stages of the HTTP request lifecycle
 * (request, response, and error) based on the configuration flags set in `INTERCEPTOR_CONFIG`.
 *
 * @example
 * ```ts
 * import axios from "axios";
 * import { LoggingInterceptorPlugin } from "./Interceptors/LoggingInterceptors";
 *
 * const axiosInstance = axios.create();
 * if (LoggingInterceptorPlugin.enabled()) {
 *   LoggingInterceptorPlugin.apply(axiosInstance);
 * }
 * ```
 */
export const LoggingInterceptorPlugin: PluginModule = {
  /** A unique name for the plugin. */
  name: "LoggingInterceptor",

  /**
   * Determines whether the interceptor should be enabled.
   */
  enabled: () => import.meta.env.MODE === "development",

  /**
   * Applies request, response, and error interceptors to the given Axios instance.
   *
   * @param axiosInstance - The Axios instance to apply the interceptors to.
   */
  apply: (axiosInstance: AxiosInstance) => {
    axiosInstance.interceptors.request.use((config) => {
      if (import.meta.env.MODE === "development") {
        console.log(
          `[Request] ${config.method?.toUpperCase()} ${config.url}`,
          config
        );
      }
      return config;
    });

    axiosInstance.interceptors.response.use(
      (response) => {
        // if (INTERCEPTOR_CONFIG.enableResponseLogs) {
        //   console.log("[Response]", response);
        // }
        return response;
      },
      (error) => {
        // if (INTERCEPTOR_CONFIG.enableErrorLogs) {
        //   console.error("[Error]", error);
        // }
        return Promise.reject(error);
      }
    );
  },
};
