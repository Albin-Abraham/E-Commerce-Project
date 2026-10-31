/**
 * Platform Networking: Retry Policy
 *
 * Enforces resilient HTTP retry semantics with jittered exponential backoff.
 * Invariant: ONLY idempotent HTTP methods (GET, HEAD, OPTIONS) are eligible for retry.
 * Non-idempotent mutations (POST, PUT, PATCH, DELETE) are strictly non-retryable.
 */

import { ApiError } from "./api-error";

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
}

export class RetryPolicy {
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly backoffFactor: number;

  constructor(options: RetryOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 300;
    this.maxDelayMs = options.maxDelayMs ?? 3000;
    this.backoffFactor = options.backoffFactor ?? 2;
  }

  /**
   * Evaluates if a request is safe and eligible to be retried.
   */
  public isRetryable(method: string, error: unknown): boolean {
    const isIdempotent = ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
    if (!isIdempotent) return false;

    if (error instanceof ApiError) {
      return error.isTransient();
    }

    if (error instanceof TypeError) {
      // Fetch throws TypeError on network disconnect / DNS error
      return true;
    }

    return false;
  }

  /**
   * Executes an operation with exponential backoff and jitter.
   */
  public async execute<T>(
    operation: () => Promise<T>,
    method = "GET"
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await operation();
      } catch (err) {
        attempt++;
        if (attempt > this.maxRetries || !this.isRetryable(method, err)) {
          throw err;
        }

        const delay = this.calculateDelay(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Calculates exponential delay with full jitter: delay * (0.5 + Math.random() * 0.5)
   */
  private calculateDelay(attempt: number): number {
    const exponential = this.baseDelayMs * Math.pow(this.backoffFactor, attempt - 1);
    const capped = Math.min(exponential, this.maxDelayMs);
    const jitter = 0.5 + Math.random() * 0.5;
    return Math.round(capped * jitter);
  }
}
