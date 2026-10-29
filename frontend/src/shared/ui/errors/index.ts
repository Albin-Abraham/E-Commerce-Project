export { TimeoutErrorState } from "./TimeoutErrorState";
export { NetworkErrorState } from "./NetworkErrorState";
export { NotFoundErrorState } from "./NotFoundErrorState";
export { ForbiddenErrorState } from "./ForbiddenErrorState";
export { ServerErrorState } from "./ServerErrorState";
export type { ErrorStateProps } from "./TimeoutErrorState";

export type ErrorClassification =
  | "timeout"
  | "network"
  | "not-found"
  | "forbidden"
  | "server";

export interface ResolvedErrorInfo {
  type: ErrorClassification;
  title?: string;
  message?: string;
  code?: string;
}

/**
 * Classifies raw runtime errors or HTTP route errors into structured error types
 */
export function classifyError(error: unknown, isRouteError?: boolean): ResolvedErrorInfo {
  const err = error as any;
  const status = isRouteError && typeof err?.status === "number" ? err.status : err?.status || err?.response?.status;
  const rawCode = err?.code || (error instanceof Error ? error.name : "");
  const rawMsg =
    (typeof err?.data === "string"
      ? err.data
      : err?.data?.message || (error instanceof Error ? error.message : String(error || ""))) || "";

  // 1. Timeout detection (408, 504, ECONNABORTED, TIMEOUT_ERROR, ETIMEDOUT)
  if (
    status === 408 ||
    status === 504 ||
    rawCode === "ECONNABORTED" ||
    rawCode === "TIMEOUT_ERROR" ||
    rawCode === "ETIMEDOUT" ||
    rawMsg.toLowerCase().includes("timeout")
  ) {
    return {
      type: "timeout",
      title: "Request Timed Out",
      message:
        "The server took too long to respond. This might be due to high network latency or heavy background processing.",
      code: rawCode || `HTTP_${status || 408}_TIMEOUT`,
    };
  }

  // 2. Network disconnection detection
  if (
    rawCode === "ERR_NETWORK" ||
    rawMsg.toLowerCase().includes("network error") ||
    rawMsg.toLowerCase().includes("failed to fetch")
  ) {
    return {
      type: "network",
      title: "Network Connection Lost",
      message:
        "Unable to establish a connection to the platform gateway. Please verify your internet connection.",
      code: "ERR_NETWORK_DISCONNECTED",
    };
  }

  // 3. Not Found (404)
  if (status === 404 || rawMsg.toLowerCase().includes("not found")) {
    return {
      type: "not-found",
      title: "Resource Not Found",
      message: "The requested resource, record, or route could not be found.",
      code: "HTTP_404_NOT_FOUND",
    };
  }

  // 4. Forbidden / Unauthorized (403 / 401)
  if (status === 403 || status === 401) {
    return {
      type: "forbidden",
      title: status === 401 ? "Session Required" : "Access Denied",
      message:
        status === 401
          ? "Please authenticate to access this module."
          : "You do not have the required permissions to perform this action.",
      code: `HTTP_${status}`,
    };
  }

  // 5. Default: Server / Runtime exception
  return {
    type: "server",
    title: status ? `Error ${status}` : "Component Logic Interrupted",
    message: rawMsg || "A runtime exception occurred in this module.",
    code: rawCode || (status ? `HTTP_${status}` : "RUNTIME_EXCEPTION"),
  };
}
