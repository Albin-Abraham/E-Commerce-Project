// src/core/http/http.auth-queue.ts

/**
 * Token Refresh Mutex and Concurrency Queue.
 *
 * Ensures that when multiple concurrent requests encounter 401 Unauthorized errors,
 * only a single token refresh request is dispatched. All other pending requests are
 * queued and automatically replayed with the new access token.
 */

type PendingRequestCallback = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

export class TokenRefreshQueue {
  private static instance: TokenRefreshQueue;
  private isRefreshing = false;
  private pendingQueue: PendingRequestCallback[] = [];

  private constructor() {}

  public static getInstance(): TokenRefreshQueue {
    if (!TokenRefreshQueue.instance) {
      TokenRefreshQueue.instance = new TokenRefreshQueue();
    }
    return TokenRefreshQueue.instance;
  }

  /**
   * Executes or queues a request requiring a refreshed token.
   *
   * @param refreshTokenFn Async function that calls the refresh token API endpoint.
   * @param retryRequestFn Async function that replays the original request with the new token.
   */
  public async handle401<T>(
    refreshTokenFn: () => Promise<string>,
    retryRequestFn: (newToken: string) => Promise<T>
  ): Promise<T> {
    if (this.isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        this.pendingQueue.push({ resolve, reject });
      }).then((newToken) => retryRequestFn(newToken));
    }

    this.isRefreshing = true;

    try {
      const newToken = await refreshTokenFn();
      this.processQueue(null, newToken);
      return await retryRequestFn(newToken);
    } catch (error) {
      this.processQueue(error, null);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private processQueue(error: unknown, token: string | null = null): void {
    this.pendingQueue.forEach((callback) => {
      if (error) {
        callback.reject(error);
      } else if (token) {
        callback.resolve(token);
      }
    });
    this.pendingQueue = [];
  }

  /**
   * Resets the refresh queue state (e.g. on manual logout).
   */
  public reset(): void {
    this.isRefreshing = false;
    this.pendingQueue = [];
  }
}

export const authRefreshQueue = TokenRefreshQueue.getInstance();
