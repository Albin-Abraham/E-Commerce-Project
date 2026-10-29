// core/http/http.resilience.ts
import { HttpError } from "./http.error";

/**
 * Supervised Execution: Adds a hard timeout to any promise.
 * Returns a 408 Timeout error if the threshold is exceeded.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
  message: string = "Request timed out"
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new HttpError(message, 408, "Request Timeout", {
          code: "TIMEOUT_ERROR",
        })
      );
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Windowing Helper: Prevents rapid-fire execution by adding a delay window.
 */
export function createDelayWindow(ms: number = 50) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function execute<T>(fn: () => Promise<T>): Promise<T | void> {
    if (timeoutId) clearTimeout(timeoutId);

    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        const result = await fn();
        resolve(result);
      }, ms);
    });
  };
}
