// src/axios/interceptors/AttachInterceptors.ts
/**
 * Interceptor Attachment Module
 *
 * Manages the attachment of interceptor plugins to Axios instances.
 * Prevents duplicate attachments and handles plugin errors gracefully.
 *
 * @version 0.0.1
 */
import type { AxiosInstance } from "axios";

import type {
  AttachmentResult,
  PluginModule,
  PluginResult,
} from "@configs/type/interceptor";

import { interceptorPlugins } from "./interceptors";

/**
 * Tracks instances that have already had interceptors attached.
 */
const attachedInstances = new WeakSet<AxiosInstance>();

/**
 * Interceptors that are critical to Axios functionality.
 */
const CRITICAL_PLUGINS = new Set(["auth", "retry", "logger"]);

/**
 * Plugin-specific configuration that may be passed in.
 */
export interface PluginOptions {
  [key: string]: unknown;
}

/**
 * Validate plugin structure.
 */
const isValidPlugin = (plugin: PluginModule): boolean => {
  return (
    plugin &&
    typeof plugin.name === "string" &&
    typeof plugin.enabled === "function" &&
    typeof plugin.apply === "function"
  );
};

/**
 * Attaches plugins to an Axios instance.
 * Prevents re-attachment and handles failures gracefully.
 *
 * @param instance - Axios instance to attach plugins to
 * @param type - 'public' or 'auth'
 * @param options - Optional config for plugins
 * @returns Attachment summary
 */
export const attachInterceptors = (
  instance: AxiosInstance,
  type: "public" | "auth",
  options?: PluginOptions
): AttachmentResult => {
  if (attachedInstances.has(instance)) {
    return {
      success: true,
      plugins: [],
      criticalFailures: [],
    };
  }

  const results: PluginResult[] = [];
  const criticalFailures: string[] = [];

  for (const plugin of interceptorPlugins) {
    try {
      if (!isValidPlugin(plugin)) {
        const error = new Error(
          `Invalid plugin interface: ${plugin?.name || "unknown"}`
        );
        results.push({
          name: plugin?.name || "unknown",
          success: false,
          error,
        });
        continue;
      }

      if (plugin.enabled(type)) {
        plugin.apply(instance, options); // pass plugin options
        results.push({ name: plugin.name, success: true });

        if (process.env.NODE_ENV === "development") {
          console.info(`✅ Attached plugin: ${plugin.name} [${type}]`);
        }
      }
    } catch (error) {
      const pluginError =
        error instanceof Error ? error : new Error(String(error));
      results.push({ name: plugin.name, success: false, error: pluginError });

      if (CRITICAL_PLUGINS.has(plugin.name)) {
        criticalFailures.push(plugin.name);
      }

      if (process.env.NODE_ENV === "development") {
        console.warn(`❌ Failed to attach plugin: ${plugin.name}`, pluginError);
      }
    }
  }

  attachedInstances.add(instance);

  const result: AttachmentResult = {
    success: criticalFailures.length === 0,
    plugins: results,
    criticalFailures,
  };

  if (criticalFailures.length > 0) {
    throw new Error(
      `Critical plugin attachment failed: ${criticalFailures.join(", ")}`
    );
  }

  return result;
};
