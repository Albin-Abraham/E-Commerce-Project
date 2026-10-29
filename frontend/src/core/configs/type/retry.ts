import type { AxiosError } from "axios";

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryCondition: (error: AxiosError) => boolean;
}
