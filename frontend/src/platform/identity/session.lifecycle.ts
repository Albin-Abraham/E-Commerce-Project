/**
 * Platform Identity: Session Lifecycle & Refresh Queue
 *
 * Coordinates proactive token refresh, expiration checks, and session revocation.
 */

export class SessionLifecycle {
  private static refreshPromise: Promise<string | null> | null = null;

  /**
   * Checks if an expiration timestamp has lapsed (with a 30s safety buffer).
   */
  public static isExpired(expiresAt?: string): boolean {
    if (!expiresAt) return false;
    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    return now >= expiryTime - 30000;
  }

  /**
   * Serializes multiple simultaneous refresh calls into a single in-flight promise.
   */
  public static async executeRefresh(
    refreshFn: () => Promise<string | null>
  ): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        return await refreshFn();
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}
