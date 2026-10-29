import type { AxiosInstance } from "axios";

export interface PluginOptions {
  [key: string]: unknown;
}

/**
 * Result of a single plugin attachment.
 */
export interface PluginResult {
  name: string;
  success: boolean;
  error?: Error;
}

/**
 * Summary of all plugin attachment attempts.
 */
export interface AttachmentResult {
  success: boolean;
  plugins: PluginResult[];
  criticalFailures: string[];
}

export interface PluginModule {
  name: string;
  enabled: (type: "public" | "auth") => boolean;
  apply: (instance: AxiosInstance, options?: PluginOptions) => void;
}
