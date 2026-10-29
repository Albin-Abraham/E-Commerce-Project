// import { TokenManager } from "@features/sfm_permission/services/TokenManager";
// import { AuthService } from "@features/sfm_permission/services/AuthServices";

// type ResolveFn = (token?: string) => void;

class RequestQueueManager {
  // private _isRefreshing = false;
  // private _queue: ResolveFn[] = [];

  /**
   * Central method to get a valid token.
   * If the current token is expired, it triggers a refresh.
   * All requests wait for the refresh to complete before continuing.
   */
  async getValidToken(): Promise<string | null> {
    // TODO: Implement TokenManager/AuthService safely
    return null;
    /*
    const tokens = TokenManager.getTokens();
    const accessToken = tokens?.access;

    if (accessToken && (await AuthService.validToken(accessToken))) {
      return accessToken; // Token still valid
    }

    if (this.isRefreshing) {
      // Already refreshing: queue this request
      return new Promise((resolve) => {
        this.queue.push(resolve);
      });
    }

    // Start refresh
    this.isRefreshing = true;

    try {
      if (!tokens?.refresh) throw new Error("No refresh token available");

      const newTokens = await AuthService.refreshToken(tokens.refresh);
      TokenManager.setTokens(newTokens);

      // Resolve all queued requests with the new access token
      this.queue.forEach((cb) => cb(newTokens.access));
      this.queue = [];

      return newTokens.access;
    } catch (err) {
      // Reject all queued requests
      this.queue.forEach((cb) => cb(undefined));
      this.queue = [];
      TokenManager.clearTokens();
      return null;
    } finally {
      this.isRefreshing = false;
    }
    */
  }

  /**
   * Simple JWT expiry check
   */
  // private _isTokenValid(token?: string): boolean {
  //   if (!token) return false;
  //   return false; // Stubbed
  /*
  try {
    AuthService.validToken(token);
  } catch {
    return false;
  }
  */
  // }
}

export const requestQueueManager = new RequestQueueManager();
